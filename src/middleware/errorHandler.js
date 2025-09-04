const { ValidationError } = require('../utils/validators');
const { HTTP_STATUS, ERROR_TYPES, IS_DEVELOPMENT } = require('../config/constants');

/**
 * Custom error classes
 */
class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = HTTP_STATUS.NOT_FOUND;
  }
}

class DuplicateError extends Error {
  constructor(message = 'Resource already exists') {
    super(message);
    this.name = 'DuplicateError';
    this.statusCode = HTTP_STATUS.CONFLICT;
  }
}

class BusinessLogicError extends Error {
  constructor(message = 'Business logic violation') {
    super(message);
    this.name = 'BusinessLogicError';
    this.statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
  }
}

/**
 * Global error handler middleware
 * Converts all errors to user-friendly JSON responses
 */
function errorHandler(err, req, res, next) {
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong. Please try again.';
  let field = null;
  let details = null;

  // Log error for debugging (but not in production for sensitive data)
  if (IS_DEVELOPMENT) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
  }

  // Handle different error types
  if (err instanceof ValidationError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = err.message;
    field = err.field;
  } else if (err instanceof NotFoundError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof DuplicateError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof BusinessLogicError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    // JSON parsing error
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid data format. Please check your input.';
  } else if (err.code === 'ENOENT') {
    // File not found error
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    message = 'Data file not found. Please try again.';
  } else if (err.code === 'EACCES') {
    // Permission error
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    message = 'Permission denied. Please contact support.';
  } else {
    // Unknown error - log it but don't expose details to user
    console.error('Unexpected error:', err);
    
    if (IS_DEVELOPMENT) {
      message = err.message;
      details = err.stack;
    }
  }

  // Send error response
  const errorResponse = {
    success: false,
    error: {
      message,
      ...(field && { field }),
      ...(IS_DEVELOPMENT && details && { details }),
      ...(IS_DEVELOPMENT && { type: err.name }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unmatched routes
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
}

/**
 * Async wrapper to catch errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation middleware to check required fields
 */
function validateRequiredFields(requiredFields) {
  return (req, res, next) => {
    const missing = requiredFields.filter(field => {
      const value = req.body[field];
      return value === null || value === undefined || value === '';
    });

    if (missing.length > 0) {
      const error = new ValidationError(
        `Missing required fields: ${missing.join(', ')}`,
        missing[0]
      );
      return next(error);
    }

    next();
  };
}

/**
 * Success response helper
 */
function successResponse(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) {
  const response = {
    success: true,
    message,
    ...(data && { data }),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

/**
 * Created response helper
 */
function createdResponse(res, data, message = 'Created successfully') {
  successResponse(res, data, message, HTTP_STATUS.CREATED);
}

/**
 * No content response helper
 */
function noContentResponse(res) {
  res.status(HTTP_STATUS.NO_CONTENT).send();
}

module.exports = {
  // Error classes
  NotFoundError,
  DuplicateError,
  BusinessLogicError,
  
  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateRequiredFields,
  
  // Response helpers
  successResponse,
  createdResponse,
  noContentResponse,
};