const Expert = require('../models/Expert');
const Staff = require('../models/Staff');
const mongoose = require('mongoose');
const { generateSlots } = require('../utils/slotGenerator');
const cache = require('../utils/cache');

// Helper to invalidate expert caches
const invalidateExpertCache = async (expertId, userId) => {
  if (expertId) {
    await cache.del(`experts:profile:${expertId}`);
  }
  if (userId) {
    await cache.del(`experts:profile:${userId}`);
  }
  await cache.delPattern('experts:list:*');
};

// Get all experts with pagination and filtering
exports.getExperts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minExperience = req.query.minExperience || '';
    
    // Generate distinct cache key based on query filters
    const cacheKey = `experts:list:page=${page}:limit=${limit}:search=${search}:category=${category}:minExp=${minExperience}`;
    
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const skip = (page - 1) * limit;
    
    // Build query
    let query = { isActive: true, isApproved: true };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    if (minExperience) {
      query.experience = { $gte: parseInt(minExperience) };
    }
    
    const experts = await Expert.find(query)
      .select('-timeSlots')
      .sort({ rating: -1, name: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Expert.countDocuments(query);
    
    const result = {
      experts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    };

    // Cache the listing results for 5 minutes (300 seconds)
    await cache.set(cacheKey, result, 300);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get expert by ID with available time slots
exports.getExpertById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid expert ID' });
    }
    
    const cacheKey = `experts:profile:${id}`;
    const cachedExpert = await cache.get(cacheKey);
    if (cachedExpert) {
      return res.json(cachedExpert);
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
    
    // Cache profile for 5 minutes
    await cache.set(cacheKey, expertWithGroupedSlots, 300);
    
    res.json(expertWithGroupedSlots);
  } catch (error) {
    next(error);
  }
};

// Get own profile (Host App)
exports.getMyProfile = async (req, res, next) => {
  try {
    let expert = await Expert.findOne({ userId: req.user._id });
    
    // Auto-heal: If no expert profile exists but user has a provider role, create a default one
    if (!expert && ['expert', 'admin', 'company_owner', 'company_staff', 'provider'].includes(req.user.role)) {
      expert = await Expert.create({
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '0000000000',
        experience: 0,
        rating: 0,
        category: 'Other',
        companyName: '',
        providerType: 'Individual',
        bio: 'Welcome to our professional network.',
        isApproved: true,
        isActive: true,
        services: [
          { title: 'Introductory Session', price: 0, duration: 30, description: 'Initial consultation', type: 'Session' }
        ],
        timeSlots: []
      });
      // Invalidate list caches as new profile is compiled
      await invalidateExpertCache(null, req.user._id);
    } else if (!expert) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    res.json(expert);
  } catch (error) {
    next(error);
  }
};

// Update expert profile (Host App)
exports.updateExpertProfile = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;     // Prevent Immutable _id modification errors
    delete updateData.userId;  // Prevent user mapping errors

    const expert = await Expert.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!expert) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    // Invalidate caches
    await invalidateExpertCache(expert._id, req.user._id);

    res.json(expert);
  } catch (error) {
    next(error);
  }
};

// Update time slots (Host App)
exports.updateTimeSlots = async (req, res, next) => {
  try {
    const { timeSlots } = req.body;
    const expert = await Expert.findOne({ userId: req.user._id });

    if (!expert) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    expert.timeSlots = timeSlots;
    await expert.save();

    // Invalidate caches
    await invalidateExpertCache(expert._id, req.user._id);

    res.json({ message: 'Time slots updated successfully', timeSlots: expert.timeSlots });
  } catch (error) {
    next(error);
  }
};

// Add single time slot (Host App)
exports.addTimeSlot = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    const expert = await Expert.findOne({ userId: req.user._id });

    if (!expert) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    // Check for duplicate slot
    const isDuplicate = expert.timeSlots.some(slot => 
      new Date(slot.date).toDateString() === new Date(date).toDateString() &&
      slot.startTime === startTime &&
      slot.endTime === endTime
    );

    if (isDuplicate) {
      return res.status(400).json({ message: 'This slot already exists' });
    }

    expert.timeSlots.push({ date, startTime, endTime, isBooked: false });
    await expert.save();

    // Invalidate caches
    await invalidateExpertCache(expert._id, req.user._id);

    res.status(201).json({ message: 'Slot added successfully', timeSlots: expert.timeSlots });
  } catch (error) {
    next(error);
  }
};

// Delete single time slot (Host App)
exports.deleteTimeSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const expert = await Expert.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { timeSlots: { _id: slotId } } },
      { new: true }
    );

    if (!expert) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    // Invalidate caches
    await invalidateExpertCache(expert._id, req.user._id);

    res.json({ message: 'Slot removed successfully', timeSlots: expert.timeSlots });
  } catch (error) {
    next(error);
  }
};

// Delete all time slots (Host App)
exports.clearAllSlots = async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user._id });
    if (!expert) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    // Direct atomic update
    await Expert.updateOne({ _id: expert._id }, { $set: { timeSlots: [] } });

    // Invalidate caches
    await invalidateExpertCache(expert._id, req.user._id);

    res.json({ message: 'All slots cleared successfully', timeSlots: [] });
  } catch (error) {
    next(error);
  }
};

// Auto-generate weekly slots (Host App)
exports.autoGenerateWeeklySlots = async (req, res, next) => {
  try {
    const { startDate, startTime, endTime, duration, days } = req.body;
    const expert = await Expert.findOne({ userId: req.user._id });
    if (!expert) return res.status(404).json({ message: 'Expert profile not found' });

    let allNewSlots = [];
    const baseDate = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(baseDate.getDate() + i);
      if (days.includes(currentDate.getDay())) {
        const dailySlots = generateSlots(currentDate, startTime, endTime, duration);
        allNewSlots = [...allNewSlots, ...dailySlots];
      }
    }

    expert.timeSlots = [...expert.timeSlots, ...allNewSlots];
    await expert.save();

    // Invalidate caches
    await invalidateExpertCache(expert._id, req.user._id);

    res.json({ message: 'Weekly schedule generated successfully', totalSlots: allNewSlots.length });
  } catch (error) {
    next(error);
  }
};

// Team Management (Host App)
exports.addStaffMember = async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user._id });
    if (!expert) return res.status(404).json({ message: 'Expert profile not found' });

    const payload = { ...req.body };
    if (payload.experience !== undefined) {
      payload.experience = Number(payload.experience);
    }

    const staff = await Staff.create({
      ...payload,
      expertId: expert._id
    });

    // Invalidate caches
    await invalidateExpertCache(expert._id, req.user._id);

    res.status(201).json(staff);
  } catch (error) {
    next(error);
  }
};

exports.getStaffByProvider = async (req, res, next) => {
  try {
    const { expertId } = req.params;
    const staff = await Staff.find({ expertId, isActive: true });
    res.json(staff);
  } catch (error) {
    next(error);
  }
};

exports.removeStaffMember = async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user._id });
    const staff = await Staff.findOne({ _id: req.params.id, expertId: expert._id });
    
    if (!staff) return res.status(404).json({ message: 'Staff member not found or unauthorized' });
    
    staff.isActive = false;
    await staff.save();
    
    // Invalidate caches
    await invalidateExpertCache(expert._id, req.user._id);

    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    next(error);
  }
};

// Update staff member details
exports.updateStaffMember = async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user._id });
    if (!expert) return res.status(404).json({ message: 'Expert profile not found' });

    const staff = await Staff.findOne({ _id: req.params.id, expertId: expert._id });
    if (!staff) return res.status(404).json({ message: 'Staff member not found or unauthorized' });

    const { name, role, specialization, experience, bio, skills, languages, phone } = req.body;
    
    if (name !== undefined) staff.name = name;
    if (role !== undefined) staff.role = role;
    if (specialization !== undefined) {
      staff.specialization = Array.isArray(specialization)
        ? specialization
        : specialization.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (experience !== undefined) staff.experience = Number(experience) || 0;
    if (bio !== undefined) staff.bio = bio;
    if (skills !== undefined) staff.skills = skills;
    if (languages !== undefined) staff.languages = languages;
    if (phone !== undefined) staff.phone = phone;

    await staff.save();

    // Invalidate caches
    await invalidateExpertCache(expert._id, req.user._id);

    res.json(staff);
  } catch (error) {
    next(error);
  }
};
