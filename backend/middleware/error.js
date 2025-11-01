// backend/middleware/error.js

// Custom AppError class to handle operational errors
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  // Set default values if not provided
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥', {
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // Handle specific error types
  if (err.name === 'CastError') {
    // Handle MongoDB CastError (invalid ID format)
    const message = `Invalid ${err.path}: ${err.value}`;
    return sendErrorResponse(new AppError(message, 400), req, res);
  }

  if (err.code === 11000) {
    // Handle duplicate field error (MongoDB error 11000)
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    return sendErrorResponse(new AppError(message, 400), req, res);
  }

  if (err.name === 'ValidationError') {
    // Handle Mongoose validation errors
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return sendErrorResponse(new AppError(message, 400), req, res);
  }

  if (err.name === 'JsonWebTokenError') {
    // Handle JWT errors
    const message = 'Invalid token. Please log in again.';
    return sendErrorResponse(new AppError(message, 401), req, res);
  }

  if (err.name === 'TokenExpiredError') {
    // Handle expired JWT tokens
    const message = 'Your token has expired. Please log in again.';
    return sendErrorResponse(new AppError(message, 401), req, res);
  }

  // For all other errors, send the error response
  sendErrorResponse(err, req, res);
};

// Helper function to send error responses
const sendErrorResponse = (err, req, res) => {
  // API error response
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  }

  // Rendered website error page
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

// 404 Not Found handler
export const notFound = (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
};

// Catch async/await errors
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

// Default export for easier imports
export default {
  AppError,
  globalErrorHandler,
  notFound,
  catchAsync,
};
