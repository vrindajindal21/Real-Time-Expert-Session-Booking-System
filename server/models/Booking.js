const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Legacy support - can be null for company bookings
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert'
  },
  
  // New company-based fields
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  assignedStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  
  // Service details (denormalized for performance)
  serviceTitle: { type: String, required: true },
  serviceDescription: { type: String },
  serviceCategory: { type: String },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  duration: { type: Number, required: true },
  meetingType: {
    type: String,
    enum: ['video', 'chat', 'in-person'],
    default: 'video'
  },
  
  // Customer details
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerAddress: {
    type: String,
    trim: true
  },
  
  // Booking details
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  notes: {
    type: String,
    default: ''
  },
  requirements: [{
    type: String,
    trim: true
  }],
  
  // Status and workflow
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded', 'Partially Refunded'],
    default: 'Pending'
  },
  
  // Meeting details
  meetingLink: {
    type: String,
    trim: true
  },
  meetingId: {
    type: String,
    trim: true
  },
  meetingPassword: {
    type: String,
    trim: true
  },
  
  // Rescheduling and cancellation
  rescheduleRequested: {
    type: Boolean,
    default: false
  },
  rescheduleCount: {
    type: Number,
    default: 0
  },
  rescheduleHistory: [{
    oldDate: Date,
    oldStartTime: String,
    newDate: Date,
    newStartTime: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  refundAmount: {
    type: Number,
    default: 0
  },
  
  // Payment details
  paymentIntentId: {
    type: String,
    trim: true
  },
  depositAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  providerAmount: {
    type: Number,
    default: 0
  },
  commissionRate: {
    type: Number, // Percentage (e.g., 10 for 10%)
    default: 0
  },
  
  // Session details (filled after completion)
  sessionNotes: {
    type: String,
    trim: true
  },
  sessionSummary: {
    type: String,
    trim: true
  },
  sessionAttachments: [{
    type: String,
    trim: true
  }],
  
  // Feedback and ratings
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  reviewSubmittedAt: Date,
  
  // Internal tracking
  bookingId: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'admin', 'api'],
    default: 'web'
  },
  ipAddress: String,
  userAgent: String
  
}, {
  timestamps: true
});

// Compound indexes to prevent double booking - CRITICAL
bookingSchema.index(
  { expertId: 1, date: 1, startTime: 1 },
  { unique: true, sparse: true } // sparse for company bookings
);

bookingSchema.index(
  { assignedStaffId: 1, date: 1, startTime: 1 },
  { unique: true, sparse: true }
);

bookingSchema.index(
  { companyId: 1, date: 1, startTime: 1 },
  { unique: true, sparse: true }
);

// Performance indexes
bookingSchema.index({ customerEmail: 1 });
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ companyId: 1, status: 1 });
bookingSchema.index({ assignedStaffId: 1, status: 1 });
bookingSchema.index({ serviceId: 1 });
bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ paymentIntentId: 1 }, { sparse: true });
bookingSchema.index({ bookingId: 1 }, { unique: true });

// Text search index
bookingSchema.index({ 
  customerName: 'text', 
  customerEmail: 'text', 
  serviceTitle: 'text',
  bookingId: 'text'
});

module.exports = mongoose.model('Booking', bookingSchema);
