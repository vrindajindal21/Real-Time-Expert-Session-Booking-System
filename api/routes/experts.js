const express = require('express');
const router = express.Router();
const expertController = require('../controllers/expertController');

const Expert = require('../models/Expert');

// GET /api/experts - Get all experts with pagination and filtering
router.get('/', expertController.getExperts);

// DEBUG ROUTE
router.get('/debug-db', async (req, res) => {
    try {
        const experts = await Expert.find({}).limit(1);
        res.json({ count: experts.length, experts });
    } catch (err) {
        res.status(500).json({ error: 'DB_ROUTER_FAIL', msg: err.message });
    }
});

// GET /api/experts/:id - Get expert by ID with time slots
router.get('/:id', expertController.getExpertById);

module.exports = router;
