const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
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
  isBooked: {
    type: Boolean,
    default: false
  }
});

const expertSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  themeColor: {
    type: String,
    default: '#6366f1' // Standard Hub Indigo
  },
  brandTone: {
    type: String,
    enum: ['vibrant', 'professional', 'minimalist'],
    default: 'professional'
  },
  providerType: {
    type: String,
    enum: ['Individual', 'Company', 'Startup'],
    default: 'Individual'
  },
  companyName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  sessionType: {
    type: String,
    enum: ['Online', 'In-Person', 'Both'],
    default: 'Online'
  },
  location: {
    type: String, // City/Address for In-Person sessions
    trim: true
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  services: [{
    title: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, default: 60 },
    type: { type: String, enum: ['Session', 'Package', 'Subscription'], default: 'Session' },
    description: { type: String }
  }],
  customFields: {
    type: Map,
    of: String
  },
  bio: {
    type: String,
    required: true
  },
  timeSlots: [timeSlotSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better search performance
expertSchema.index({ name: 'text', companyName: 'text', category: 1 });

// Index for faster searching within time slots
expertSchema.index({ 'timeSlots.date': 1 });

module.exports = mongoose.model('Expert', expertSchema);
