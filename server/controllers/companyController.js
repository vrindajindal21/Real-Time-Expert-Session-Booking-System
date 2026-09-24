const Company = require('../models/Company');
const User = require('../models/User');
const { AppError } = require('../middleware/errorMiddleware');
const { sendCompanyWelcomeEmail } = require('../utils/emailService');

// @desc    Create a new company
// @route   POST /api/company/create
// @access  Private (company_owner)
exports.createCompany = async (req, res, next) => {
  try {
    const {
      name,
      industry,
      description,
      website,
      timezone,
      workingHours,
      cancellationPolicy,
      refundPolicy
    } = req.body;

    // Check if user already has a company
    const existingCompany = await Company.findOne({ ownerId: req.user._id });
    if (existingCompany) {
      return next(new AppError('You already own a company', 400));
    }

    // Update user role to company_owner
    await User.findByIdAndUpdate(req.user._id, { role: 'company_owner' });

    const company = await Company.create({
      name,
      industry,
      description,
      website,
      ownerId: req.user._id,
      timezone,
      workingHours,
      cancellationPolicy,
      refundPolicy
    });

    // Update user's companyId
    await User.findByIdAndUpdate(req.user._id, { companyId: company._id });

    // Send welcome email
    await sendCompanyWelcomeEmail(req.user.email, company.name);

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get company dashboard
// @route   GET /api/company/dashboard
// @access  Private (company_owner, company_staff)
exports.getCompanyDashboard = async (req, res, next) => {
  try {
    const company = await Company.findOne({
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    }).populate('ownerId', 'name email')
      .populate('staffIds', 'name email avatar');

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Get recent bookings for this company
    const Booking = require('../models/Booking');
    const recentBookings = await Booking.find({
      companyId: company._id
    }).populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get staff performance
    const staffPerformance = await Booking.aggregate([
      { $match: { companyId: company._id, status: 'Completed' } },
      { $group: { _id: '$assignedStaffId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        company,
        recentBookings,
        staffPerformance,
        stats: {
          totalStaff: company.staffIds.length,
          totalServices: company.services.length,
          activeBookings: recentBookings.filter(b => ['Pending', 'Confirmed'].includes(b.status)).length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add staff member to company
// @route   POST /api/company/add-staff
// @access  Private (company_owner)
exports.addStaff = async (req, res, next) => {
  try {
    const { email, role, skills, bio, languages } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('User not found with this email', 404));
    }

    // Check if user is already staff in this company
    const company = await Company.findOne({ ownerId: req.user._id });
    if (company.staffIds.includes(user._id)) {
      return next(new AppError('User is already a staff member', 400));
    }

    // Verify target user's role is strictly 'user' to protect privileged roles from accidental promotion/override
    if (user.role !== 'user') {
      return next(new AppError('Only users with the default role ("user") can be added as company staff', 400));
    }

    // Update user role and companyId
    await User.findByIdAndUpdate(user._id, {
      role: 'company_staff',
      companyId: company._id
    });

    // Add to company staff
    company.staffIds.push(user._id);
    await company.save();

    // Create staff profile
    const Staff = require('../models/Staff');
    await Staff.create({
      userId: user._id,
      companyId: company._id,
      role: role || 'staff',
      skills: skills || [],
      bio: bio || '',
      languages: languages || []
    });

    res.json({
      success: true,
      message: 'Staff member added successfully',
      data: { user, company }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get company staff
// @route   GET /api/company/staff
// @access  Private (company_owner, company_staff)
exports.getCompanyStaff = async (req, res, next) => {
  try {
    const company = await Company.findOne({
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    }).populate({
      path: 'staffIds',
      select: 'name email avatar phone'
    }).populate('ownerId', 'name email avatar phone');

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Get detailed staff information
    const Staff = require('../models/Staff');
    const staffDetails = await Staff.find({ companyId: company._id })
      .populate('userId', 'name email avatar phone');

    res.json({
      success: true,
      data: {
        owner: company.ownerId,
        staff: staffDetails,
        totalStaff: company.staffIds.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update staff member
// @route   PATCH /api/company/staff/:id
// @access  Private (company_owner)
exports.updateStaff = async (req, res, next) => {
  try {
    const { role, skills, bio, languages, availability } = req.body;
    const staffId = req.params.id;

    // Verify company ownership
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Update staff profile
    const Staff = require('../models/Staff');
    const staff = await Staff.findOneAndUpdate(
      { userId: staffId, companyId: company._id },
      { role, skills, bio, languages, availability },
      { new: true, runValidators: true }
    ).populate('userId', 'name email avatar');

    if (!staff) {
      return next(new AppError('Staff member not found', 404));
    }

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove staff member
// @route   DELETE /api/company/staff/:id
// @access  Private (company_owner)
exports.removeStaff = async (req, res, next) => {
  try {
    const staffId = req.params.id;

    // Verify company ownership
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Remove from company staff array
    company.staffIds = company.staffIds.filter(id => id.toString() !== staffId);
    await company.save();

    // Update user role back to user
    await User.findByIdAndUpdate(staffId, {
      role: 'user',
      companyId: null
    });

    // Delete staff profile
    const Staff = require('../models/Staff');
    await Staff.findOneAndDelete({ userId: staffId, companyId: company._id });

    res.json({
      success: true,
      message: 'Staff member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company profile
// @route   PATCH /api/company/profile
// @access  Private (company_owner)
exports.updateCompanyProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'industry', 'description', 'website', 'timezone',
      'workingHours', 'cancellationPolicy', 'refundPolicy'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const company = await Company.findOneAndUpdate(
      { ownerId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};
