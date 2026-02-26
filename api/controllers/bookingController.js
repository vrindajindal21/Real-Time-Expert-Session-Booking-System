const Booking = require('../models/Booking');
const Expert = require('../models/Expert');
const mongoose = require('mongoose');
const Joi = require('joi');

// Validation schema
const bookingSchema = Joi.object({
  expertId: Joi.string().required(),
  customerName: Joi.string().min(2).max(50).required(),
  customerEmail: Joi.string().email().required(),
  customerPhone: Joi.string().min(10).max(15).required(),
  date: Joi.date().iso().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  notes: Joi.string().max(500).optional()
});

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    // Validate input
    const { error, value } = bookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.details[0].message 
      });
    }

    const { expertId, customerEmail, date, startTime } = value;

    // Check if expert exists
    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({ error: 'Expert not found' });
    }

    // Check if the time slot exists and is available
    const slotDate = new Date(date);
    const timeSlot = expert.timeSlots.find(slot => 
      slot.date.toISOString().split('T')[0] === slotDate.toISOString().split('T')[0] &&
      slot.startTime === startTime &&
      !slot.isBooked
    );

    if (!timeSlot) {
      return res.status(400).json({ error: 'Time slot not available' });
    }

    // Generate unique booking ID
    const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Use session for atomic operations to prevent race conditions
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check for existing booking (double booking prevention)
      const existingBooking = await Booking.findOne({
        expertId,
        date: slotDate,
        startTime
      }).session(session);

      if (existingBooking) {
        await session.abortTransaction();
        return res.status(409).json({ error: 'This time slot is already booked' });
      }

      // Create booking
      const booking = new Booking({
        ...value,
        date: slotDate,
        bookingId
      });

      await booking.save({ session });

      // Mark time slot as booked
      await Expert.updateOne(
        { 
          _id: expertId,
          'timeSlots.date': slotDate,
          'timeSlots.startTime': startTime
        },
        { 
          $set: { 'timeSlots.$.isBooked': true }
        },
        { session }
      );

      await session.commitTransaction();

      // Emit real-time update
      const io = req.app.get('io');
      io.to(`expert-${expertId}`).emit('slot-booked', {
        expertId,
        date: slotDate.toISOString().split('T')[0],
        startTime,
        bookingId
      });

      res.status(201).json({
        message: 'Booking created successfully',
        booking: {
          ...booking.toObject(),
          expertName: expert.name
        }
      });

    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error creating booking:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }
    
    res.status(500).json({ 
      error: 'Failed to create booking',
      message: error.message 
    });
  }
};

// Get bookings by email
exports.getBookingsByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const bookings = await Booking.find({ customerEmail: email })
      .populate('expertId', 'name category email phone')
      .sort({ date: -1, createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      message: error.message 
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('expertId', 'name');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      message: 'Booking status updated successfully',
      booking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ 
      error: 'Failed to update booking status',
      message: error.message 
    });
  }
};
