const Message = require('../models/Message');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Get message history for a conversation
// @route   GET /api/messages/:roomId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ conversationId: roomId })
      .populate('senderId', 'name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PATCH /api/messages/:roomId/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    await Message.updateMany(
      { conversationId: roomId, recipientId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread message count for a user
// @route   GET /api/messages/unread/count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      recipientId: req.user._id,
      isRead: false
    });
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active conversations for a user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Aggregate to get the latest message per conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { recipientId: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          latestMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$recipientId', userId] }, { $eq: ['$isRead', false] }] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Populate user details for the OTHER participant
    await Message.populate(conversations, {
      path: 'latestMessage.senderId latestMessage.recipientId',
      select: 'name avatar email'
    });

    // Format the response
    const formatted = conversations.map(conv => {
      const msg = conv.latestMessage;
      // Determine who the "other" person is
      const otherUser = msg.senderId._id.toString() === userId.toString() 
        ? msg.recipientId 
        : msg.senderId;

      return {
        conversationId: conv._id,
        otherUser,
        lastMessage: {
          text: msg.text,
          createdAt: msg.createdAt,
          isRead: msg.isRead,
          senderId: msg.senderId._id
        },
        unreadCount: conv.unreadCount
      };
    }).sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};
