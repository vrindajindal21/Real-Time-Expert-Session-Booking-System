const ClientNote = require('../models/ClientNote');
const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Create a client note
// @route   POST /api/client-notes
// @access  Private (company_owner, company_staff, expert)
exports.createNote = async (req, res, next) => {
  try {
    const { clientId, bookingId, noteType, title, content, tags, isPrivate, isAlert, isPinned } = req.body;

    // If bookingId given, verify provider has access to that booking
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) return next(new AppError('Booking not found', 404));
      const isProvider =
        booking.assignedStaffId?.toString() === req.user._id.toString() ||
        (await require('../models/Company').exists({
          _id: booking.companyId,
          $or: [{ ownerId: req.user._id }, { staffIds: req.user._id }]
        }));
      if (!isProvider) return next(new AppError('Not authorized', 403));
    }

    const note = await ClientNote.create({
      authorId: req.user._id,
      companyId: req.user.companyId,
      clientId,
      bookingId,
      noteType: noteType || 'general',
      title,
      content,
      tags: tags || [],
      isPrivate: isPrivate || false,
      isAlert: isAlert || false,
      isPinned: isPinned || false
    });

    const populated = await ClientNote.findById(note._id)
      .populate('authorId', 'name avatar role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all notes for a client (provider view)
// @route   GET /api/client-notes/client/:clientId
// @access  Private (company_owner, company_staff)
exports.getClientNotes = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { noteType, page = 1, limit = 20 } = req.query;

    const filter = {
      clientId,
      isDeleted: false,
      companyId: req.user.companyId,
      // Exclude private notes by others
      $or: [
        { isPrivate: false },
        { isPrivate: true, authorId: req.user._id }
      ]
    };

    if (noteType) filter.noteType = noteType;

    const notes = await ClientNote.find(filter)
      .populate('authorId', 'name avatar role')
      .populate('bookingId', 'serviceTitle date startTime')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ClientNote.countDocuments(filter);
    const alerts = notes.filter(n => n.isAlert);

    res.json({
      success: true,
      data: { notes, alerts, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notes for a specific booking
// @route   GET /api/client-notes/booking/:bookingId
// @access  Private
exports.getBookingNotes = async (req, res, next) => {
  try {
    const notes = await ClientNote.find({
      bookingId: req.params.bookingId,
      isDeleted: false,
      $or: [
        { isPrivate: false },
        { isPrivate: true, authorId: req.user._id }
      ]
    })
      .populate('authorId', 'name avatar role')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a note
// @route   PATCH /api/client-notes/:id
// @access  Private (author only)
exports.updateNote = async (req, res, next) => {
  try {
    const note = await ClientNote.findOne({ _id: req.params.id, authorId: req.user._id, isDeleted: false });
    if (!note) return next(new AppError('Note not found or not authorized', 404));

    const allowed = ['title', 'content', 'tags', 'noteType', 'isAlert', 'isPinned'];
    allowed.forEach(field => { if (req.body[field] !== undefined) note[field] = req.body[field]; });
    await note.save();

    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a note (soft)
// @route   DELETE /api/client-notes/:id
// @access  Private (author only)
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await ClientNote.findOneAndUpdate(
      { _id: req.params.id, authorId: req.user._id },
      { isDeleted: true },
      { new: true }
    );
    if (!note) return next(new AppError('Note not found', 404));
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};
