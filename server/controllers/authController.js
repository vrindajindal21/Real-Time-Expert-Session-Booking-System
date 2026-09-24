const User = require('../models/User');
const Expert = require('../models/Expert');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');
const { AppError } = require('../middleware/errorMiddleware');
const { isProfessionalEmail } = require('../utils/emailValidator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  let { name, email, password, role, category, companyName } = req.body;
  email = email.toLowerCase();

  try {
    // Block disposable email domains
    if (!isProfessionalEmail(email)) {
      return next(new AppError('Disposable or temporary email addresses are not allowed. Please use a professional or standard email provider.', 400));
    }

    const userExists = await User.findOne({ email });
    if (userExists) return next(new AppError('User already exists with this email', 400));

    const user = await User.create({ name, email, password, role: role || 'user' });

    // If expert, auto-create their expert profile
    if (user.role === 'expert') {
      try {
        await Expert.create({
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: '0000000000',
          experience: 0,
          rating: 0,
          category: category || 'Other',
          companyName: companyName || '',
          providerType: companyName ? 'Company' : 'Individual',
          bio: `Welcome to our professional network. We are dedicated to providing excellent services in ${category || 'your field'}.`,
          isApproved: true,
          isActive: true,
          services: [
            { title: 'Introductory Session', price: 0, duration: 30, description: 'Initial consultation', type: 'Session' }
          ],
          timeSlots: []
        });
      } catch (expertErr) {
        console.error('Expert Profile Creation Failed:', expertErr);
        throw expertErr;
      }
    }

    // Send welcome email — non-blocking
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('REGISTRATION ERROR:', error);
    next(error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  let { email, password } = req.body;
  if (email) email = email.toLowerCase();

  try {
    if (!email || !password) return next(new AppError('Please provide email and password', 400));

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError('Please enter a valid email address', 400));
    }

    // Check password length
    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('No account found with this email address. Please register first.', 404));
    }

    if (await user.comparePassword(password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id)
      });
    } else {
      return next(new AppError('Incorrect password. Please try again.', 401));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return next(new AppError('User not found', 404));
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (name, avatar)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 401));
    }

    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters', 400));
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password — send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('Please provide your email address', 400));

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists — security best practice
      return res.json({ message: 'If this email is registered, a reset link has been sent.' });
    }

    // Generate a secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token + 10 min expiry to user
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send email with RAW token (user gets the plain token, we store hashed)
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailErr) {
      // Roll back — clear token so user can try again
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Password reset email failed:', emailErr.message);
      return next(new AppError('Failed to send reset email. Please check your email address and try again.', 500));
    }

    res.json({ message: 'If this email is registered, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return next(new AppError('Password must be at least 6 characters', 400));
    }

    // Hash the incoming token and compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return next(new AppError('Token is invalid or has expired', 400));

    // Update password and clear reset fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      message: 'Password reset successfully',
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user and blacklist token
// @route   POST /api/auth/logout
// @access  Private
exports.logoutUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const token = authHeader.split(' ')[1];
      const cache = require('../utils/cache');
      
      // Decode token to find expiration date
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        // Calculate remaining seconds to live
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          // Blacklist the token for the duration of its remaining lifetime
          await cache.set(`jwt:blacklist:${token}`, 'revoked', ttl);
        }
      }
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
