const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [100, 'Service title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Consulting',
      'Healthcare',
      'Education',
      'Legal',
      'Financial',
      'Technology',
      'Creative',
      'Wellness',
      'Professional Services',
      'Other'
    ]
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'],
    default: 'USD'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  assignedStaffIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }],
  meetingType: {
    type: String,
    enum: ['video', 'chat', 'in-person'],
    default: 'video'
  },
  maxParticipants: {
    type: Number,
    default: 1,
    min: [1, 'Max participants must be at least 1'],
    max: [50, 'Max participants cannot exceed 50']
  },
  location: {
    type: String,
    trim: true // Required if meetingType is 'in-person'
  },
  requirements: [{
    type: String,
    trim: true
  }],
  whatToBring: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  videoUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  bookingSettings: {
    advanceBookingDays: {
      type: Number,
      default: 30,
      min: [1, 'Must allow at least 1 day advance booking'],
      max: [365, 'Cannot allow more than 365 days advance booking']
    },
    cancellationDeadline: {
      type: Number, // hours before appointment
      default: 24,
      min: [0, 'Cancellation deadline cannot be negative']
    },
    rescheduleLimit: {
      type: Number,
      default: 3,
      min: [0, 'Reschedule limit cannot be negative']
    },
    autoConfirm: {
      type: Boolean,
      default: true
    },
    requirePayment: {
      type: Boolean,
      default: false
    },
    depositAmount: {
      type: Number,
      default: 0,
      min: [0, 'Deposit amount cannot be negative']
    }
  },
  availability: {
    // Time slots for this specific service
    monday: [{ start: String, end: String, available: { type: Boolean, default: true } }],
    tuesday: [{ start: String, end: String, available: { type: Boolean, default: true } }],
    wednesday: [{ start: String, end: String, available: { type: Boolean, default: true } }],
    thursday: [{ start: String, end: String, available: { type: Boolean, default: true } }],
    friday: [{ start: String, end: String, available: { type: Boolean, default: true } }],
    saturday: [{ start: String, end: String, available: { type: Boolean, default: true } }],
    sunday: [{ start: String, end: String, available: { type: Boolean, default: true } }]
  },
  pricingTiers: [{
    name: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    features: [{ type: String }],
    popular: { type: Boolean, default: false }
  }],
  stats: {
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for performance
serviceSchema.index({ companyId: 1, isActive: 1 });
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ title: 'text', description: 'text', tags: 'text' });
serviceSchema.index({ 'assignedStaffIds': 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ 'stats.totalBookings': -1 });

// Virtual for completion rate
serviceSchema.virtual('completionRate').get(function() {
  if (this.stats.totalBookings === 0) return 0;
  return Math.round((this.stats.completedBookings / this.stats.totalBookings) * 100);
});

// Method to update booking stats
serviceSchema.methods.updateBookingStats = async function(status, amount = 0) {
  this.stats.totalBookings += 1;
  
  if (status === 'Completed') {
    this.stats.completedBookings += 1;
    this.stats.revenue += amount;
  } else if (status === 'Cancelled') {
    this.stats.cancelledBookings += 1;
  }
  
  await this.save();
};

// Method to update rating
serviceSchema.methods.updateRating = async function(newRating) {
  const totalRatingPoints = this.stats.averageRating * this.stats.reviewCount;
  this.stats.reviewCount += 1;
  this.stats.averageRating = (totalRatingPoints + newRating) / this.stats.reviewCount;
  this.stats.averageRating = Math.round(this.stats.averageRating * 10) / 10; // Round to 1 decimal
  await this.save();
};

// Pre-save validation for in-person services
serviceSchema.pre('save', function(next) {
  if (this.meetingType === 'in-person' && !this.location) {
    next(new Error('Location is required for in-person services'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Service', serviceSchema);
