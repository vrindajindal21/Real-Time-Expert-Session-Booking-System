const Service = require('../models/Service');
const Company = require('../models/Company');
const Staff = require('../models/Staff');
const { AppError } = require('../middleware/errorMiddleware');
const cache = require('../utils/cache');

// Helper to invalidate services cache
const invalidateServicesCache = async (serviceId) => {
  if (serviceId) {
    await cache.del(`services:profile:${serviceId}`);
  }
  await cache.delPattern('services:company:*');
  await cache.delPattern('services:marketplace:*');
  await cache.delPattern('services:categories');
};

// @desc    Create a new service
// @route   POST /api/services/create
// @access  Private (company_owner)
exports.createService = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      duration,
      price,
      meetingType,
      maxParticipants,
      location,
      requirements,
      whatToBring,
      tags,
      images,
      videoUrl,
      bookingSettings,
      availability,
      pricingTiers
    } = req.body;

    // Verify company ownership
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    const service = await Service.create({
      title,
      description,
      category,
      duration,
      price,
      companyId: company._id,
      meetingType,
      maxParticipants,
      location,
      requirements,
      whatToBring,
      tags,
      images,
      videoUrl,
      bookingSettings,
      availability,
      pricingTiers
    });

    // Invalidate caches
    await invalidateServicesCache();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get services for a company
// @route   GET /api/services/company/:id
// @access  Public
exports.getCompanyServices = async (req, res, next) => {
  try {
    const companyId = req.params.id;
    const { category, minPrice, maxPrice, meetingType, page = 1, limit = 10 } = req.query;

    // Generate distinct cache key based on query filters
    const cacheKey = `services:company:${companyId}:cat=${category || ''}:min=${minPrice || ''}:max=${maxPrice || ''}:type=${meetingType || ''}:p=${page}:l=${limit}`;
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // Build filter
    const filter = { 
      companyId, 
      isActive: true 
    };

    if (category) filter.category = category;
    if (meetingType) filter.meetingType = meetingType;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const services = await Service.find(filter)
      .populate('assignedStaffIds', 'userId role rating')
      .populate({
        path: 'assignedStaffIds',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort({ 'stats.totalBookings': -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Service.countDocuments(filter);

    const result = {
      success: true,
      data: {
        services,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };

    // Cache results for 5 minutes
    await cache.set(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
exports.getService = async (req, res, next) => {
  try {
    const cacheKey = `services:profile:${req.params.id}`;
    const cachedService = await cache.get(cacheKey);
    if (cachedService) {
      return res.json(cachedService);
    }

    const service = await Service.findById(req.params.id)
      .populate('companyId', 'name logo description rating')
      .populate('assignedStaffIds', 'userId role rating skills bio')
      .populate({
        path: 'assignedStaffIds',
        populate: {
          path: 'userId',
          select: 'name avatar phone'
        }
      });

    if (!service || !service.isActive) {
      return next(new AppError('Service not found', 404));
    }

    const result = {
      success: true,
      data: service
    };

    // Cache service profile for 5 minutes
    await cache.set(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Update service
// @route   PATCH /api/services/:id
// @access  Private (company_owner)
exports.updateService = async (req, res, next) => {
  try {
    const serviceId = req.params.id;
    const allowedFields = [
      'title', 'description', 'category', 'duration', 'price',
      'meetingType', 'maxParticipants', 'location', 'requirements',
      'whatToBring', 'tags', 'images', 'videoUrl', 'bookingSettings',
      'availability', 'pricingTiers', 'isActive', 'isFeatured'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Verify company ownership
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    const company = await Company.findOne({ 
      _id: service.companyId, 
      ownerId: req.user._id 
    });
    
    if (!company) {
      return next(new AppError('Not authorized to update this service', 403));
    }

    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedStaffIds', 'userId role');

    // Invalidate caches
    await invalidateServicesCache(serviceId);

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: updatedService
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (company_owner)
exports.deleteService = async (req, res, next) => {
  try {
    const serviceId = req.params.id;

    // Verify company ownership
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    const company = await Company.findOne({ 
      _id: service.companyId, 
      ownerId: req.user._id 
    });
    
    if (!company) {
      return next(new AppError('Not authorized to delete this service', 403));
    }

    // Check if service has active bookings
    const Booking = require('../models/Booking');
    const activeBookings = await Booking.countDocuments({
      serviceId: serviceId,
      status: { $in: ['Pending', 'Confirmed'] }
    });

    if (activeBookings > 0) {
      return next(new AppError('Cannot delete service with active bookings', 400));
    }

    // Soft delete (set inactive)
    service.isActive = false;
    await service.save();

    // Invalidate caches
    await invalidateServicesCache(serviceId);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign staff to service
// @route   POST /api/services/:id/assign-staff
// @access  Private (company_owner)
exports.assignStaffToService = async (req, res, next) => {
  try {
    const { staffIds } = req.body;
    const serviceId = req.params.id;

    // Verify company ownership
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    const company = await Company.findOne({ 
      _id: service.companyId, 
      ownerId: req.user._id 
    });
    
    if (!company) {
      return next(new AppError('Not authorized to update this service', 403));
    }

    // Verify all staff belong to this company
    const staff = await Staff.find({
      _id: { $in: staffIds },
      companyId: company._id
    });

    if (staff.length !== staffIds.length) {
      return next(new AppError('Some staff members not found in your company', 400));
    }

    // Update service
    service.assignedStaffIds = staffIds;
    await service.save();

    const updatedService = await Service.findById(serviceId)
      .populate('assignedStaffIds', 'userId role rating')
      .populate({
        path: 'assignedStaffIds',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      });

    // Invalidate caches
    await invalidateServicesCache(serviceId);

    res.json({
      success: true,
      message: 'Staff assigned successfully',
      data: updatedService
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all services (marketplace)
// @route   GET /api/services
// @access  Public
exports.getAllServices = async (req, res, next) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      meetingType,
      search,
      featured,
      page = 1,
      limit = 12,
      sortBy = 'stats.totalBookings',
      sortOrder = 'desc'
    } = req.query;

    const cacheKey = `services:marketplace:cat=${category || ''}:min=${minPrice || ''}:max=${maxPrice || ''}:type=${meetingType || ''}:s=${search || ''}:f=${featured || ''}:p=${page}:l=${limit}:sb=${sortBy}:so=${sortOrder}`;
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // Build filter
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (meetingType) filter.meetingType = meetingType;
    if (featured === 'true') filter.isFeatured = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const services = await Service.find(filter)
      .populate('companyId', 'name logo rating')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Service.countDocuments(filter);

    const result = {
      success: true,
      data: {
        services,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };

    // Cache results for 5 minutes
    await cache.set(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get service categories
// @route   GET /api/services/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const cacheKey = 'services:categories';
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const categories = await Service.distinct('category', { isActive: true });
    
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const count = await Service.countDocuments({ 
          category, 
          isActive: true 
        });
        const avgPrice = await Service.aggregate([
          { $match: { category, isActive: true } },
          { $group: { _id: null, avgPrice: { $avg: '$price' } } }
        ]);

        return {
          name: category,
          count,
          avgPrice: avgPrice[0]?.avgPrice || 0
        };
      })
    );

    const result = {
      success: true,
      data: categoryStats.sort((a, b) => b.count - a.count)
    };

    // Cache categories stats for 5 minutes
    await cache.set(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
