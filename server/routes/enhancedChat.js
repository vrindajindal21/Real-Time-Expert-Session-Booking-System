const express = require('express');
const router = express.Router();
const {
  sendFileMessage,
  addSessionNotes,
  getSessionHistory,
  addReaction,
  editMessage,
  deleteMessage,
  getUnreadCount,
  markMessagesAsRead
} = require('../controllers/enhancedChatController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// File sharing and enhanced messaging
router.post('/send-file', sendFileMessage);

// Session notes and history
router.post('/session/notes', addSessionNotes);
router.get('/session/history/:bookingId', getSessionHistory);

// Message interactions
router.post('/reaction/:messageId', addReaction);
router.patch('/edit/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);

// Message status
router.get('/unread-count', getUnreadCount);
router.patch('/mark-read/:bookingId', markMessagesAsRead);

module.exports = router;
