const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  createCheckoutSession,
  handleWebhook,
  getCompanyEarnings,
  getCompanyPayouts,
  getSubscriptionStatus,
  cancelSubscription,
  refundBookingPayment
} = require('../controllers/paymentController');
const { protect, companyOwner } = require('../middleware/authMiddleware');

// Public webhook endpoint (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected payment routes
router.use(protect);

// Booking payments
router.post('/create-payment-intent', createPaymentIntent);

// Company subscription routes (company owners only)
router.post('/create-checkout-session', companyOwner, createCheckoutSession);
router.get('/company/subscription', companyOwner, getSubscriptionStatus);
router.post('/company/subscription/cancel', companyOwner, cancelSubscription);

// Company earnings and payouts
router.get('/company/earnings', companyOwner, getCompanyEarnings);
router.get('/company/payouts', companyOwner, getCompanyPayouts);

// Refund route
router.post('/refund/:bookingId', companyOwner, refundBookingPayment);

module.exports = router;
