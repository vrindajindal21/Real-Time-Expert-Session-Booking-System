const express = require('express');
const router = express.Router();
const {
  getVerificationStatus,
  requestVerification
} = require('../controllers/trustController');
const { protect, companyOwner } = require('../middleware/authMiddleware');

// All routes require authentication and company ownership
router.use(protect);
router.use(companyOwner);

router.get('/verification-status', getVerificationStatus);
router.post('/request-verification', requestVerification);

module.exports = router;
