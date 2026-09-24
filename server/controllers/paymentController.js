let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.log('Stripe not configured - payment features will be disabled');
}
const Booking = require('../models/Booking');
const Company = require('../models/Company');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { AppError } = require('../middleware/errorMiddleware');
const { sendPaymentConfirmationEmail } = require('../utils/emailService');

// @desc    Create payment intent for booking
// @route   POST /api/payments/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res, next) => {
  try {
    if (!stripe) {
      return next(new AppError('Payment processing is not available', 503));
    }

    const { bookingId, amount, currency = 'usd' } = req.body;

    // Verify booking
    const booking = await Booking.findById(bookingId).populate('serviceId');
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check if user is the customer
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to pay for this booking', 403));
    }

    // Check if payment already processed
    if (booking.paymentStatus === 'Paid') {
      return next(new AppError('Payment already processed for this booking', 400));
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        bookingId: bookingId.toString(),
        customerId: req.user._id.toString(),
        serviceTitle: booking.serviceTitle
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Update booking with payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    booking.totalAmount = amount;
    await booking.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create checkout session for subscription
// @route   POST /api/payments/create-checkout-session
// @access  Private (company_owner)
exports.createCheckoutSession = async (req, res, next) => {
  try {
    if (!stripe) {
      return next(new AppError('Payment processing is not available', 503));
    }

    const { planId, billingCycle = 'month' } = req.body;

    // Get company
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Get subscription plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return next(new AppError('Subscription plan not found', 404));
    }

    // Get or create Stripe customer
    let stripeCustomerId = company.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: company.name,
        metadata: {
          companyId: company._id.toString()
        }
      });
      stripeCustomerId = customer.id;
      company.stripeCustomerId = stripeCustomerId;
      await company.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.CLIENT_URL}/company/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/company/subscription/cancel`,
      metadata: {
        companyId: company._id.toString(),
        planId: planId.toString()
      },
      subscription_data: {
        trial_period_days: plan.trialDays,
        metadata: {
          companyId: company._id.toString(),
          planId: planId.toString()
        }
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res, next) => {
  if (!stripe) {
    return res.status(503).json({ received: false, message: 'Webhook handling not available' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// @desc    Get company earnings
// @route   GET /api/company/earnings
// @access  Private (company_owner)
exports.getCompanyEarnings = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;

    // Get company
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Build date filter
    const dateFilter = { 
      companyId: company._id,
      paymentStatus: 'Paid'
    };

    if (startDate || endDate) {
      dateFilter.updatedAt = {};
      if (startDate) dateFilter.updatedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.updatedAt.$lte = new Date(endDate);
    }

    // Get earnings data
    const earnings = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: period === 'month' ? { $month: '$updatedAt' } : null,
            day: period === 'day' ? { $dayOfMonth: '$updatedAt' } : null
          },
          totalEarnings: { $sum: '$totalAmount' },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    // Get summary stats
    const [summary] = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalAmount' },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        earnings,
        summary: summary || {
          totalEarnings: 0,
          totalBookings: 0,
          averageBookingValue: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get company payouts
// @route   GET /api/company/payouts
// @access  Private (company_owner)
exports.getCompanyPayouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    // Get company
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Build filter
    const filter = { companyId: company._id, paymentStatus: 'Paid' };
    if (status) filter.status = status;

    const payouts = await Booking.find(filter)
      .select('totalAmount paymentStatus updatedAt bookingId customerName')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);
    const totalAmount = await Booking.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        payouts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        totalAmount: totalAmount[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subscription status
// @route   GET /api/company/subscription
// @access  Private (company_owner)
exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    // Get company
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Get subscription
    const subscription = await Subscription.findOne({ companyId: company._id })
      .populate('planId');

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          hasSubscription: false,
          message: 'No active subscription'
        }
      });
    }

    // Check usage limits
    const usageCheck = await subscription.checkUsageLimits();

    res.json({
      success: true,
      data: {
        hasSubscription: true,
        subscription,
        plan: subscription.planId,
        usageCheck,
        daysUntilRenewal: subscription.daysUntilRenewal
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel subscription
// @route   POST /api/company/subscription/cancel
// @access  Private (company_owner)
exports.cancelSubscription = async (req, res, next) => {
  try {
    // Get company
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Get subscription
    const subscription = await Subscription.findOne({ companyId: company._id });
    if (!subscription) {
      return next(new AppError('No active subscription found', 404));
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current period',
      data: {
        cancelAt: subscription.currentPeriodEnd
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refund a booking payment
// @route   POST /api/payments/refund/:bookingId
// @access  Private (admin or company_owner)
exports.refundBookingPayment = async (req, res, next) => {
  try {
    if (!stripe) {
      return next(new AppError('Payment processing is not available', 503));
    }

    const { bookingId } = req.params;
    const { amount, reason = 'requested_by_customer' } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new AppError('Booking not found', 404));

    if (booking.paymentStatus !== 'Paid') {
      return next(new AppError('Only paid bookings can be refunded', 400));
    }

    if (!booking.paymentIntentId) {
      return next(new AppError('No payment intent found for this booking', 400));
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund support
      reason
    });

    // Update booking
    booking.paymentStatus = amount ? 'Partially Refunded' : 'Refunded';
    booking.refundAmount = amount || booking.totalAmount;
    booking.status = 'Cancelled';
    await booking.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.id,
        status: refund.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions for webhook handlers
async function handlePaymentSucceeded(paymentIntent) {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    const booking = await Booking.findById(bookingId);
    
    if (booking) {
      booking.paymentStatus = 'Paid';
      booking.status = 'Confirmed';
      await booking.save();

      // Update service stats
      if (booking.serviceId) {
        await booking.serviceId.updateBookingStats('Confirmed', booking.totalAmount);
      }

      // Send confirmation email
      await sendPaymentConfirmationEmail(booking);
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    const booking = await Booking.findById(bookingId);
    
    if (booking) {
      booking.paymentStatus = 'Pending';
      await booking.save();
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleCheckoutCompleted(session) {
  try {
    const companyId = session.metadata.companyId;
    const planId = session.metadata.planId;

    const subscription = await Subscription.create({
      companyId,
      planId,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      status: 'active',
      currentPeriodStart: new Date(session.created * 1000),
      currentPeriodEnd: new Date(session.expires_at * 1000)
    });

    // Update company subscription plan
    await Company.findByIdAndUpdate(companyId, {
      subscriptionPlan: (await SubscriptionPlan.findById(planId)).name
    });
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    const subscriptionId = invoice.subscription;
    const subscription = await Subscription.findOne({ stripeSubscriptionId: subscriptionId });
    
    if (subscription) {
      subscription.status = 'active';
      subscription.currentPeriodStart = new Date(invoice.period_start * 1000);
      subscription.currentPeriodEnd = new Date(invoice.period_end * 1000);
      await subscription.save();
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    const subscriptionId = invoice.subscription;
    const subscription = await Subscription.findOne({ stripeSubscriptionId: subscriptionId });
    
    if (subscription) {
      subscription.status = 'past_due';
      await subscription.save();
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const dbSubscription = await Subscription.findOne({ 
      stripeSubscriptionId: subscription.id 
    });
    
    if (dbSubscription) {
      dbSubscription.status = 'canceled';
      dbSubscription.endedAt = new Date();
      await dbSubscription.save();

      // Update company subscription plan
      await Company.findByIdAndUpdate(dbSubscription.companyId, {
        subscriptionPlan: 'Free'
      });
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}
