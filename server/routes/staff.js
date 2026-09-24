const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

// Staff-only routes
router.get('/me/dashboard', protect, staffController.getStaffDashboard);
router.patch('/me/status', protect, staffController.toggleStaffStatus);
router.put('/me/profile', protect, staffController.updateStaffProfile);

module.exports = router;
