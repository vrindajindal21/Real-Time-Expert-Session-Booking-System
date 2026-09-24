const { AppError } = require('../middleware/errorMiddleware');
const Booking = require('../models/Booking');
const Company = require('../models/Company');

// Google Meet Integration
const createGoogleMeetLink = async (bookingDetails) => {
  try {
    const { title, startTime, endTime, attendees } = bookingDetails;
    
    // In a real implementation, you would use Google Calendar API
    // For demo purposes, we'll generate a Google Meet link
    const meetLink = `https://meet.google.com/${generateRandomString(10)}`;
    
    return {
      platform: 'Google Meet',
      meetingLink: meetLink,
      meetingId: meetLink.split('/').pop(),
      password: null // Google Meet doesn't use passwords
    };
  } catch (error) {
    throw new AppError('Failed to create Google Meet link', 500);
  }
};

// Zoom Integration
const createZoomMeeting = async (bookingDetails) => {
  try {
    const { title, startTime, duration, attendees } = bookingDetails;
    
    // In a real implementation, you would use Zoom API
    // For demo purposes, we'll simulate Zoom meeting creation
    const meetingId = generateRandomString(11);
    const password = generateRandomString(6, '0123456789');
    
    return {
      platform: 'Zoom',
      meetingLink: `https://zoom.us/j/${meetingId}`,
      meetingId,
      password
    };
  } catch (error) {
    throw new AppError('Failed to create Zoom meeting', 500);
  }
};

// Helper function to generate random strings
const generateRandomString = (length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

// @desc    Create meeting link for booking
// @route   POST /api/meetings/create
// @access  Private (company_owner, company_staff)
exports.createMeetingLink = async (req, res, next) => {
  try {
    const { bookingId, platform } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('companyId')
      .populate('serviceId');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check authorization
    const isAuthorized = await Company.exists({
      _id: booking.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!isAuthorized) {
      return next(new AppError('Not authorized to create meeting for this booking', 403));
    }

    // Prepare meeting details
    const meetingDetails = {
      title: booking.serviceTitle,
      startTime: new Date(`${booking.date}T${booking.startTime}`),
      endTime: new Date(`${booking.date}T${booking.endTime}`),
      duration: booking.serviceId?.duration || 60,
      attendees: [
        {
          email: booking.customerEmail,
          name: booking.customerName
        }
      ]
    };

    let meetingInfo;
    
    if (platform === 'zoom') {
      meetingInfo = await createZoomMeeting(meetingDetails);
    } else {
      meetingInfo = await createGoogleMeetLink(meetingDetails);
    }

    // Update booking with meeting details
    booking.meetingLink = meetingInfo.meetingLink;
    booking.meetingId = meetingInfo.meetingId;
    booking.meetingPassword = meetingInfo.password;
    booking.meetingPlatform = meetingInfo.platform;
    await booking.save();

    res.json({
      success: true,
      message: `${meetingInfo.platform} meeting created successfully`,
      data: {
        bookingId: booking._id,
        meetingInfo
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update meeting link
// @route   PATCH /api/meetings/:bookingId
// @access  Private (company_owner, company_staff)
exports.updateMeetingLink = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { meetingLink, meetingId, meetingPassword, platform } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check authorization
    const isAuthorized = await Company.exists({
      _id: booking.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!isAuthorized) {
      return next(new AppError('Not authorized to update meeting for this booking', 403));
    }

    // Update meeting details
    if (meetingLink) booking.meetingLink = meetingLink;
    if (meetingId) booking.meetingId = meetingId;
    if (meetingPassword !== undefined) booking.meetingPassword = meetingPassword;
    if (platform) booking.meetingPlatform = platform;

    await booking.save();

    res.json({
      success: true,
      message: 'Meeting details updated successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get meeting details
// @route   GET /api/meetings/:bookingId
// @access  Private
exports.getMeetingDetails = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email')
      .populate('companyId', 'name')
      .populate('serviceId', 'title');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check authorization (customer or company staff)
    const isCustomer = booking.customerId._id.toString() === req.user._id.toString();
    const isCompanyStaff = await Company.exists({
      _id: booking.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!isCustomer && !isCompanyStaff) {
      return next(new AppError('Not authorized to view meeting details', 403));
    }

    const meetingDetails = {
      bookingId: booking._id,
      serviceTitle: booking.serviceTitle,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      meetingLink: booking.meetingLink,
      meetingId: booking.meetingId,
      meetingPassword: booking.meetingPassword,
      meetingPlatform: booking.meetingPlatform,
      customer: {
        name: booking.customerName,
        email: booking.customerEmail
      },
      company: booking.companyId?.name,
      status: booking.status
    };

    res.json({
      success: true,
      data: meetingDetails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete meeting link
// @route   DELETE /api/meetings/:bookingId
// @access  Private (company_owner, company_staff)
exports.deleteMeetingLink = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check authorization
    const isAuthorized = await Company.exists({
      _id: booking.companyId,
      $or: [
        { ownerId: req.user._id },
        { staffIds: req.user._id }
      ]
    });

    if (!isAuthorized) {
      return next(new AppError('Not authorized to delete meeting for this booking', 403));
    }

    // Clear meeting details
    booking.meetingLink = null;
    booking.meetingId = null;
    booking.meetingPassword = null;
    booking.meetingPlatform = null;
    await booking.save();

    res.json({
      success: true,
      message: 'Meeting link deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get supported meeting platforms
// @route   GET /api/meetings/platforms
// @access  Public
exports.getSupportedPlatforms = async (req, res, next) => {
  try {
    const platforms = [
      {
        name: 'Google Meet',
        code: 'google_meet',
        description: 'Google\'s video conferencing service',
        features: ['No password required', 'Browser-based', 'Calendar integration'],
        maxParticipants: 100,
        timeLimit: '24 hours'
      },
      {
        name: 'Zoom',
        code: 'zoom',
        description: 'Popular video conferencing platform',
        features: ['Password protection', 'Breakout rooms', 'Recording'],
        maxParticipants: 100,
        timeLimit: '40 minutes (free tier)'
      }
    ];

    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-create meeting links for confirmed bookings
// @route   POST /api/meetings/auto-create
// @access  Private (internal use)
exports.autoCreateMeeting = async (booking, platform = 'google_meet') => {
  try {
    if (!booking || booking.status !== 'Confirmed' || booking.meetingLink) {
      return null;
    }

    const meetingDetails = {
      title: booking.serviceTitle,
      startTime: new Date(`${booking.date}T${booking.startTime}`),
      endTime: new Date(`${booking.date}T${booking.endTime}`),
      attendees: [
        {
          email: booking.customerEmail,
          name: booking.customerName
        }
      ]
    };

    let meetingInfo;
    
    if (platform === 'zoom') {
      meetingInfo = await createZoomMeeting(meetingDetails);
    } else {
      meetingInfo = await createGoogleMeetLink(meetingDetails);
    }

    // Update booking
    booking.meetingLink = meetingInfo.meetingLink;
    booking.meetingId = meetingInfo.meetingId;
    booking.meetingPassword = meetingInfo.password;
    booking.meetingPlatform = meetingInfo.platform;
    await booking.save();

    return meetingInfo;
  } catch (error) {
    console.error('Auto-create meeting failed:', error);
    return null;
  }
};
