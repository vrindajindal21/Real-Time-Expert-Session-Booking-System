const User = require('../models/User');
const Expert = require('../models/Expert');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Category = require('../models/Category');
const { AppError } = require('../middleware/errorMiddleware');

// Category Management

// @desc    Add new category
// @route   POST /api/admin/categories
// @access  Private (admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, icon, description } = req.body;
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) return next(new AppError('Category already exists', 400));

    const category = await Category.create({ name, icon, description });
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle category status
// @route   PATCH /api/admin/categories/:id/toggle
// @access  Private (admin)
exports.toggleCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new AppError('Category not found', 404));

    category.isActive = !category.isActive;
    await category.save();
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private (admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return next(new AppError('Category not found', 404));
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Private (admin)
exports.getStats = async (req, res, next) => {
  try {
    const [userCount, expertCount, bookingCount, transactionData, recentBookings, statusBreakdown] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Expert.countDocuments({ isApproved: true }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { paymentStatus: 'Paid' } },
        { 
          $group: { 
            _id: null, 
            totalGMV: { $sum: '$totalAmount' },
            totalProfit: { $sum: '$commissionAmount' }
          } 
        }
      ]),
      // Last 6 months booking trend
      Booking.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
            profit: { $sum: '$commissionAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 }
      ]),
      // Booking status breakdown
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      users: userCount,
      experts: expertCount,
      bookings: bookingCount,
      gmv: transactionData.length > 0 ? transactionData[0].totalGMV : 0,
      platformProfit: transactionData.length > 0 ? transactionData[0].totalProfit : 0,
      monthlyTrend: recentBookings.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        bookings: item.count,
        revenue: item.revenue,
        profit: item.profit
      })),
      statusBreakdown: statusBreakdown.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with search + role filter + pagination
// @route   GET /api/admin/users
// @access  Private (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const role = req.query.role || '';
    const search = req.query.search || '';

    let query = {};
    if (role && role !== 'all') query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password -passwordResetToken').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    res.json({ users, pagination: { current: page, pages: Math.ceil(total / limit), total } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending experts (awaiting approval)
// @route   GET /api/admin/experts/pending
// @access  Private (admin)
exports.getPendingExperts = async (req, res, next) => {
  try {
    const experts = await Expert.find({ isApproved: false }).sort({ createdAt: -1 });
    res.json({ experts, count: experts.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle expert approval status
// @route   PATCH /api/admin/experts/:id/toggle
// @access  Private (admin)
exports.toggleExpertStatus = async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.params.id });
    if (!expert) return next(new AppError('Expert profile not found for this user', 404));

    expert.isApproved = !expert.isApproved;
    await expert.save();

    res.json({
      message: `Expert ${expert.isApproved ? 'approved' : 'suspended'} successfully`,
      expert
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ban / unban a user
// @route   PATCH /api/admin/users/:id/ban
// @access  Private (admin)
exports.toggleUserBan = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    if (user.role === 'admin') return next(new AppError('Cannot ban an admin account', 403));

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
      message: `User ${user.isActive ? 'activated' : 'banned'} successfully`,
      user: { _id: user._id, name: user.name, isActive: user.isActive }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user (hard delete) — admin only
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));
    if (user.role === 'admin') return next(new AppError('Cannot delete an admin account', 403));

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top performing experts
// @route   GET /api/admin/experts/top
// @access  Private (admin)
exports.getTopExperts = async (req, res, next) => {
  try {
    const topExperts = await Booking.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$expertId',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'experts',
          localField: '_id',
          foreignField: '_id',
          as: 'expert'
        }
      },
      { $unwind: '$expert' },
      {
        $project: {
          name: '$expert.name',
          category: '$expert.category',
          rating: '$expert.rating',
          totalBookings: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json({ topExperts });
  } catch (error) {
    next(error);
  }
};
