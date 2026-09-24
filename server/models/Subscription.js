const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required'],
    unique: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: [true, 'Plan is required']
  },
  stripeCustomerId: {
    type: String,
    required: [true, 'Stripe customer ID is required']
  },
  stripeSubscriptionId: {
    type: String,
    required: [true, 'Stripe subscription ID is required']
  },
  status: {
    type: String,
    enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete'],
    default: 'active'
  },
  currentPeriodStart: {
    type: Date,
    required: [true, 'Current period start is required']
  },
  currentPeriodEnd: {
    type: Date,
    required: [true, 'Current period end is required']
  },
  trialStart: Date,
  trialEnd: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  canceledAt: Date,
  endedAt: Date,
  billingCycleAnchor: Date,
  metadata: {
    type: Map,
    of: String
  },
  usage: {
    currentBookings: { type: Number, default: 0 },
    currentStaff: { type: Number, default: 0 },
    currentServices: { type: Number, default: 0 },
    currentStorage: { type: Number, default: 0 } // in MB
  }
}, {
  timestamps: true
});

// Indexes for performance
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ status: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return ['active', 'trialing'].includes(this.status) && 
         this.currentPeriodEnd > new Date();
});

// Virtual for days until renewal
subscriptionSchema.virtual('daysUntilRenewal').get(function() {
  if (!this.currentPeriodEnd) return 0;
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.ceil((this.currentPeriodEnd - new Date()) / msInDay);
});

// Method to check usage limits
subscriptionSchema.methods.checkUsageLimits = async function() {
  const SubscriptionPlan = require('./SubscriptionPlan');
  const plan = await SubscriptionPlan.findById(this.planId);
  
  if (!plan) return { withinLimits: false, message: 'Plan not found' };

  const limits = plan.limits;
  const usage = this.usage;

  const checks = [
    {
      field: 'bookings',
      limit: limits.bookingLimit,
      current: usage.currentBookings,
      withinLimit: usage.currentBookings < limits.bookingLimit
    },
    {
      field: 'staff',
      limit: limits.staffLimit,
      current: usage.currentStaff,
      withinLimit: usage.currentStaff < limits.staffLimit
    },
    {
      field: 'services',
      limit: limits.serviceLimit,
      current: usage.currentServices,
      withinLimit: usage.currentServices < limits.serviceLimit
    },
    {
      field: 'storage',
      limit: limits.storageLimit,
      current: usage.currentStorage,
      withinLimit: usage.currentStorage < limits.storageLimit
    }
  ];

  const exceededLimits = checks.filter(check => !check.withinLimit);

  return {
    withinLimits: exceededLimits.length === 0,
    exceededLimits,
    message: exceededLimits.length > 0 ? 
      `Exceeded limits: ${exceededLimits.map(l => l.field).join(', ')}` : 
      'All usage within limits'
  };
};

// Method to update usage
subscriptionSchema.methods.updateUsage = async function(type, increment = 1) {
  const usageField = `current${type.charAt(0).toUpperCase() + type.slice(1)}`;
  this.usage[usageField] += increment;
  await this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
