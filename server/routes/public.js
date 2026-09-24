const express = require('express');
const router = express.Router();
const {
  getPublicCompanyProfile,
  getCompanyReviews,
  getCompanyTestimonials,
  getTrustedCompanies,
  getGlobalStats
} = require('../controllers/trustController');

// Public routes (no authentication required)
router.get('/trusted-companies', getTrustedCompanies);
router.get('/global-stats', getGlobalStats);
router.get('/company/:id', getPublicCompanyProfile);
router.get('/company/:id/reviews', getCompanyReviews);
router.get('/company/:id/testimonials', getCompanyTestimonials);

module.exports = router;
