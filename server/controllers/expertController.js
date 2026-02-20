const Expert = require('../models/Expert');
const mongoose = require('mongoose');

// Get all experts with pagination and filtering
exports.getExperts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query = { isActive: true };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const experts = await Expert.find(query)
      .select('-timeSlots')
      .sort({ rating: -1, name: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Expert.countDocuments(query);
    
    res.json({
      experts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching experts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch experts',
      message: error.message 
    });
  }
};

// Get expert by ID with available time slots
exports.getExpertById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid expert ID' });
    }
    
    const expert = await Expert.findById(id);
    
    if (!expert) {
      return res.status(404).json({ error: 'Expert not found' });
    }
    
    // Group time slots by date
    const groupedSlots = {};
    expert.timeSlots.forEach(slot => {
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!groupedSlots[dateKey]) {
        groupedSlots[dateKey] = [];
      }
      groupedSlots[dateKey].push({
        _id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked
      });
    });
    
    const expertWithGroupedSlots = {
      ...expert.toObject(),
      groupedTimeSlots: groupedSlots
    };
    
    delete expertWithGroupedSlots.timeSlots;
    
    res.json(expertWithGroupedSlots);
  } catch (error) {
    console.error('Error fetching expert:', error);
    res.status(500).json({ 
      error: 'Failed to fetch expert',
      message: error.message 
    });
  }
};
