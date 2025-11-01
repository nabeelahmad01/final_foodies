// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new Error('Not authorized, please login'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return next(new Error('User not found'));
    }

    if (!req.user.isActive) {
      return next(new Error('Account is deactivated'));
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return next(new Error('Not authorized, token failed'));
  }
};

// Authorize based on roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.role)) {
        throw new Error(`Role '${req.user.role}' is not authorized to access this route`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Generate JWT token
export const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
