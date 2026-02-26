const express = require('express');
const router = express.Router();
const expertController = require('../controllers/expertController');

// GET /api/experts - Get all experts with pagination and filtering
router.get('/', expertController.getExperts);

// GET /api/experts/:id - Get expert by ID with time slots
router.get('/:id', expertController.getExpertById);

module.exports = router;
