const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
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
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  bookingId: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent double booking - CRITICAL
bookingSchema.index(
  { expertId: 1, date: 1, startTime: 1 },
  { unique: true }
);

// Index for customer bookings lookup
bookingSchema.index({ customerEmail: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
