const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    enum: ['Free', 'Pro', 'Enterprise'],
    unique: true
  },
  stripePriceId: {
    type: String,
    required: [true, 'Stripe price ID is required']
  },
  priceMonthly: {
    type: Number,
    required: [true, 'Monthly price is required'],
    min: [0, 'Price cannot be negative']
  },
  priceYearly: {
    type: Number,
    required: [true, 'Yearly price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },
  features: [{
    type: String,
    required: true
  }],
  limits: {
    bookingLimit: {
      type: Number,
      required: [true, 'Booking limit is required'],
      min: [0, 'Booking limit cannot be negative']
    },
    staffLimit: {
      type: Number,
      required: [true, 'Staff limit is required'],
      min: [0, 'Staff limit cannot be negative']
    },
    serviceLimit: {
      type: Number,
      required: [true, 'Service limit is required'],
      min: [0, 'Service limit cannot be negative']
    },
    storageLimit: {
      type: Number, // in MB
      required: [true, 'Storage limit is required'],
      min: [0, 'Storage limit cannot be negative']
    },
    customDomain: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  popular: {
    type: Boolean,
    default: false
  },
  trialDays: {
    type: Number,
    default: 0,
    min: [0, 'Trial days cannot be negative']
  }
}, {
  timestamps: true
});

// Index for performance
subscriptionPlanSchema.index({ isActive: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
