const express = require('express');
const router = express.Router();
const {
  createTestimonial,
  respondToTestimonial
} = require('../controllers/trustController');
const { protect, companyMember } = require('../middleware/authMiddleware');

// Testimonial creation (customers only)
router.post('/', protect, createTestimonial);

// Testimonial response (company members only)
router.post('/:id/respond', protect, companyMember, respondToTestimonial);

module.exports = router;
