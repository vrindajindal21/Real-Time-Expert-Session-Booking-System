const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional — some staff entries are not platform users
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: false
  },
  name: {
    type: String,
    required: [true, 'Staff name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  specialization: [{
    type: String,
    trim: true
  }],
  category: {
    type: String
  },
  experience: {
    type: Number,
    default: 0,
    min: [0, 'Experience cannot be negative']
  },
  role: {
    type: String,
    default: 'staff'
  },
  skills: [{
    type: String,
    trim: true
  }],
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  languages: [{
    type: String,
    trim: true
  }],
  availability: {
    monday: [{ start: String, end: String }],
    tuesday: [{ start: String, end: String }],
    wednesday: [{ start: String, end: String }],
    thursday: [{ start: String, end: String }],
    friday: [{ start: String, end: String }],
    saturday: [{ start: String, end: String }],
    sunday: [{ start: String, end: String }]
  },
  customPricing: {
    enabled: { type: Boolean, default: false },
    multiplier: { type: Number, default: 1.0, min: 0.5, max: 2.0 }
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  completedBookings: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  hireDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
staffSchema.index({ userId: 1, companyId: 1 });
staffSchema.index({ companyId: 1, role: 1 });
staffSchema.index({ expertId: 1, isActive: 1 });

// Virtual for completion rate
staffSchema.virtual('completionRate').get(function() {
  if (this.totalBookings === 0) return 0;
  return Math.round((this.completedBookings / this.totalBookings) * 100);
});

// Method to update booking stats
staffSchema.methods.updateBookingStats = async function(status) {
  if (status === 'Completed') {
    this.completedBookings += 1;
  }
  this.totalBookings += 1;
  await this.save();
};

module.exports = mongoose.model('Staff', staffSchema);
