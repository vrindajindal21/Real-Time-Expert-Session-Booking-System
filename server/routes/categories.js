const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const cache = require('../utils/cache');

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'categories:list';
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const categories = await Category.find({ isActive: true });
    
    // Cache active categories list for 5 minutes (300 seconds)
    await cache.set(cacheKey, categories, 300);
    
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
