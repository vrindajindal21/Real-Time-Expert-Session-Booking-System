const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 handler — attach to end of routes
const notFound = (req, res, next) => {
  const error = new AppError(`Not Found — ${req.originalUrl}`, 404);
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  const isProduction = process.env.NODE_ENV === 'production';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = isProduction ? 'Invalid resource identifier format.' : `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    message = isProduction ? 'A duplicate record already exists.' : `Duplicate value for field: ${field}`;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  // Generic internal server or database errors in production
  if (statusCode === 500 && isProduction) {
    message = 'An unexpected database or server error occurred.';
  }

  // Log error using structured logger
  if (statusCode >= 500 || !err.isOperational) {
    logger.error(`💥 Unexpected Error: ${err.message || message}`, err);
  } else {
    logger.warn(`Operational Warning: ${err.message || message}`, err);
  }

  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { AppError, notFound, errorHandler };
