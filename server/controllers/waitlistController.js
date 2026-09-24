const Waitlist = require('../models/Waitlist');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Join waitlist for a slot
// @route   POST /api/waitlist
// @access  Private (user)
exports.joinWaitlist = async (req, res, next) => {
  try {
    const {
      expertId, companyId, serviceId,
      preferredDate, preferredStartTime, flexibleDates, notes
    } = req.body;

    // Prevent duplicate waitlist entry for same slot
    const existing = await Waitlist.findOne({
      customerId: req.user._id,
      preferredDate: new Date(preferredDate),
      preferredStartTime,
      status: 'waiting',
      $or: [
        { expertId: expertId || null },
        { companyId: companyId || null }
      ]
    });

    if (existing) {
      return next(new AppError('You are already on the waitlist for this slot', 400));
    }

    // Get queue position
    const queueCount = await Waitlist.countDocuments({
      preferredDate: new Date(preferredDate),
      preferredStartTime,
      status: 'waiting',
      $or: [
        { expertId: expertId || null },
        { companyId: companyId || null }
      ]
    });

    const entry = await Waitlist.create({
      expertId,
      companyId,
      serviceId,
      customerId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      preferredDate: new Date(preferredDate),
      preferredStartTime,
      flexibleDates: flexibleDates?.map(d => new Date(d)) || [],
      position: queueCount + 1,
      notes
    });

    res.status(201).json({
      success: true,
      message: `You are #${entry.position} on the waitlist. We'll notify you if a slot opens.`,
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's waitlist entries
// @route   GET /api/waitlist/mine
// @access  Private
exports.getMyWaitlist = async (req, res, next) => {
  try {
    const entries = await Waitlist.find({
      customerId: req.user._id,
      status: { $in: ['waiting', 'notified'] }
    })
      .populate('serviceId', 'title duration price')
      .populate('companyId', 'name logo')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave waitlist
// @route   DELETE /api/waitlist/:id
// @access  Private
exports.leaveWaitlist = async (req, res, next) => {
  try {
    const entry = await Waitlist.findOne({
      _id: req.params.id,
      customerId: req.user._id
    });

    if (!entry) return next(new AppError('Waitlist entry not found', 404));
    if (!['waiting', 'notified'].includes(entry.status)) {
      return next(new AppError('Cannot leave waitlist at this stage', 400));
    }

    entry.status = 'declined';
    entry.declinedAt = new Date();
    await entry.save();

    // Re-number queue positions below this one
    await Waitlist.updateMany(
      {
        preferredDate: entry.preferredDate,
        preferredStartTime: entry.preferredStartTime,
        status: 'waiting',
        position: { $gt: entry.position }
      },
      { $inc: { position: -1 } }
    );

    res.json({ success: true, message: 'Removed from waitlist' });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept waitlist offer (when notified)
// @route   POST /api/waitlist/:id/accept
// @access  Private
exports.acceptWaitlistOffer = async (req, res, next) => {
  try {
    const entry = await Waitlist.findOne({
      _id: req.params.id,
      customerId: req.user._id,
      status: 'notified'
    });

    if (!entry) return next(new AppError('Waitlist offer not found or already expired', 404));

    // Check offer hasn't expired
    if (entry.notificationExpiry && entry.notificationExpiry < new Date()) {
      entry.status = 'expired';
      await entry.save();
      return next(new AppError('This offer has expired. The slot was offered to the next person.', 400));
    }

    entry.status = 'accepted';
    entry.acceptedAt = new Date();
    await entry.save();

    res.json({
      success: true,
      message: 'Slot accepted! Please complete your booking.',
      data: {
        entryId: entry._id,
        expertId: entry.expertId,
        companyId: entry.companyId,
        serviceId: entry.serviceId,
        date: entry.preferredDate,
        startTime: entry.preferredStartTime
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger waitlist notifications when a slot opens (called internally on booking cancel)
// @access  Internal
exports.triggerWaitlistForSlot = async ({ expertId, companyId, date, startTime, io }) => {
  try {
    const nextInLine = await Waitlist.findOne({
      preferredDate: new Date(date),
      preferredStartTime: startTime,
      status: 'waiting',
      $or: [
        { expertId: expertId || null },
        { companyId: companyId || null }
      ]
    }).sort({ position: 1 });

    if (!nextInLine) return; // No one waiting

    // Mark as notified with 2-hour expiry
    nextInLine.status = 'notified';
    nextInLine.notifiedAt = new Date();
    nextInLine.notificationExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await nextInLine.save();

    // Create in-app notification
    await Notification.create({
      userId: nextInLine.customerId,
      type: 'waitlist_slot_available',
      title: '🎉 A slot just opened up!',
      message: `Great news! A slot on ${new Date(date).toLocaleDateString()} at ${startTime} is now available for you. Accept within 2 hours!`,
      actionUrl: `/dashboard?waitlist=${nextInLine._id}`,
      priority: 'high'
    });

    // Emit real-time notification via Socket.io if available
    if (io) {
      io.to(`user-${nextInLine.customerId}`).emit('waitlist-slot-available', {
        waitlistId: nextInLine._id,
        date,
        startTime,
        expiresAt: nextInLine.notificationExpiry
      });
    }

    console.log(`✅ Waitlist: Notified ${nextInLine.customerName} about available slot`);
    return nextInLine;
  } catch (error) {
    console.error('Waitlist trigger error:', error);
  }
};

// @desc    Get waitlist for a specific slot (provider view)
// @route   GET /api/waitlist/slot
// @access  Private (company_owner, expert)
exports.getSlotWaitlist = async (req, res, next) => {
  try {
    const { date, startTime, expertId, companyId } = req.query;

    const filter = {
      preferredDate: new Date(date),
      preferredStartTime: startTime,
      status: { $in: ['waiting', 'notified'] }
    };
    if (expertId) filter.expertId = expertId;
    if (companyId) filter.companyId = companyId;

    const waitlist = await Waitlist.find(filter)
      .populate('customerId', 'name email phone avatar')
      .sort({ position: 1 });

    res.json({ success: true, data: waitlist, count: waitlist.length });
  } catch (error) {
    next(error);
  }
};
