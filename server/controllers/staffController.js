const Staff = require('../models/Staff');
const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Get staff personal dashboard
// @route   GET /api/staff/me/dashboard
// @access  Private (Staff)
exports.getStaffDashboard = async (req, res, next) => {
  try {
    const staff = await Staff.findOne({ userId: req.user._id }).populate('companyId', 'name logo');
    if (!staff) return next(new AppError('Staff profile not found', 404));

    const bookings = await Booking.find({ assignedStaffId: staff._id })
      .populate('customerId', 'name email avatar phone')
      .sort({ date: -1, createdAt: -1 });

    const totalRevenue = bookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + (b.price || 0), 0);

    res.json({
      success: true,
      data: {
        profile: staff,
        bookings,
        stats: {
          totalBookings: staff.totalBookings,
          completedBookings: staff.completedBookings,
          rating: staff.rating,
          revenue: totalRevenue
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle staff active status
// @route   PATCH /api/staff/me/status
// @access  Private (Staff)
exports.toggleStaffStatus = async (req, res, next) => {
  try {
    const staff = await Staff.findOne({ userId: req.user._id });
    if (!staff) return next(new AppError('Staff profile not found', 404));

    staff.isActive = !staff.isActive;
    await staff.save();

    res.json({ success: true, isActive: staff.isActive });
  } catch (error) {
    next(error);
  }
};

// @desc    Update staff profile details
// @route   PUT /api/staff/me/profile
// @access  Private (Staff)
exports.updateStaffProfile = async (req, res, next) => {
  try {
    const staff = await Staff.findOne({ userId: req.user._id });
    if (!staff) return next(new AppError('Staff profile not found', 404));

    const { bio, specialization, skills, languages } = req.body;
    
    if (bio) staff.bio = bio;
    if (specialization) staff.specialization = specialization;
    if (skills) staff.skills = skills;
    if (languages) staff.languages = languages;

    await staff.save();
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};
