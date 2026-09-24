const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// User notification management
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

// Notification preferences
router.get('/preferences', getNotificationPreferences);
router.patch('/preferences', updateNotificationPreferences);

// Internal notification creation (protected)
router.post('/create', createNotification);

module.exports = router;
