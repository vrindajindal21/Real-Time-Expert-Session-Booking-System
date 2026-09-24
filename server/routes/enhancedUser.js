const express = require('express');
const router = express.Router();
const {
  getUserDashboard,
  getUserBookings,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  getUserReviews,
  createReview,
  getPaymentHistory,
  getChatHistory
} = require('../controllers/enhancedUserController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// User dashboard
router.get('/dashboard', getUserDashboard);

// User bookings
router.get('/bookings', getUserBookings);

// Favorites management
router.post('/favorites', addToFavorites);
router.delete('/favorites/:serviceId', removeFromFavorites);
router.get('/favorites', getFavorites);

// Reviews management
router.get('/reviews', getUserReviews);
router.post('/reviews', createReview);

// Payment history
router.get('/payments', getPaymentHistory);

// Chat history
router.get('/chats', getChatHistory);

module.exports = router;
