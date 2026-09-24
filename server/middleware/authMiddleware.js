const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Fail fast if JWT_SECRET is not configured
  if (!process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET environment variable is not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Check if token has been blacklisted on logout
      const cache = require('../utils/cache');
      const isBlacklisted = await cache.get(`jwt:blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({ message: 'Not authorized, session has been logged out' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      if (!req.user.isActive) {
        return res.status(401).json({ message: 'Account has been deactivated' });
      }
      
      next();
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const expert = (req, res, next) => {
  if (req.user && (['expert', 'provider', 'admin', 'company_owner', 'company_staff'].includes(req.user.role))) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a provider' });
  }
};

const companyOwner = (req, res, next) => {
  if (req.user && (req.user.role === 'company_owner' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a company owner' });
  }
};

const companyMember = async (req, res, next) => {
  if (req.user && (req.user.role === 'company_owner' || req.user.role === 'company_staff' || req.user.role === 'admin')) {
    // Additional check to ensure user belongs to a company
    if (req.user.role !== 'admin' && !req.user.companyId) {
      return res.status(401).json({ message: 'Not associated with any company' });
    }
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a company member' });
  }
};

// Allows individual experts AND company members — used for analytics routes
const expertOrCompanyMember = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
  const allowedRoles = ['expert', 'provider', 'company_owner', 'company_staff', 'admin'];
  if (allowedRoles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a provider or company member' });
  }
};

module.exports = { protect, admin, expert, companyOwner, companyMember, expertOrCompanyMember };
