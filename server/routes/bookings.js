const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// POST /api/bookings - Create a new booking
router.post('/', bookingController.createBooking);

// GET /api/bookings?email= - Get bookings by email
router.get('/', bookingController.getBookingsByEmail);

// PATCH /api/bookings/:id/status - Update booking status
router.patch('/:id/status', bookingController.updateBookingStatus);

module.exports = router;
