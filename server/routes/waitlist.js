const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  joinWaitlist,
  getMyWaitlist,
  leaveWaitlist,
  acceptWaitlistOffer,
  getSlotWaitlist
} = require('../controllers/waitlistController');

router.post('/', protect, joinWaitlist);
router.get('/mine', protect, getMyWaitlist);
router.get('/slot', protect, getSlotWaitlist);
router.delete('/:id', protect, leaveWaitlist);
router.post('/:id/accept', protect, acceptWaitlistOffer);

module.exports = router;
