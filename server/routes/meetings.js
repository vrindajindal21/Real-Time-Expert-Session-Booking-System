const express = require('express');
const router = express.Router();
const {
  createMeetingLink,
  updateMeetingLink,
  getMeetingDetails,
  deleteMeetingLink,
  getSupportedPlatforms,
  autoCreateMeeting
} = require('../controllers/meetingController');
const { protect, companyMember } = require('../middleware/authMiddleware');

// Public routes
router.get('/platforms', getSupportedPlatforms);

// Protected routes
router.use(protect);

// Auto-create meeting from booking (company members only)
router.post('/auto-create', companyMember, async (req, res, next) => {
  try {
    const { booking, platform } = req.body;
    if (!booking) return res.status(400).json({ message: 'booking object is required' });
    const result = await autoCreateMeeting(booking, platform || 'google_meet');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Meeting management (company members only)
router.post('/create', companyMember, createMeetingLink);
router.patch('/:bookingId', companyMember, updateMeetingLink);
router.delete('/:bookingId', companyMember, deleteMeetingLink);

// View meeting details (customers and company members)
router.get('/:bookingId', getMeetingDetails);

module.exports = router;
