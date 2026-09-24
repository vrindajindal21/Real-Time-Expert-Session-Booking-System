const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  logo: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: [
      'Technology',
      'Healthcare',
      'Consulting',
      'Education',
      'Finance',
      'Legal',
      'Creative',
      'Wellness',
      'Professional Services',
      'Other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Company owner is required']
  },
  staffIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  services: [{
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    duration: { type: Number, required: true }, // in minutes
    price: { type: Number, required: true },
    meetingType: {
      type: String,
      enum: ['video', 'chat', 'in-person'],
      default: 'video'
    },
    maxParticipants: { type: Number, default: 1 },
    active: { type: Boolean, default: true }
  }],
  subscriptionPlan: {
    type: String,
    enum: ['Free', 'Pro', 'Enterprise'],
    default: 'Free'
  },
  stripeCustomerId: {
    type: String,
    trim: true
  },
  timezone: {
    type: String,
    required: [true, 'Timezone is required'],
    default: 'UTC'
  },
  workingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: true } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: true } }
  },
  cancellationPolicy: {
    type: String,
    maxlength: [1000, 'Cancellation policy cannot exceed 1000 characters']
  },
  refundPolicy: {
    type: String,
    maxlength: [1000, 'Refund policy cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
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
  }
}, {
  timestamps: true
});

// Indexes for better performance
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ industry: 1 });
companySchema.index({ ownerId: 1 });
companySchema.index({ 'services.category': 1 });

// Virtual for total staff count
companySchema.virtual('staffCount').get(function() {
  return this.staffIds.length;
});

// Method to check if user is owner or staff
companySchema.methods.hasMember = function(userId) {
  return this.ownerId.toString() === userId.toString() || 
         this.staffIds.some(staffId => staffId.toString() === userId.toString());
};

// Method to check if user is owner
companySchema.methods.isOwner = function(userId) {
  return this.ownerId.toString() === userId.toString();
};

module.exports = mongoose.model('Company', companySchema);
