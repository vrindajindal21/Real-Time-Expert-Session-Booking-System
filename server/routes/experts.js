const express = require('express');
const router = express.Router();
const expertController = require('../controllers/expertController');
const { protect, expert } = require('../middleware/authMiddleware');

// Protected routes (Host App)
router.get('/profile', protect, expert, expertController.getMyProfile);

// Public routes (Consumer App)
router.get('/', expertController.getExperts);
router.get('/:id', expertController.getExpertById);
router.put('/me', protect, expert, expertController.updateExpertProfile);
router.put('/me/slots', protect, expert, expertController.updateTimeSlots);
router.post('/slots', protect, expert, expertController.addTimeSlot);
router.delete('/slots/clear', protect, expert, expertController.clearAllSlots);
router.delete('/slots/:slotId', protect, expert, expertController.deleteTimeSlot);
router.post('/me/slots/generate', protect, expert, expertController.autoGenerateWeeklySlots);
router.post('/me/staff', protect, expert, expertController.addStaffMember);
router.put('/me/staff/:id', protect, expert, expertController.updateStaffMember);
router.delete('/me/staff/:id', protect, expert, expertController.removeStaffMember);
router.get('/:expertId/staff', expertController.getStaffByProvider);

module.exports = router;
