const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    enum: [
      'booking_confirmed',
      'booking_cancelled',
      'booking_rescheduled',
      'booking_reminder',
      'payment_received',
      'payment_failed',
      'new_message',
      'review_received',
      'staff_added',
      'staff_removed',
      'service_created',
      'service_updated',
      'subscription_created',
      'subscription_cancelled',
      'subscription_renewed',
      'system_update'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['booking', 'payment', 'message', 'staff', 'service', 'subscription', 'system'],
    required: [true, 'Category is required']
  },
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true,
    maxlength: [50, 'Action text cannot exceed 50 characters']
  },
  imageUrl: {
    type: String,
    trim: true
  },
  expiresAt: Date,
  deliveryMethods: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  deliveryStatus: {
    inApp: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      read: { type: Boolean, default: false },
      readAt: Date
    },
    email: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      error: String
    },
    push: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      error: String
    },
    sms: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      error: String
    }
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  this.deliveryStatus.inApp.read = true;
  this.deliveryStatus.inApp.readAt = new Date();
  return await this.save();
};

// Method to mark as delivered (in-app)
notificationSchema.methods.markAsDelivered = async function(method = 'inApp') {
  this.deliveryStatus[method].delivered = true;
  this.deliveryStatus[method].deliveredAt = new Date();
  return await this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = await this.create(data);
  
  // Emit real-time notification via Socket.io
  const io = global.io;
  if (io) {
    io.to(`user-${notification.userId}`).emit('new-notification', notification);
  }
  
  return notification;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    userId,
    isRead: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date(),
      'deliveryStatus.inApp.read': true,
      'deliveryStatus.inApp.readAt': new Date()
    }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
