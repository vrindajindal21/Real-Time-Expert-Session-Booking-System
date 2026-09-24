const Booking = require('../models/Booking');
const Expert = require('../models/Expert');
const mongoose = require('mongoose');
const Joi = require('joi');
const { AppError } = require('../middleware/errorMiddleware');
const BookingService = require('../services/BookingService');

// Validation schema
const bookingSchema = Joi.object({
  expertId: Joi.string().required(),
  slotId: Joi.string().required(),
  serviceId: Joi.string().required(),
  customerName: Joi.string().min(2).max(50).optional(),
  customerEmail: Joi.string().email().optional(),
  customerPhone: Joi.string().min(10).max(15).optional(),
  date: Joi.string().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  notes: Joi.string().max(500).optional().allow('')
});

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (user)
exports.createBooking = async (req, res, next) => {
  try {
    const { error, value } = bookingSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));

    const io = req.app.get('io');
    const result = await BookingService.createBooking(value, req.user, io);
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking: result.booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for the logged-in customer
// @route   GET /api/bookings/my
// @access  Private (user)
exports.getCustomerBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find({ customerId: req.user._id })
        .populate('expertId', 'name category email phone services')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments({ customerId: req.user._id })
    ]);

    res.json({
      bookings,
      pagination: { current: page, pages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for the logged-in expert
// @route   GET /api/bookings/host
// @access  Private (expert)
exports.getExpertBookings = async (req, res, next) => {
  try {
    let expert = await Expert.findOne({ userId: req.user._id });

    // Auto-heal: If expert profile is missing (for older accounts), create it now
    if (!expert) {
      expert = await Expert.create({
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '0000000000',
        experience: 0,
        category: 'Other',
        bio: 'Welcome to your expert profile. Please update your bio and services.',
        isApproved: true,
        isActive: true,
        services: [{ title: 'Introductory Session', price: 0, duration: 30, description: 'Initial consultation' }],
        timeSlots: []
      });
      console.log(`🛠️ Healed missing expert profile for: ${req.user.email}`);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find({ expertId: expert._id })
        .populate('customerId', 'name email avatar phone')
        .populate('assignedStaffId', 'name role')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments({ expertId: expert._id })
    ]);

    // Calculate real revenue from all completed bookings
    const allCompleted = await Booking.find({ expertId: expert._id, status: 'Completed' });
    const revenue = allCompleted.reduce((sum, b) => sum + (b.price || 0), 0);

    res.json({
      bookings,
      revenue,
      expertId: expert._id,
      pagination: { current: page, pages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (expert confirms/completes; user/expert cancels)
// @route   PATCH /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const io = req.app.get('io');

    const booking = await BookingService.updateStatus(id, status, req.user, io);
    res.json({ message: `Booking ${status.toLowerCase()} successfully`, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('expertId', 'name category email phone')
      .populate('customerId', 'name email avatar');

    if (!booking) return next(new AppError('Booking not found', 404));

    // Ensure user can only see their own bookings (unless admin)
    if (
      booking.customerId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'expert'
    ) {
      return next(new AppError('Not authorized to view this booking', 403));
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (admin only)
// @route   GET /api/bookings/all
// @access  Private (admin)
exports.getAllBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';

    let query = {};
    if (status) query.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('expertId', 'name category')
        .populate('customerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    res.json({
      bookings,
      pagination: { current: page, pages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    next(error);
  }
};
