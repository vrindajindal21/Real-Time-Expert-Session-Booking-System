const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Get all conversations for a user
router.get('/conversations', protect, chatController.getConversations);

// Get unread message count
router.get('/unread/count', protect, chatController.getUnreadCount);

// Get message history for a booking room
router.get('/:roomId', protect, chatController.getMessages);

// Mark messages as read
router.patch('/:roomId/read', protect, chatController.markAsRead);

module.exports = router;
