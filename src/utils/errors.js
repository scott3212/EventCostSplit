/**
 * Custom error classes for the application
 */

class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class BusinessLogicError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

class FileSystemError extends Error {
  constructor(message, operation = null) {
    super(message);
    this.name = 'FileSystemError';
    this.operation = operation;
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  BusinessLogicError,
  FileSystemError
};