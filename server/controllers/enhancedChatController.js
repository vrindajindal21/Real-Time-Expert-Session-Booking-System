const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Company = require('../models/Company');
const { AppError } = require('../middleware/errorMiddleware');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|avi|mov/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and videos are allowed.'));
    }
  }
});

// @desc    Send message with file attachment
// @route   POST /api/chat/send-file
// @access  Private
exports.sendFileMessage = async (req, res, next) => {
  try {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400));
      }

      const { bookingId, recipientId, text } = req.body;
      const file = req.file;

      if (!file) {
        return next(new AppError('No file uploaded', 400));
      }

      // Verify booking and authorization
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return next(new AppError('Booking not found', 404));
      }

      // Check if user is part of this booking
      const isParticipant = booking.customerId.toString() === req.user._id.toString() ||
        await Company.exists({
          _id: booking.companyId,
          $or: [
            { ownerId: req.user._id },
            { staffIds: req.user._id }
          ]
        });

      if (!isParticipant) {
        return next(new AppError('Not authorized to send messages in this booking', 403));
      }

      // Upload file to Cloudinary
      let uploadResult;
      try {
        uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: file.mimetype.startsWith('video/') ? 'video' : 'auto',
              folder: `chat-attachments/${bookingId}`,
              public_id: `${Date.now()}-${file.originalname}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });
      } catch (uploadError) {
        return next(new AppError('Failed to upload file', 500));
      }

      // Create message with file attachment
      const message = await Message.create({
        bookingId,
        senderId: req.user._id,
        recipientId,
        text: text || `Shared a file: ${file.originalname}`,
        messageType: file.mimetype.startsWith('image/') ? 'image' : 'file',
        attachments: [{
          type: uploadResult.secure_url,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        }]
      });

      // Populate and emit via Socket.io
      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'name avatar')
        .populate('recipientId', 'name avatar');

      // Emit to chat room
      const io = req.app.get('io');
      io.to(`chat-${bookingId}`).emit('new-message', populatedMessage);

      res.status(201).json({
        success: true,
        data: populatedMessage
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add session notes to booking
// @route   POST /api/session/notes
// @access  Private (company_owner, company_staff)
exports.addSessionNotes = async (req, res, next) => {
  try {
    const { bookingId, noteType, notes, attachments } = req.body;

    // Verify booking and authorization
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check if user is company staff
    const isCompanyStaff = await Company.exists({
      _id: booking.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!isCompanyStaff) {
      return next(new AppError('Not authorized to add session notes', 403));
    }

    // Create session note message
    const message = await Message.create({
      bookingId,
      senderId: req.user._id,
      recipientId: booking.customerId,
      text: notes,
      messageType: 'session_note',
      isSessionNote: true,
      noteType: noteType || 'summary',
      attachments: attachments || []
    });

    // Update booking with session notes
    if (noteType === 'summary') {
      booking.sessionNotes = notes;
      booking.sessionAttachments = attachments || [];
      await booking.save();
    }

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name avatar')
      .populate('recipientId', 'name avatar');

    // Emit to chat room
    const io = req.app.get('io');
    io.to(`chat-${bookingId}`).emit('new-message', populatedMessage);

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session history with notes
// @route   GET /api/session/history/:bookingId
// @access  Private
exports.getSessionHistory = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { page = 1, limit = 50, messageType, isSessionNote } = req.query;

    // Verify booking and authorization
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check if user is part of this booking
    const isParticipant = booking.customerId.toString() === req.user._id.toString() ||
      await Company.exists({
        _id: booking.companyId,
        $or: [
          { ownerId: req.user._id },
          { staffIds: req.user._id }
        ]
      });

    if (!isParticipant) {
      return next(new AppError('Not authorized to view this session history', 403));
    }

    // Build filter
    const filter = { bookingId, isDeleted: false };
    if (messageType) filter.messageType = messageType;
    if (isSessionNote !== undefined) filter.isSessionNote = isSessionNote === 'true';

    const messages = await Message.find(filter)
      .populate('senderId', 'name avatar')
      .populate('recipientId', 'name avatar')
      .populate('replyTo', 'text senderId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(filter);

    // Mark messages as read for recipient
    await Message.updateMany(
      {
        bookingId,
        recipientId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date(),
        status: 'read'
      }
    );

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        booking: {
          serviceTitle: booking.serviceTitle,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add reaction to message
// @route   POST /api/chat/reaction/:messageId
// @access  Private
exports.addReaction = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Check if user is part of this booking
    const booking = await Booking.findById(message.bookingId);
    const isParticipant = booking.customerId.toString() === req.user._id.toString() ||
      await Company.exists({
        _id: booking.companyId,
        $or: [
          { ownerId: req.user._id },
          { staffIds: req.user._id }
        ]
      });

    if (!isParticipant) {
      return next(new AppError('Not authorized to react to this message', 403));
    }

    await message.addReaction(req.user._id, emoji);

    const updatedMessage = await Message.findById(messageId)
      .populate('senderId', 'name avatar')
      .populate('reactions.userId', 'name avatar');

    // Emit reaction update
    const io = req.app.get('io');
    io.to(`chat-${message.bookingId}`).emit('message-reaction', updatedMessage);

    res.json({
      success: true,
      data: updatedMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit message
// @route   PATCH /api/chat/edit/:messageId
// @access  Private
exports.editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Check if user is the sender
    if (message.senderId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to edit this message', 403));
    }

    // Check if message is too old to edit (15 minutes)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes
    if (Date.now() - message.createdAt.getTime() > editTimeLimit) {
      return next(new AppError('Message can only be edited within 15 minutes of sending', 400));
    }

    message.originalText = message.text;
    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('senderId', 'name avatar')
      .populate('recipientId', 'name avatar');

    // Emit edit update
    const io = req.app.get('io');
    io.to(`chat-${message.bookingId}`).emit('message-edited', updatedMessage);

    res.json({
      success: true,
      data: updatedMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete message
// @route   DELETE /api/chat/:messageId
// @access  Private
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Check if user is the sender or company staff
    const isSender = message.senderId.toString() === req.user._id.toString();
    const booking = await Booking.findById(message.bookingId);
    const isCompanyStaff = await Company.exists({
      _id: booking.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!isSender && !isCompanyStaff) {
      return next(new AppError('Not authorized to delete this message', 403));
    }

    message.isDeleted = true;
    message.deletedAt = new Date();

    await message.save();

    // Emit deletion
    const io = req.app.get('io');
    io.to(`chat-${message.bookingId}`).emit('message-deleted', { messageId });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipientId: req.user._id,
      isRead: false,
      isDeleted: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PATCH /api/chat/mark-read/:bookingId
// @access  Private
exports.markMessagesAsRead = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    // Verify booking and authorization
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check if user is part of this booking
    const isParticipant = booking.customerId.toString() === req.user._id.toString() ||
      await Company.exists({
        _id: booking.companyId,
        $or: [
          { ownerId: req.user._id },
          { staffIds: req.user._id }
        ]
      });

    if (!isParticipant) {
      return next(new AppError('Not authorized to access this booking', 403));
    }

    await Message.updateMany(
      {
        bookingId,
        recipientId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date(),
        status: 'read'
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};
