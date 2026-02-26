const express = require('express');
const router = express.Router();
const expertController = require('../controllers/expertController');
const mongoose = require('mongoose');

const Expert = require('../models/Expert');
const Booking = require('../models/Booking');

// GET /api/experts - Get all experts with pagination and filtering
router.get('/', expertController.getExperts);

// DEBUG CONNECTION ROUTE
router.get('/debug-connection', async (req, res) => {
    try {
        const expertCount = await Expert.countDocuments({});
        const bookingCount = await Booking.countDocuments({});
        res.json({
            success: true,
            expertCount,
            bookingCount,
            dbStatus: mongoose.connection.readyState // 1 = Connected
        });
    } catch (err) {
        res.status(500).json({
            error: 'DEBUG_CONNECTION_FAIL',
            msg: err.message,
            ready: mongoose.connection.readyState
        });
    }
});

// GET /api/experts/:id - Get expert by ID with time slots
router.get('/:id', expertController.getExpertById);

module.exports = router;
