const Booking = require('../models/Booking');
const Company = require('../models/Company');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const { AppError } = require('../middleware/errorMiddleware');
const { sendBookingConfirmation, sendStatusUpdateEmail } = require('../utils/emailService');

// @desc    Get upcoming bookings for company
// @route   GET /api/company/bookings/upcoming
// @access  Private (company_owner, company_staff)
exports.getUpcomingBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, staffId } = req.query;

    // Get user's company
    const company = await Company.findOne({
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Build filter
    const filter = {
      companyId: company._id,
      date: { $gte: new Date() },
      status: { $in: ['Pending', 'Confirmed'] }
    };

    if (status) filter.status = status;
    if (staffId) filter.assignedStaffId = staffId;

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email avatar phone')
      .populate('serviceId', 'title duration meetingType')
      .populate('assignedStaffId', 'userId role')
      .populate({
        path: 'assignedStaffId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort({ date: 1, startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get completed bookings for company
// @route   GET /api/company/bookings/completed
// @access  Private (company_owner, company_staff)
exports.getCompletedBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, staffId, startDate, endDate } = req.query;

    const company = await Company.findOne({
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Build filter
    const filter = {
      companyId: company._id,
      status: 'Completed'
    };

    if (staffId) filter.assignedStaffId = staffId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email avatar phone')
      .populate('serviceId', 'title duration meetingType')
      .populate('assignedStaffId', 'userId role')
      .populate({
        path: 'assignedStaffId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort({ date: -1, startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cancelled bookings for company
// @route   GET /api/company/bookings/cancelled
// @access  Private (company_owner, company_staff)
exports.getCancelledBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, staffId, startDate, endDate } = req.query;

    const company = await Company.findOne({
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Build filter
    const filter = {
      companyId: company._id,
      status: 'Cancelled'
    };

    if (staffId) filter.assignedStaffId = staffId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email avatar phone')
      .populate('serviceId', 'title duration meetingType')
      .populate('assignedStaffId', 'userId role')
      .populate({
        path: 'assignedStaffId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort({ date: -1, startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule booking
// @route   PATCH /api/bookings/reschedule/:id
// @access  Private (company_owner, company_staff, customer)
exports.rescheduleBooking = async (req, res, next) => {
  try {
    const { newDate, newStartTime, newEndTime, reason } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email')
      .populate('companyId', 'name')
      .populate('serviceId', 'title bookingSettings');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check authorization
    const isCustomer = booking.customerId._id.toString() === req.user._id.toString();
    const isCompanyStaff = await Company.findOne({
      _id: booking.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!isCustomer && !isCompanyStaff) {
      return next(new AppError('Not authorized to reschedule this booking', 403));
    }

    // Check reschedule limit
    if (booking.rescheduleCount >= (booking.serviceId?.bookingSettings?.rescheduleLimit || 3)) {
      return next(new AppError('Reschedule limit exceeded', 400));
    }

    // Check if new slot is available
    const existingBooking = await Booking.findOne({
      _id: { $ne: bookingId },
      assignedStaffId: booking.assignedStaffId,
      date: newDate,
      startTime: newStartTime,
      status: { $in: ['Pending', 'Confirmed'] }
    });

    if (existingBooking) {
      return next(new AppError('Time slot already booked', 400));
    }

    // Store old details
    const oldDate = booking.date;
    const oldStartTime = booking.startTime;
    const oldEndTime = booking.endTime;

    // Update booking
    booking.date = newDate;
    booking.startTime = newStartTime;
    booking.endTime = newEndTime;
    booking.rescheduleRequested = true;
    booking.rescheduleCount += 1;
    booking.rescheduleHistory.push({
      oldDate,
      oldStartTime,
      newDate,
      newStartTime,
      requestedBy: req.user._id,
      reason
    });

    await booking.save();

    // Send notifications
    await sendStatusUpdateEmail(booking, 'Rescheduled');

    res.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   PATCH /api/bookings/cancel/:id
// @access  Private (company_owner, company_staff, customer)
exports.cancelBooking = async (req, res, next) => {
  try {
    const { reason, refundAmount } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email')
      .populate('companyId', 'name')
      .populate('serviceId', 'title price bookingSettings');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check authorization
    const isCustomer = booking.customerId._id.toString() === req.user._id.toString();
    const isCompanyStaff = await Company.findOne({
      _id: booking.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!isCustomer && !isCompanyStaff) {
      return next(new AppError('Not authorized to cancel this booking', 403));
    }

    // Check cancellation deadline
    const now = new Date();
    const bookingDateTime = new Date(booking.date);
    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);
    const cancellationDeadline = booking.serviceId?.bookingSettings?.cancellationDeadline || 24;

    if (hoursUntilBooking < cancellationDeadline && !isCompanyStaff) {
      return next(new AppError(`Cannot cancel within ${cancellationDeadline} hours of booking`, 400));
    }

    // Update booking
    booking.status = 'Cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    booking.refundAmount = refundAmount || 0;

    await booking.save();

    // Update service stats
    if (booking.serviceId) {
      await booking.serviceId.updateBookingStats('Cancelled');
    }

    // Update staff stats
    if (booking.assignedStaffId) {
      const Staff = require('../models/Staff');
      const staff = await Staff.findById(booking.assignedStaffId);
      if (staff) {
        await staff.updateBookingStats('Cancelled');
      }
    }

    // Send notifications
    await sendStatusUpdateEmail(booking, 'Cancelled');

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm booking
// @route   PATCH /api/bookings/confirm/:id
// @access  Private (company_owner, company_staff)
exports.confirmBooking = async (req, res, next) => {
  try {
    const { meetingLink, meetingId, meetingPassword } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email')
      .populate('companyId', 'name')
      .populate('serviceId', 'title');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check authorization
    const isCompanyStaff = await Company.findOne({
      _id: booking.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!isCompanyStaff) {
      return next(new AppError('Not authorized to confirm this booking', 403));
    }

    // Update booking
    booking.status = 'Confirmed';
    if (meetingLink) booking.meetingLink = meetingLink;
    if (meetingId) booking.meetingId = meetingId;
    if (meetingPassword) booking.meetingPassword = meetingPassword;

    await booking.save();

    // Send confirmation email
    await sendBookingConfirmation(booking);

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete booking
// @route   PATCH /api/bookings/complete/:id
// @access  Private (company_owner, company_staff)
exports.completeBooking = async (req, res, next) => {
  try {
    const { sessionNotes, sessionSummary, sessionAttachments } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email')
      .populate('serviceId', 'title price');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check authorization
    const isCompanyStaff = await Company.findOne({
      _id: booking.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!isCompanyStaff) {
      return next(new AppError('Not authorized to complete this booking', 403));
    }

    // Update booking
    booking.status = 'Completed';
    booking.sessionNotes = sessionNotes;
    booking.sessionSummary = sessionSummary;
    booking.sessionAttachments = sessionAttachments || [];

    await booking.save();

    // Update service stats
    if (booking.serviceId) {
      await booking.serviceId.updateBookingStats('Completed', booking.totalAmount);
    }

    // Update staff stats
    if (booking.assignedStaffId) {
      const Staff = require('../models/Staff');
      const staff = await Staff.findById(booking.assignedStaffId);
      if (staff) {
        await staff.updateBookingStats('Completed');
      }
    }

    res.json({
      success: true,
      message: 'Booking completed successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking statistics
// @route   GET /api/company/bookings/stats
// @access  Private (company_owner, company_staff)
exports.getBookingStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const company = await Company.findOne({
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Build date filter
    const dateFilter = { companyId: company._id };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Get statistics
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue
    ] = await Promise.all([
      Booking.countDocuments(dateFilter),
      Booking.countDocuments({ ...dateFilter, status: 'Pending' }),
      Booking.countDocuments({ ...dateFilter, status: 'Confirmed' }),
      Booking.countDocuments({ ...dateFilter, status: 'Completed' }),
      Booking.countDocuments({ ...dateFilter, status: 'Cancelled' }),
      Booking.aggregate([
        { $match: { ...dateFilter, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};
