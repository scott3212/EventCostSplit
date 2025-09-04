/**
 * Application constants and configuration
 */

module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Data storage
  DATA_DIR: process.env.DATA_DIR || './data',
  
  // File names for JSON storage
  DATA_FILES: {
    USERS: 'users.json',
    EVENTS: 'events.json',
    COST_ITEMS: 'cost_items.json',
    PAYMENTS: 'payments.json',
  },
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Validation limits
  LIMITS: {
    MAX_PARTICIPANTS_PER_EVENT: 50,
    MAX_EVENTS_PER_USER: 1000,
    MAX_COST_ITEMS_PER_EVENT: 100,
    MAX_PAYMENTS_PER_USER: 1000,
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 99999.99,
  },
  
  // Cache settings
  CACHE_DURATION_MS: 5000, // 5 seconds
  
  // User-friendly terms (for UI)
  UI_TERMS: {
    COST_ITEM: 'Expense',
    SPLIT_PERCENTAGE: 'Share',
    PARTICIPANT: 'Player',
    BALANCE: 'What you owe',
    SETTLEMENT: 'Payment',
    VALIDATION_ERROR: 'Please check',
  },
  
  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },
  
  // Error types
  ERROR_TYPES: {
    VALIDATION_ERROR: 'ValidationError',
    NOT_FOUND_ERROR: 'NotFoundError',
    DUPLICATE_ERROR: 'DuplicateError',
    BUSINESS_LOGIC_ERROR: 'BusinessLogicError',
  },
  
  // Date formats
  DATE_FORMATS: {
    ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
    DISPLAY: 'MMM DD, YYYY',
    SHORT: 'MM/DD/YYYY',
  },
  
  // Development settings
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
};