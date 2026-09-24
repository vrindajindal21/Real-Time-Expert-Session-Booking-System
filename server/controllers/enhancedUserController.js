const Booking = require('../models/Booking');
const Favorite = require('../models/Favorite');
const Service = require('../models/Service');
const Company = require('../models/Company');
const Review = require('../models/Review');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Get user dashboard overview
// @route   GET /api/user/dashboard
// @access  Private
exports.getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get user's recent bookings
    const recentBookings = await Booking.find({ customerId: userId })
      .populate('serviceId', 'title meetingType duration')
      .populate('companyId', 'name logo')
      .populate('assignedStaffId', 'userId role')
      .populate({
        path: 'assignedStaffId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming bookings
    const upcomingBookings = await Booking.find({
      customerId: userId,
      date: { $gte: new Date() },
      status: { $in: ['Pending', 'Confirmed'] }
    })
      .populate('serviceId', 'title meetingType duration')
      .populate('companyId', 'name logo')
      .sort({ date: 1, startTime: 1 })
      .limit(3);

    // Get favorite services
    const favoriteServices = await Favorite.find({ userId })
      .populate({
        path: 'serviceId',
        populate: {
          path: 'companyId',
          select: 'name logo rating'
        }
      })
      .sort({ createdAt: -1 })
      .limit(6);

    // Get user's reviews
    const userReviews = await Review.find({ customerId: userId })
      .populate('expertId', 'name avatar')
      .populate('serviceId', 'title')
      .sort({ createdAt: -1 })
      .limit(3);

    // Get statistics
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalSpent,
      favoriteCount
    ] = await Promise.all([
      Booking.countDocuments({ customerId: userId }),
      Booking.countDocuments({ customerId: userId, status: 'Completed' }),
      Booking.countDocuments({ customerId: userId, status: 'Cancelled' }),
      Booking.aggregate([
        { $match: { customerId: userId, paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Favorite.countDocuments({ userId })
    ]);

    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          completedBookings,
          cancelledBookings,
          totalSpent: totalSpent[0]?.total || 0,
          favoriteCount,
          completionRate
        },
        recentBookings,
        upcomingBookings,
        favoriteServices: favoriteServices.map(f => f.serviceId),
        userReviews
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user bookings with enhanced filtering
// @route   GET /api/user/bookings
// @access  Private
exports.getUserBookings = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      startDate, 
      endDate, 
      serviceType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user._id;

    // Build filter
    const filter = { customerId: userId };
    
    if (status) {
      filter.status = status;
    }
    
    if (serviceType) {
      filter['serviceId.meetingType'] = serviceType;
    }
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bookings = await Booking.find(filter)
      .populate('serviceId', 'title meetingType duration price')
      .populate('companyId', 'name logo')
      .populate('assignedStaffId', 'userId role')
      .populate({
        path: 'assignedStaffId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort(sort)
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

// @desc    Add service to favorites
// @route   POST /api/user/favorites
// @access  Private
exports.addToFavorites = async (req, res, next) => {
  try {
    const { serviceId } = req.body;
    const userId = req.user._id;

    // Check if service exists
    const service = await Service.findById(serviceId).populate('companyId');
    if (!service || !service.isActive) {
      return next(new AppError('Service not found', 404));
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, serviceId });
    if (existingFavorite) {
      return next(new AppError('Service already in favorites', 400));
    }

    // Create favorite
    const favorite = await Favorite.create({
      userId,
      serviceId,
      companyId: service.companyId._id
    });

    res.status(201).json({
      success: true,
      message: 'Service added to favorites',
      data: favorite
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove service from favorites
// @route   DELETE /api/user/favorites/:serviceId
// @access  Private
exports.removeFromFavorites = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const userId = req.user._id;

    const favorite = await Favorite.findOneAndDelete({ userId, serviceId });
    if (!favorite) {
      return next(new AppError('Favorite not found', 404));
    }

    res.json({
      success: true,
      message: 'Service removed from favorites'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's favorite services
// @route   GET /api/user/favorites
// @access  Private
exports.getFavorites = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const userId = req.user._id;

    const favorites = await Favorite.find({ userId })
      .populate({
        path: 'serviceId',
        populate: {
          path: 'companyId',
          select: 'name logo rating'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Favorite.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        favorites: favorites.map(f => f.serviceId),
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

// @desc    Get user's reviews
// @route   GET /api/user/reviews
// @access  Private
exports.getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const reviews = await Review.find({ customerId: userId })
      .populate('expertId', 'name avatar')
      .populate('serviceId', 'title')
      .populate('bookingId', 'date serviceTitle')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ customerId: userId });

    res.json({
      success: true,
      data: {
        reviews,
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

// @desc    Leave a review for a booking
// @route   POST /api/user/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const userId = req.user._id;

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.customerId.toString() !== userId.toString()) {
      return next(new AppError('Booking not found', 404));
    }

    // Check if booking is completed
    if (booking.status !== 'Completed') {
      return next(new AppError('Can only review completed bookings', 400));
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return next(new AppError('Review already exists for this booking', 400));
    }

    // Create review
    const review = await Review.create({
      bookingId,
      customerId: userId,
      expertId: booking.assignedStaffId || booking.companyId,
      rating,
      comment
    });

    // Update service rating
    if (booking.serviceId) {
      await booking.serviceId.updateRating(rating);
    }

    const populatedReview = await Review.findById(review._id)
      .populate('expertId', 'name avatar')
      .populate('serviceId', 'title')
      .populate('bookingId', 'date serviceTitle');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: populatedReview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's payment history
// @route   GET /api/user/payments
// @access  Private
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const userId = req.user._id;

    const filter = { customerId: userId };
    if (status) filter.paymentStatus = status;

    const payments = await Booking.find(filter)
      .select('totalAmount paymentStatus updatedAt bookingId serviceTitle')
      .populate('serviceId', 'title')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    // Calculate total spent
    const [totalSpent] = await Booking.aggregate([
      { $match: { customerId: userId, paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        payments,
        totalSpent: totalSpent?.total || 0,
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

// @desc    Get user's chat history
// @route   GET /api/user/chats
// @access  Private
exports.getChatHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    // Get unique booking IDs where user has messages
    const bookingIds = await Booking.distinct('_id', {
      customerId: userId
    });

    const chats = await Booking.find({
      _id: { $in: bookingIds }
    })
      .select('serviceTitle date companyId status')
      .populate('companyId', 'name logo')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get latest message for each chat
    const Message = require('../models/Message');
    const chatsWithLatestMessage = await Promise.all(
      chats.map(async (chat) => {
        const latestMessage = await Message.findOne({
          $or: [
            { senderId: userId, bookingId: chat._id },
            { recipientId: userId, bookingId: chat._id }
          ]
        })
          .sort({ createdAt: -1 })
          .populate('senderId', 'name avatar')
          .populate('recipientId', 'name avatar');

        return {
          ...chat.toObject(),
          latestMessage
        };
      })
    );

    const total = bookingIds.length;

    res.json({
      success: true,
      data: {
        chats: chatsWithLatestMessage,
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
