/**
 * Multi-tenant isolation middleware
 * Ensures users can only access data from their own company
 */

const Company = require('../models/Company');
const { AppError } = require('./errorMiddleware');

// Middleware to ensure user belongs to a company and can only access their company's data
const requireCompanyAccess = async (req, res, next) => {
  try {
    // Skip for admin users
    if (req.user.role === 'admin') {
      return next();
    }

    // Skip for regular users (customers) accessing their own data
    if (req.user.role === 'user') {
      return next();
    }

    // For company_owner and company_staff, ensure they have a company
    if (!req.user.companyId) {
      return next(new AppError('You must be associated with a company to access this resource', 403));
    }

    // Verify the company exists and user is a member
    const company = await Company.findOne({
      _id: req.user.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!company) {
      return next(new AppError('Company access denied', 403));
    }

    // Add company context to request for use in controllers
    req.companyContext = {
      companyId: company._id,
      isOwner: company.ownerId.toString() === req.user._id.toString(),
      isStaff: company.staffIds.some(id => id.toString() === req.user._id.toString())
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to filter queries by company ID
const filterByCompany = (req, res, next) => {
  try {
    // Skip for admin users
    if (req.user.role === 'admin') {
      return next();
    }

    // Skip for regular users accessing their own bookings
    if (req.user.role === 'user') {
      return next();
    }

    // Add company filter to query
    if (req.companyContext && req.companyContext.companyId) {
      if (!req.query) req.query = {};
      req.query.companyId = req.companyContext.companyId;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to ensure company ownership for specific operations
const requireCompanyOwner = (req, res, next) => {
  try {
    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Must have company context and be owner
    if (!req.companyContext || !req.companyContext.isOwner) {
      return next(new AppError('Only company owners can perform this action', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Helper function to add company filter to mongoose queries
const addCompanyFilter = (query, companyId, userRole) => {
  // Don't filter for admins
  if (userRole === 'admin') {
    return query;
  }

  // Add company filter for company users
  if (companyId && (userRole === 'company_owner' || userRole === 'company_staff')) {
    query.companyId = companyId;
  }

  return query;
};

// Validation middleware for cross-company data access
const validateCompanyIsolation = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      
      // Skip for admin
      if (req.user.role === 'admin') {
        return next();
      }

      // Skip for users accessing their own resources
      if (req.user.role === 'user') {
        // For bookings, ensure user is the customer
        if (resourceType === 'booking') {
          const Booking = require('../models/Booking');
          const booking = await Booking.findById(resourceId);
          if (!booking || booking.customerId.toString() !== req.user._id.toString()) {
            return next(new AppError('Access denied', 403));
          }
        }
        return next();
      }

      // For company users, ensure resource belongs to their company
      if (req.companyContext && req.companyContext.companyId) {
        let Model;
        
        switch (resourceType) {
          case 'booking':
            Model = require('../models/Booking');
            break;
          case 'service':
            Model = require('../models/Service');
            break;
          case 'staff':
            Model = require('../models/Staff');
            break;
          default:
            return next();
        }

        const resource = await Model.findById(resourceId);
        if (!resource || resource.companyId?.toString() !== req.companyContext.companyId.toString()) {
          return next(new AppError('Access denied: Resource does not belong to your company', 403));
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireCompanyAccess,
  filterByCompany,
  requireCompanyOwner,
  addCompanyFilter,
  validateCompanyIsolation
};
