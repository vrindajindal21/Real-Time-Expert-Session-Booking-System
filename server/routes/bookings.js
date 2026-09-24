const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, expert, admin } = require('../middleware/authMiddleware');

// Consumer routes
router.post('/', protect, bookingController.createBooking);
router.get('/my', protect, bookingController.getCustomerBookings);
router.get('/:id', protect, bookingController.getBookingById);

// Host routes
router.get('/host/all', protect, expert, bookingController.getExpertBookings);

// Admin routes
router.get('/admin/all', protect, admin, bookingController.getAllBookings);

// Shared status update (user can cancel, expert can confirm/complete/cancel)
router.patch('/:id/status', protect, bookingController.updateBookingStatus);

module.exports = router;
