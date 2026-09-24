const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Add a review for a session
// @route   POST /api/reviews
// @access  Private (Consumer)
exports.addReview = async (req, res, next) => {
  const { bookingId, rating, comment } = req.body;

  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Verify booking belongs to user
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to review this booking', 401));
    }

    // Enforce review only for completed bookings
    if (booking.status !== 'Completed') {
      return next(new AppError('You can only review completed sessions', 400));
    }

    // Check for duplicate review
    const existing = await Review.findOne({ bookingId });
    if (existing) {
      return next(new AppError('You have already reviewed this session', 400));
    }

    const review = await Review.create({
      bookingId,
      customerId: req.user._id,
      expertId: booking.expertId,
      rating,
      comment
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for an expert
// @route   GET /api/reviews/expert/:expertId
// @access  Public
exports.getExpertReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ expertId: req.params.expertId })
      .populate('customerId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};
