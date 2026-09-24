const Booking = require('../models/Booking');
const Expert = require('../models/Expert');
const Staff = require('../models/Staff');
const mongoose = require('mongoose');
const { AppError } = require('../middleware/errorMiddleware');
const {
  sendBookingConfirmation,
  sendExpertNotification,
  sendCancellationEmail,
  sendStatusUpdateEmail
} = require('../utils/emailService');
const { triggerWaitlistForSlot } = require('../controllers/waitlistController');

class BookingService {
  /**
   * Create a new booking with transaction and slot locking
   */
  async createBooking(value, user, io) {
    const { expertId, slotId, serviceId, date, startTime } = value;

    const expert = await Expert.findById(expertId);
    if (!expert) throw new AppError('Service Provider not found', 404);

    const service = expert.services.id(serviceId);
    if (!service) throw new AppError('Selected service is not valid', 400);

    const timeSlot = expert.timeSlots.id(slotId);
    if (!timeSlot || timeSlot.isBooked) {
      throw new AppError('This time slot is no longer available', 409);
    }

    const slotDate = new Date(date);
    const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Atomic transaction
    const useTransaction = process.env.NODE_ENV !== 'test';
    let session;
    if (useTransaction) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    try {
      // Double-booking check
      const query = Booking.findOne({ expertId, date: slotDate, startTime });
      if (useTransaction) query.session(session);
      const existingBooking = await query;

      if (existingBooking) {
        if (useTransaction) await session.abortTransaction();
        throw new AppError('This time slot was just booked. Please choose another.', 409);
      }

      // Real payment processing enabled
      const commissionRate = parseInt(process.env.PLATFORM_COMMISSION_RATE) || 10;
      const commissionAmount = service.price * (commissionRate / 100);
      const providerAmount = service.price * (1 - commissionRate / 100);

      const booking = new Booking({
        expertId,
        slotId,
        serviceTitle: service.title,
        price: service.price,
        duration: service.duration,
        customerName: value.customerName || user.name,
        customerEmail: value.customerEmail || user.email,
        customerPhone: value.customerPhone || user.phone || 'N/A',
        customerId: user._id,
        date: slotDate,
        startTime: value.startTime,
        endTime: value.endTime,
        notes: value.notes || '',
        totalAmount: service.price,
        paymentStatus: service.price > 0 ? 'Pending' : 'Paid',
        commissionRate,
        commissionAmount,
        providerAmount,
        bookingId
      });

      if (useTransaction) {
        await booking.save({ session });
        await Expert.updateOne(
          { _id: expertId, 'timeSlots._id': slotId },
          { $set: { 'timeSlots.$.isBooked': true } },
          { session }
        );
        await session.commitTransaction();
      } else {
        await booking.save();
        await Expert.updateOne(
          { _id: expertId, 'timeSlots._id': slotId },
          { $set: { 'timeSlots.$.isBooked': true } }
        );
      }

      // Real-time notification
      if (io) {
        io.to(`expert-${expertId}`).emit('slot-booked', {
          expertId,
          date: slotDate.toISOString().split('T')[0],
          startTime,
          bookingId,
          customerName: booking.customerName
        });
      }

      // Async email
      sendBookingConfirmation(booking, expert.name).catch(console.error);
      sendExpertNotification(booking, expert.email, expert.name).catch(console.error);

      return { booking: { ...booking.toObject(), expertName: expert.name } };

    } catch (transactionError) {
      if (useTransaction) await session.abortTransaction();
      if (transactionError.code === 11000) throw new AppError('This time slot is already booked', 409);
      throw transactionError;
    } finally {
      if (useTransaction) session.endSession();
    }
  }

  /**
   * Update booking status
   */
  async updateStatus(id, status, user, io) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid booking ID', 400);

    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);

    const booking = await Booking.findById(id).populate('expertId', 'name email');
    if (!booking) throw new AppError('Booking not found', 404);

    const isCustomer = booking.customerId.toString() === user._id.toString();
    const isExpert = user.role === 'expert';
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isExpert && !isAdmin) {
      throw new AppError('You are not authorized to update this booking', 403);
    }
    if (isCustomer && !isAdmin && status !== 'Cancelled') {
      throw new AppError('Customers can only cancel bookings', 403);
    }

    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Side effects
    if (status === 'Completed' && previousStatus !== 'Completed') {
      if (booking.assignedStaffId) {
        const staff = await Staff.findById(booking.assignedStaffId);
        if (staff) {
          await staff.updateBookingStats('Completed');
        }
      }
      sendStatusUpdateEmail(booking, booking.expertId.name, status).catch(console.error);
    } else if (status === 'Confirmed' && previousStatus !== 'Confirmed') {
      sendStatusUpdateEmail(booking, booking.expertId.name, status).catch(console.error);
    }

    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      await Expert.updateOne(
        { _id: booking.expertId._id, 'timeSlots.date': booking.date, 'timeSlots.startTime': booking.startTime },
        { $set: { 'timeSlots.$.isBooked': false } }
      );
      const cancelledBy = isCustomer ? 'customer' : isExpert ? 'the expert' : 'admin';
      sendCancellationEmail(booking, booking.expertId.name, cancelledBy).catch(console.error);

      if (io) {
        io.to(`expert-${booking.expertId._id}`).emit('slot-released', {
          expertId: booking.expertId._id,
          startTime: booking.startTime,
          date: booking.date
        });
      }

      triggerWaitlistForSlot({
        expertId: booking.expertId._id,
        companyId: booking.companyId,
        date: booking.date,
        startTime: booking.startTime,
        io
      }).catch(err => console.error('Waitlist trigger error:', err));
    }

    return booking;
  }
}

module.exports = new BookingService();
