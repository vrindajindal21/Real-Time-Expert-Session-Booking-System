const Booking = require('../models/Booking');
const Company = require('../models/Company');
const Expert = require('../models/Expert');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const Review = require('../models/Review');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Resolves the correct Booking filter based on user type:
 *  - company_owner / company_staff / admin → filters by companyId
 *  - expert / provider                     → filters by expertId
 * Returns { filter, company, expert, isCompany }
 */
const resolveProviderFilter = async (userId, userRole) => {
  const isCompanyRole = ['company_owner', 'company_staff', 'admin'].includes(userRole);

  if (isCompanyRole) {
    const company = await Company.findOne({
      $or: [{ ownerId: userId }, { staffIds: userId }]
    });
    if (!company) throw new AppError('Company not found', 404);
    return { filter: { companyId: company._id }, company, expert: null, isCompany: true };
  } else {
    // Individual expert / provider
    const expert = await Expert.findOne({ userId });
    if (!expert) throw new AppError('Expert profile not found', 404);
    return { filter: { expertId: expert._id }, company: null, expert, isCompany: false };
  }
};

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue
// @access  Private (company_owner, company_staff)
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;

    // Resolve filter by user type (company vs individual expert)
    const { filter: baseFilter } = await resolveProviderFilter(req.user._id, req.user.role);

    // Build date filter
    const dateFilter = { 
      ...baseFilter,
      paymentStatus: 'Paid'
    };

    if (startDate || endDate) {
      dateFilter.updatedAt = {};
      if (startDate) dateFilter.updatedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.updatedAt.$lte = new Date(endDate);
    }

    // Revenue over time
    const revenueTimeline = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: period === 'month' ? { $month: '$updatedAt' } : null,
            day: period === 'day' ? { $dayOfMonth: '$updatedAt' } : null,
            week: period === 'week' ? { $week: '$updatedAt' } : null
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Revenue by service
    const revenueByService = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$serviceId',
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      { $sort: { revenue: -1 } }
    ]);

    // Revenue by staff
    const revenueByStaff = await Booking.aggregate([
      { $match: { ...dateFilter, assignedStaffId: { $exists: true } } },
      {
        $group: {
          _id: '$assignedStaffId',
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'staff',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $lookup: {
          from: 'users',
          localField: 'staff.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $sort: { revenue: -1 } }
    ]);

    // Summary stats
    const [summary] = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$totalAmount' },
          highestBooking: { $max: '$totalAmount' },
          lowestBooking: { $min: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        revenueTimeline,
        revenueByService,
        revenueByStaff,
        summary: summary || {
          totalRevenue: 0,
          totalBookings: 0,
          averageBookingValue: 0,
          highestBooking: 0,
          lowestBooking: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings growth analytics
// @route   GET /api/analytics/bookings-growth
// @access  Private (company_owner, company_staff)
exports.getBookingsGrowth = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;

    const { filter: baseFilter } = await resolveProviderFilter(req.user._id, req.user.role);

    const dateFilter = { ...baseFilter };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Bookings over time
    const bookingsTimeline = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: period === 'month' ? { $month: '$createdAt' } : null,
            day: period === 'day' ? { $dayOfMonth: '$createdAt' } : null,
            week: period === 'week' ? { $week: '$createdAt' } : null
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Conversion funnel
    const conversionFunnel = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Growth rate calculation
    const growthRate = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        bookingsTimeline,
        conversionFunnel,
        growthRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular services analytics
// @route   GET /api/analytics/popular-services
// @access  Private (company_owner, company_staff)
exports.getPopularServices = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const { filter: baseFilter, isCompany } = await resolveProviderFilter(req.user._id, req.user.role);

    const dateFilter = { ...baseFilter };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const popularServices = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$serviceId',
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$totalAmount' },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $eq: ['$totalBookings', 0] },
              0,
              { $multiply: [{ $divide: ['$completedBookings', '$totalBookings'] }, 100] }
            ]
          },
          cancellationRate: {
            $cond: [
              { $eq: ['$totalBookings', 0] },
              0,
              { $multiply: [{ $divide: ['$cancelledBookings', '$totalBookings'] }, 100] }
            ]
          }
        }
      },
      { $sort: { totalBookings: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: popularServices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top staff analytics
// @route   GET /api/analytics/top-staff
// @access  Private (company_owner, company_staff)
exports.getTopStaff = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10, metric = 'bookings' } = req.query;

    const { filter: baseFilter } = await resolveProviderFilter(req.user._id, req.user.role);

    const dateFilter = { ...baseFilter, assignedStaffId: { $exists: true } };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let sortField = {};
    if (metric === 'revenue') {
      sortField = { totalRevenue: -1 };
    } else if (metric === 'rating') {
      sortField = { averageRating: -1 };
    } else {
      sortField = { totalBookings: -1 };
    }

    const topStaff = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$assignedStaffId',
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$totalAmount' },
          averageRating: { $avg: '$rating' },
          totalRatingCount: { $sum: { $cond: [{ $ne: ['$rating', null] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'staff',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $lookup: {
          from: 'users',
          localField: 'staff.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $eq: ['$totalBookings', 0] },
              0,
              { $multiply: [{ $divide: ['$completedBookings', '$totalBookings'] }, 100] }
            ]
          },
          averageBookingValue: {
            $cond: [
              { $eq: ['$totalBookings', 0] },
              0,
              { $divide: ['$totalRevenue', '$totalBookings'] }
            ]
          }
        }
      },
      { $sort: sortField },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: topStaff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get returning users analytics
// @route   GET /api/analytics/returning-users
// @access  Private (company_owner, company_staff)
exports.getReturningUsers = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const { filter: baseFilter } = await resolveProviderFilter(req.user._id, req.user.role);

    const dateFilter = { ...baseFilter };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Customer booking frequency
    const customerFrequency = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$customerId',
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          totalSpent: { $sum: '$totalAmount' },
          firstBooking: { $min: '$createdAt' },
          lastBooking: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $addFields: {
          isReturning: { $gt: ['$totalBookings', 1] },
          daysBetweenBookings: {
            $cond: [
              { $gt: ['$totalBookings', 1] },
              { $divide: [{ $subtract: ['$lastBooking', '$firstBooking'] }, 1000 * 60 * 60 * 24] },
              null
            ]
          }
        }
      },
      { $sort: { totalBookings: -1 } }
    ]);

    // Summary statistics
    const totalCustomers = customerFrequency.length;
    const returningCustomers = customerFrequency.filter(c => c.isReturning).length;
    const newCustomers = totalCustomers - returningCustomers;

    const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    res.json({
      success: true,
      data: {
        customerFrequency,
        summary: {
          totalCustomers,
          returningCustomers,
          newCustomers,
          customerRetentionRate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard overview analytics
// @route   GET /api/analytics/dashboard
// @access  Private (company_owner, company_staff)
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query; // days

    const { filter: baseFilter, company, isCompany } = await resolveProviderFilter(req.user._id, req.user.role);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const dateFilter = { 
      ...baseFilter,
      createdAt: { $gte: startDate }
    };

    // Get all metrics in parallel
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      activeServices,
      activeStaff,
      averageRating,
      newCustomers
    ] = await Promise.all([
      Booking.countDocuments(dateFilter),
      Booking.countDocuments({ ...dateFilter, status: 'Completed' }),
      Booking.countDocuments({ ...dateFilter, status: 'Cancelled' }),
      Booking.aggregate([
        { $match: { ...dateFilter, paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Service.countDocuments({ companyId: company._id, isActive: true }),
      Staff.countDocuments({ companyId: company._id, isActive: true }),
      Review.aggregate([
        { $match: { companyId: company._id } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      Booking.distinct('customerId', dateFilter).then(customers => customers.length)
    ]);

    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    // Previous period comparison
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - parseInt(period));

    const previousDateFilter = { 
      companyId: company._id,
      createdAt: { $gte: previousStartDate, $lt: startDate }
    };

    const [previousBookings, previousRevenue] = await Promise.all([
      Booking.countDocuments(previousDateFilter),
      Booking.aggregate([
        { $match: { ...previousDateFilter, paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const bookingGrowth = previousBookings > 0 ? 
      ((totalBookings - previousBookings) / previousBookings) * 100 : 0;
    const revenueGrowth = previousRevenue[0]?.total > 0 ? 
      ((totalRevenue[0]?.total || 0) - previousRevenue[0]?.total) / previousRevenue[0]?.total * 100 : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          completedBookings,
          cancelledBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          activeServices,
          activeStaff,
          averageRating: averageRating[0]?.avgRating || 0,
          newCustomers,
          completionRate,
          cancellationRate
        },
        growth: {
          bookingGrowth,
          revenueGrowth
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
