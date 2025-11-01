// backend/utils/AppError.js

/**
 * Custom AppError class to handle operational errors
 */
class AppError extends Error {
  /**
   * Create a new AppError instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} status - Status type ('fail' or 'error')
   * @param {boolean} isOperational - Indicates if the error is operational
   */
  constructor(message, statusCode, status = undefined, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.status = status || (`${statusCode}`.startsWith('4') ? 'fail' : 'error');
    this.isOperational = isOperational;

    // Capture the stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
