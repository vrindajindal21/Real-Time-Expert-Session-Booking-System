const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true // Fast lookup for direct messaging history
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false // Optional, can be direct messaging before booking
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Message content - can be text, file, or system message
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system', 'session_note'],
    default: 'text'
  },
  text: {
    type: String,
    trim: true
  },
  
  // File attachments
  attachments: [{
    type: String, // Cloudinary URL or file path
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message metadata
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Session-specific features
  isSessionNote: {
    type: Boolean,
    default: false
  },
  noteType: {
    type: String,
    enum: ['preparation', 'summary', 'action_item', 'follow_up'],
    default: 'summary'
  },
  
  // Message threading/replies
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // System messages
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  systemType: {
    type: String,
    enum: ['booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_rescheduled', 'payment_received'],
  },
  
  // Edits and deletions
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  originalText: String,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  
  // Reaction/emoji support
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
  
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ bookingId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, isRead: 1 });
messageSchema.index({ bookingId: 1, isSessionNote: 1 });
messageSchema.index({ bookingId: 1, messageType: 1 });
messageSchema.index({ replyTo: 1 });
messageSchema.index({ isDeleted: 1 });

// Virtual for checking if message has attachments
messageSchema.virtual('hasAttachments').get(function() {
  return this.attachments && this.attachments.length > 0;
});

// Virtual for checking if message has reactions
messageSchema.virtual('hasReactions').get(function() {
  return this.reactions && this.reactions.length > 0;
});

// Method to mark message as read
messageSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  this.status = 'read';
  return await this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = async function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({ userId, emoji });
  return await this.save();
};

module.exports = mongoose.model('Message', messageSchema);
