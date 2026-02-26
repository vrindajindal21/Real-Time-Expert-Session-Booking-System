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
    enum: ['Technology', 'Healthcare', 'Finance', 'Education', 'Consulting', 'Other']
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
