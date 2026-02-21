/**
 * Global Error Handling Middleware
 * Provides consistent error responses and logging across the application
 */

class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Custom error handler middleware
 * Handles all errors thrown in the application
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error details
  const errorLog = {
    timestamp: new Date().toISOString(),
    status: err.statusCode,
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    ...(req.user && { userId: req.user.userId }),
  };

  // Log to console (in development, send to logging service in production)
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', errorLog);
    if (err.stack) {
      console.error('Stack Trace:', err.stack);
    }
  } else {
    // In production, log to external service (e.g., Sentry, LogRocket)
    console.error('[ERROR LOG]', JSON.stringify(errorLog));
  }

  // Handle specific error types
  let statusCode = err.statusCode;
  let message = err.message;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
    message = `Validation Error: ${messages}`;
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.kind}: ${err.value}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    ...(err.errors && { errors: err.errors }),
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { path: req.path }),
    ...(process.env.NODE_ENV === 'development' && err.stack && { stack: err.stack }),
  });
};

/**
 * Async error wrapper to catch errors in async route handlers
 * Usage: router.get('/', asyncHandler(controllerMethod))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
};
