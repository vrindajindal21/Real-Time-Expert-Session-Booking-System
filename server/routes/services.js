const express = require('express');
const router = express.Router();
const {
  createService,
  getCompanyServices,
  getService,
  updateService,
  deleteService,
  assignStaffToService,
  getAllServices,
  getCategories
} = require('../controllers/serviceController');
const { protect, companyOwner } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllServices);
router.get('/categories', getCategories);
router.get('/company/:id', getCompanyServices);
router.get('/:id', getService);

// Protected routes - require authentication and company ownership
router.use(protect);

router.post('/create', companyOwner, createService);
router.patch('/:id', companyOwner, updateService);
router.delete('/:id', companyOwner, deleteService);
router.post('/:id/assign-staff', companyOwner, assignStaffToService);

module.exports = router;
