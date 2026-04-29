const jwt = require('jsonwebtoken');
const User = require('../model/User');
const { AppError } = require('./errorHandler');

// Protect routes — validates JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+isEmailVerified +role');

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Optional protect — sets req.user if token present, but doesn't fail if missing
const optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
    next();
  } catch {
    next();
  }
};

// Authorize by roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role [${req.user.role}] is not authorized to access this resource.`, 403)
      );
    }
    next();
  };
};

// Check resource ownership (admin can bypass)
const checkOwnership = (Model) => async (req, res, next) => {
  try {
    const resource = await Model.findById(req.params.id);
    if (!resource) return next(new AppError('Resource not found', 404));

    const ownerId = (resource.createdBy || resource.owner)?.toString();
    if (req.user.role !== 'admin' && ownerId !== req.user._id.toString()) {
      return next(new AppError('You are not authorized to modify this resource', 403));
    }

    req.resource = resource;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect, optionalProtect, authorize, checkOwnership };
