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
  category: {
    type: String,
    required: true,
    // REMOVED strict enum to allow any industry (Doctors, Libraries, Movies, etc.)
  },
  resourceType: {
    type: String,
    enum: ['Person', 'Place', 'Item', 'Service'],
    default: 'Person'
  },
  companyName: {
    type: String,
    default: 'Independent'
  },
  experience: {
    type: Number,
    min: 0,
    default: 0
  },
  rating: {
    type: Number,
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
  bio: {
    type: String,
    required: true
  },
  timeSlots: [timeSlotSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// REMOVED text index to prevent "text index required" error or "index not supported" on free clusters
expertSchema.index({ name: 1, category: 1 });
expertSchema.index({ 'timeSlots.date': 1 });

// Check if model already exists to avoid OverwriteModelError in serverless
module.exports = mongoose.models.Expert || mongoose.model('Expert', expertSchema);
