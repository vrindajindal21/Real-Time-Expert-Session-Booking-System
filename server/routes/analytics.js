const express = require('express');
const router = express.Router();
const {
  getRevenueAnalytics,
  getBookingsGrowth,
  getPopularServices,
  getTopStaff,
  getReturningUsers,
  getDashboardAnalytics
} = require('../controllers/analyticsController');
const { protect, expertOrCompanyMember } = require('../middleware/authMiddleware');

// All routes require authentication and provider/company membership
router.use(protect);
router.use(expertOrCompanyMember);

// Analytics endpoints
router.get('/dashboard', getDashboardAnalytics);
router.get('/revenue', getRevenueAnalytics);
router.get('/bookings-growth', getBookingsGrowth);
router.get('/popular-services', getPopularServices);
router.get('/top-staff', getTopStaff);
router.get('/returning-users', getReturningUsers);

module.exports = router;
