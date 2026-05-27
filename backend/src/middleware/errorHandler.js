// Global error handler middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Oracle DB errors
  if (err.errorNum) {
    return res.status(500).json({
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request',
      code: err.errorNum
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Your session is invalid. Please log in again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Your session has expired. Please log in again.'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
      details: err.details
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.error || 'Error',
      message: err.message
    });
  }

  // Default server error
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred'
  });
}

// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500, error = 'Error') {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found error
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'Not Found');
  }
}

// Validation error
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'Validation Error');
    this.details = details;
  }
}

// Unauthorized error
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'Unauthorized');
  }
}

// Forbidden error
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'Forbidden');
  }
}

module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.NotFoundError = NotFoundError;
module.exports.ValidationError = ValidationError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
