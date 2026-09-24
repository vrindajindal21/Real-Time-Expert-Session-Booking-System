const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllUsers,
  getPendingExperts,
  toggleExpertStatus,
  toggleUserBan,
  deleteUser,
  getTopExperts,
  createCategory,
  updateCategory,
  toggleCategory,
  getAllCategories
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Publicly viewable but part of admin controller logic for simplicity
router.get('/categories/all', getAllCategories);

// All other admin routes are protected + admin-only
router.use(protect, admin);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/experts/pending', getPendingExperts);
router.get('/experts/top', getTopExperts);
router.patch('/experts/:id/toggle', toggleExpertStatus);
router.patch('/users/:id/ban', toggleUserBan);
router.delete('/users/:id', deleteUser);

// Category Management
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.patch('/categories/:id/toggle', toggleCategory);

module.exports = router;
