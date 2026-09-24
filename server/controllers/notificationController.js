const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorMiddleware');
const { sendNotificationEmail } = require('../utils/emailService');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly, category, type } = req.query;
    const userId = req.user._id;

    // Build filter
    const filter = { userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    if (category) filter.category = category;
    if (type) filter.type = type;

    // Exclude expired notifications
    filter.$or = [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1, priority: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      data: {
        notifications,
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

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const result = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create notification (internal use)
// @route   POST /api/notifications/create
// @access  Private (internal)
exports.createNotification = async (req, res, next) => {
  try {
    const notification = await Notification.createNotification(req.body);

    // Send email if enabled
    if (notification.deliveryMethods.email) {
      try {
        await sendNotificationEmail(notification);
        await notification.markAsDelivered('email');
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
    }

    // Mark as delivered in-app
    await notification.markAsDelivered('inApp');

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
exports.getNotificationPreferences = async (req, res, next) => {
  try {
    // This would typically be stored in User model
    // For now, return default preferences
    const preferences = {
      inApp: {
        booking: true,
        payment: true,
        message: true,
        staff: true,
        service: true,
        subscription: true,
        system: false
      },
      email: {
        booking: true,
        payment: true,
        message: false,
        staff: true,
        service: true,
        subscription: true,
        system: false
      },
      push: {
        booking: true,
        payment: true,
        message: true,
        staff: false,
        service: false,
        subscription: false,
        system: false
      }
    };

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update notification preferences
// @route   PATCH /api/notifications/preferences
// @access  Private
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    // This would update User model with preferences
    // For now, just return success
    res.json({
      success: true,
      message: 'Notification preferences updated'
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to create different types of notifications
exports.createBookingNotification = async (userId, type, booking, additionalData = {}) => {
  const notifications = {
    booking_confirmed: {
      title: 'Booking Confirmed',
      message: `Your booking for ${booking.serviceTitle} has been confirmed`,
      category: 'booking',
      priority: 'high',
      actionUrl: `/bookings/${booking._id}`,
      actionText: 'View Booking'
    },
    booking_cancelled: {
      title: 'Booking Cancelled',
      message: `Your booking for ${booking.serviceTitle} has been cancelled`,
      category: 'booking',
      priority: 'high',
      actionUrl: `/bookings/${booking._id}`,
      actionText: 'View Details'
    },
    booking_reminder: {
      title: 'Booking Reminder',
      message: `You have a booking for ${booking.serviceTitle} tomorrow`,
      category: 'booking',
      priority: 'medium',
      actionUrl: `/bookings/${booking._id}`,
      actionText: 'View Booking'
    }
  };

  const template = notifications[type];
  if (!template) return null;

  return await Notification.createNotification({
    userId,
    type,
    ...template,
    data: {
      bookingId: booking._id,
      serviceTitle: booking.serviceTitle,
      date: booking.date,
      startTime: booking.startTime,
      ...additionalData
    }
  });
};

exports.createPaymentNotification = async (userId, type, paymentData) => {
  const notifications = {
    payment_received: {
      title: 'Payment Received',
      message: `Payment of $${paymentData.amount} has been received`,
      category: 'payment',
      priority: 'medium',
      actionUrl: '/earnings',
      actionText: 'View Earnings'
    },
    payment_failed: {
      title: 'Payment Failed',
      message: 'A payment transaction has failed',
      category: 'payment',
      priority: 'high',
      actionUrl: '/earnings',
      actionText: 'View Details'
    }
  };

  const template = notifications[type];
  if (!template) return null;

  return await Notification.createNotification({
    userId,
    type,
    ...template,
    data: paymentData
  });
};

exports.createMessageNotification = async (userId, message) => {
  return await Notification.createNotification({
    userId,
    type: 'new_message',
    title: 'New Message',
    message: `You have a new message from ${message.senderName}`,
    category: 'message',
    priority: 'medium',
    actionUrl: `/chat/${message.bookingId}`,
    actionText: 'View Message',
    data: {
      messageId: message._id,
      bookingId: message.bookingId,
      senderId: message.senderId
    }
  });
};

exports.createReviewNotification = async (userId, review) => {
  return await Notification.createNotification({
    userId,
    type: 'review_received',
    title: 'New Review Received',
    message: `You received a ${review.rating}-star review`,
    category: 'booking',
    priority: 'medium',
    actionUrl: `/reviews/${review._id}`,
    actionText: 'View Review',
    data: {
      reviewId: review._id,
      rating: review.rating,
      bookingId: review.bookingId
    }
  });
};
