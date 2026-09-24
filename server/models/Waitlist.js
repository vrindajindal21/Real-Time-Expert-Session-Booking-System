const mongoose = require('mongoose');

/**
 * Waitlist — auto-queues users when a slot is full.
 * When a cancellation happens, the top waitlisted user gets notified + offered the slot.
 */
const waitlistSchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  customerPhone: { type: String, trim: true },

  // What slot they want
  preferredDate: { type: Date, required: true },
  preferredStartTime: { type: String, required: true },
  flexibleDates: [{ type: Date }], // Alt dates they'd accept

  // Status lifecycle
  status: {
    type: String,
    enum: ['waiting', 'notified', 'accepted', 'declined', 'expired'],
    default: 'waiting'
  },
  position: { type: Number, default: 1 }, // Queue position

  // Notification tracking
  notifiedAt: Date,
  notificationExpiry: Date,   // Offer expires in X hours (e.g. 2h)
  acceptedAt: Date,
  declinedAt: Date,

  // Notes
  notes: { type: String, trim: true },

  // Resulting booking if accepted
  resultingBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }

}, { timestamps: true });

// Indexes
waitlistSchema.index({ expertId: 1, preferredDate: 1, status: 1 });
waitlistSchema.index({ companyId: 1, preferredDate: 1, status: 1 });
waitlistSchema.index({ customerId: 1, status: 1 });
waitlistSchema.index({ status: 1, notificationExpiry: 1 }); // For expiry sweeper

module.exports = mongoose.model('Waitlist', waitlistSchema);
