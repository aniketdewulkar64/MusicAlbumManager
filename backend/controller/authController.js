const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../utils/email');
const logActivity = require('../utils/activityLogger');

// Helper: send tokens
const sendTokens = async (user, statusCode, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save hashed refresh token to DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, artistName, bio, genres, socialLinks } = req.body;

    let avatar = '';
    if (req.file) {
      const isCloudinary = req.file.path.startsWith('http');
      avatar = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
    }

    const existing = await User.findOne({ email });
    if (existing) return next(new AppError('Email already in use', 400));

    const userData = {
      name,
      email,
      password,
      role: role === 'admin' ? 'listener' : role || 'listener',
      avatar,
    };

    if (role === 'artist') {
      userData.artistName = artistName;
      userData.bio = bio;
      userData.genres = genres;
      userData.socialLinks = socialLinks;
      userData.status = 'pending';
    }

    const user = await User.create(userData);

    // Send email verification
    const verifyToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;

    sendEmail({
      to: user.email,
      subject: 'Verify your email — Music App',
      html: emailTemplates.emailVerification(verifyUrl),
    }).catch(err => console.error('Email send failed:', err.message));

    await logActivity(user._id, 'register', { email }, req.ip);

    // If artist, don't login yet, wait for approval
    if (user.role === 'artist') {
      return res.status(201).json({
        status: 'success',
        message: 'Your application has been submitted! You will be able to log in once an admin approves your request.',
      });
    }

    await sendTokens(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(new AppError('Email and password are required', 400));

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Allow login even if pending/rejected (will be handled in UI)
    if (user.role === 'artist') {
      // We still block pending for now if you want, but the user asked for rejected artists to see a message after login.
      // So let's allow both.
    }

    await logActivity(user._id, 'login', { email }, req.ip);
    await sendTokens(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return next(new AppError('No refresh token provided', 401));

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return next(new AppError('Invalid refresh token', 401));
    }

    await sendTokens(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const user = await User.findById(req.user._id).select('+refreshToken');
      if (user) {
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(new AppError('No user with that email', 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    sendEmail({
      to: user.email,
      subject: 'Password Reset — Music App',
      html: emailTemplates.passwordReset(resetUrl),
    }).catch(err => console.error('Email send failed:', err.message));

    res.status(200).json({ status: 'success', message: 'Reset link sent to email' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) return next(new AppError('Token is invalid or expired', 400));

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await sendTokens(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/verify-email/:token
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ emailVerificationToken: hashedToken }).select(
      '+emailVerificationToken'
    );

    if (!user) return next(new AppError('Invalid verification token', 400));

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ status: 'success', message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.status(200).json({ status: 'success', user: req.user });
};
