const express = require('express');
const router = express.Router();
const {
  createCompany,
  getCompanyDashboard,
  addStaff,
  getCompanyStaff,
  updateStaff,
  removeStaff,
  updateCompanyProfile
} = require('../controllers/companyController');
const { protect, companyOwner, companyMember } = require('../middleware/authMiddleware');

// Public route for company profile (will be added later)
// router.get('/public/:id', getPublicCompanyProfile);

// Protected routes - require authentication
router.use(protect);

// Company creation (only users can create companies)
router.post('/create', createCompany);

// Company dashboard and profile (owners and staff)
router.get('/dashboard', companyMember, getCompanyDashboard);
router.patch('/profile', companyOwner, updateCompanyProfile);

// Staff management (only company owners)
router.post('/add-staff', companyOwner, addStaff);
router.get('/staff', companyMember, getCompanyStaff);
router.patch('/staff/:id', companyOwner, updateStaff);
router.delete('/staff/:id', companyOwner, removeStaff);

module.exports = router;
