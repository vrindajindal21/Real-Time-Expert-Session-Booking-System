const express = require('express');
const router = express.Router();
const { addReview, getExpertReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addReview);
router.get('/expert/:expertId', getExpertReviews);

module.exports = router;
