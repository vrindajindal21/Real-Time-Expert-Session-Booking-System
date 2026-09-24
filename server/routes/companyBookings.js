const express = require('express');
const router = express.Router();
const {
  getUpcomingBookings,
  getCompletedBookings,
  getCancelledBookings,
  rescheduleBooking,
  cancelBooking,
  confirmBooking,
  completeBooking,
  getBookingStats
} = require('../controllers/companyBookingController');
const { protect, companyMember } = require('../middleware/authMiddleware');

// All routes require authentication and company membership
router.use(protect);
router.use(companyMember);

// Company booking dashboard routes
router.get('/upcoming', getUpcomingBookings);
router.get('/completed', getCompletedBookings);
router.get('/cancelled', getCancelledBookings);
router.get('/stats', getBookingStats);

// Booking management routes (also accessible to customers for their own bookings)
router.patch('/reschedule/:id', rescheduleBooking);
router.patch('/cancel/:id', cancelBooking);

// Company-only booking actions
router.patch('/confirm/:id', confirmBooking);
router.patch('/complete/:id', completeBooking);

module.exports = router;
