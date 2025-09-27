/**
 * Validation utilities with user-friendly error messages
 * Follows UX principle of clear, helpful feedback
 */

class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

const validators = {
  /**
   * Validate required field is present and not empty
   */
  required(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(
        `${fieldName} is required`,
        fieldName.toLowerCase()
      );
    }
    return value;
  },

  /**
   * Validate string meets minimum length
   */
  minLength(value, min, fieldName) {
    if (typeof value !== 'string' || value.length < min) {
      throw new ValidationError(
        `${fieldName} must be at least ${min} characters long`,
        fieldName.toLowerCase()
      );
    }
    return value;
  },

  /**
   * Validate string doesn't exceed maximum length
   */
  maxLength(value, max, fieldName) {
    if (typeof value !== 'string' || value.length > max) {
      throw new ValidationError(
        `${fieldName} must be no more than ${max} characters long`,
        fieldName.toLowerCase()
      );
    }
    return value;
  },

  /**
   * Validate email format (optional field)
   */
  email(value, fieldName) {
    if (!value) return value; // Optional field
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(
        'Please enter a valid email address',
        fieldName.toLowerCase()
      );
    }
    return value;
  },

  /**
   * Validate phone number format (optional field)
   */
  phone(value, fieldName) {
    if (!value) return value; // Optional field
    
    // Allow various phone formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(value)) {
      throw new ValidationError(
        'Please enter a valid phone number',
        fieldName.toLowerCase()
      );
    }
    return value;
  },

  /**
   * Validate positive number (for amounts)
   */
  positiveNumber(value, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      throw new ValidationError(
        `${fieldName} must be a positive number`,
        fieldName.toLowerCase()
      );
    }
    return num;
  },

  /**
   * Validate non-zero number (for payments - allows negative for refunds)
   */
  nonZeroNumber(value, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) {
      throw new ValidationError(
        `${fieldName} must be a non-zero number`,
        fieldName.toLowerCase()
      );
    }
    return num;
  },

  /**
   * Validate non-negative number
   */
  nonNegativeNumber(value, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new ValidationError(
        `${fieldName} cannot be negative`,
        fieldName.toLowerCase()
      );
    }
    return num;
  },

  /**
   * Validate UUID format
   */
  uuid(value, fieldName) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ValidationError(
        `${fieldName} must be a valid ID`,
        fieldName.toLowerCase()
      );
    }
    return value;
  },

  /**
   * Validate date format (ISO string or Date object)
   */
  date(value, fieldName) {
    let date;
    
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      // Check if it's a date-only string (YYYY-MM-DD format)
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateOnlyRegex.test(value)) {
        // For date-only strings, create date in local timezone to avoid timezone shift
        const [year, month, day] = value.split('-').map(Number);
        date = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        date = new Date(value);
      }
    } else {
      throw new ValidationError(
        `${fieldName} must be a valid date`,
        fieldName.toLowerCase()
      );
    }

    if (isNaN(date.getTime())) {
      throw new ValidationError(
        `${fieldName} must be a valid date`,
        fieldName.toLowerCase()
      );
    }

    // For date-only values, return ISO date string format (YYYY-MM-DD)
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value; // Return original date string to avoid timezone conversion
    }
    
    return date.toISOString();
  },

  /**
   * Validate array contains valid UUIDs
   */
  uuidArray(value, fieldName) {
    if (!Array.isArray(value)) {
      throw new ValidationError(
        `${fieldName} must be a list`,
        fieldName.toLowerCase()
      );
    }

    value.forEach((item, index) => {
      try {
        this.uuid(item, `${fieldName}[${index}]`);
      } catch (error) {
        throw new ValidationError(
          `${fieldName} contains invalid ID at position ${index + 1}`,
          fieldName.toLowerCase()
        );
      }
    });

    return value;
  },

  /**
   * Validate split percentages sum to 100
   */
  splitPercentages(splitPercentage, fieldName = 'Split percentages') {
    if (!splitPercentage || typeof splitPercentage !== 'object') {
      throw new ValidationError(
        'Split configuration is required',
        'splitPercentage'
      );
    }

    const percentages = Object.values(splitPercentage);
    
    // Check all percentages are valid numbers
    percentages.forEach((percentage, index) => {
      const num = parseFloat(percentage);
      if (isNaN(num) || num < 0 || num > 100) {
        throw new ValidationError(
          'Each person\'s share must be between 0% and 100%',
          'splitPercentage'
        );
      }
    });

    // Check percentages sum to 100
    const total = percentages.reduce((sum, p) => sum + parseFloat(p), 0);
    const tolerance = 0.01; // Allow for small rounding errors
    
    if (Math.abs(total - 100) > tolerance) {
      throw new ValidationError(
        `Total shares must equal 100%. Currently: ${total.toFixed(2)}%`,
        'splitPercentage'
      );
    }

    return splitPercentage;
  },

  /**
   * Validate split shares are positive integers
   */
  splitShares(splitShares, fieldName = 'Split shares') {
    if (!splitShares || typeof splitShares !== 'object' || Array.isArray(splitShares)) {
      throw new ValidationError(
        'Split shares configuration is required',
        'splitShares'
      );
    }

    const shares = Object.values(splitShares);

    // Check all shares are valid numbers
    shares.forEach((shareCount, index) => {
      const num = parseInt(shareCount);
      if (isNaN(num) || num < 0 || num !== parseFloat(shareCount)) {
        throw new ValidationError(
          'Each person\'s share count must be a non-negative whole number',
          'splitShares'
        );
      }
    });

    // Check at least one participant has shares
    const totalShares = shares.reduce((sum, s) => sum + parseInt(s), 0);
    if (totalShares === 0) {
      throw new ValidationError(
        'At least one person must have a share greater than 0',
        'splitShares'
      );
    }

    return splitShares;
  },

  /**
   * Validate object has required fields
   */
  hasFields(obj, requiredFields) {
    const missing = requiredFields.filter(field => 
      obj[field] === null || obj[field] === undefined || obj[field] === ''
    );
    
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missing.join(', ')}`,
        missing[0]
      );
    }
    
    return obj;
  },

  /**
   * Sanitize string input (trim whitespace, prevent XSS)
   */
  sanitizeString(value) {
    if (typeof value !== 'string') return value;
    
    return value
      .trim()
      .replace(/[<>]/g, ''); // Basic XSS prevention
  },

  /**
   * Validate and format currency amount
   */
  currency(value, fieldName) {
    const num = this.positiveNumber(value, fieldName);
    
    // Round to 2 decimal places for currency
    return Math.round(num * 100) / 100;
  }
};

/**
 * Validate user creation data
 */
function validateUserData(userData) {
  const errors = [];
  
  try {
    if (!userData || typeof userData !== 'object') {
      return { isValid: false, errors: ['User data is required'] };
    }

    // Sanitize inputs
    if (userData.name) userData.name = validators.sanitizeString(userData.name);
    if (userData.email) userData.email = validators.sanitizeString(userData.email);
    if (userData.phone) userData.phone = validators.sanitizeString(userData.phone);

    // Required fields
    validators.required(userData.name, 'Name');
    validators.minLength(userData.name, 1, 'Name');
    validators.maxLength(userData.name, 100, 'Name');

    // Optional fields with validation
    if (userData.email) {
      validators.email(userData.email, 'Email');
      validators.maxLength(userData.email, 255, 'Email');
    }

    if (userData.phone) {
      validators.phone(userData.phone, 'Phone');
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error.message);
    } else {
      errors.push('Invalid user data');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate user update data (all fields optional)
 */
function validateUserUpdate(updateData) {
  const errors = [];
  
  try {
    if (!updateData || typeof updateData !== 'object') {
      return { isValid: false, errors: ['Update data is required'] };
    }

    // Sanitize inputs if present
    if (updateData.name !== undefined) {
      updateData.name = validators.sanitizeString(updateData.name);
    }
    if (updateData.email !== undefined && updateData.email !== null) {
      updateData.email = validators.sanitizeString(updateData.email);
    }
    if (updateData.phone !== undefined && updateData.phone !== null) {
      updateData.phone = validators.sanitizeString(updateData.phone);
    }

    // Validate provided fields
    if (updateData.name !== undefined) {
      validators.required(updateData.name, 'Name');
      validators.minLength(updateData.name, 1, 'Name');
      validators.maxLength(updateData.name, 100, 'Name');
    }

    if (updateData.email !== undefined && updateData.email !== null && updateData.email !== '') {
      validators.email(updateData.email, 'Email');
      validators.maxLength(updateData.email, 255, 'Email');
    }

    if (updateData.phone !== undefined && updateData.phone !== null && updateData.phone !== '') {
      validators.phone(updateData.phone, 'Phone');
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error.message);
    } else {
      errors.push('Invalid update data');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate event creation data
 */
function validateEventData(eventData) {
  const errors = [];
  
  try {
    if (!eventData || typeof eventData !== 'object') {
      return { isValid: false, errors: ['Event data is required'] };
    }

    // Sanitize inputs
    if (eventData.name) eventData.name = validators.sanitizeString(eventData.name);
    if (eventData.description) eventData.description = validators.sanitizeString(eventData.description);

    // Required fields
    validators.required(eventData.name, 'Event name');
    validators.minLength(eventData.name, 1, 'Event name');
    validators.maxLength(eventData.name, 100, 'Event name');

    validators.required(eventData.date, 'Event date');
    validators.date(eventData.date, 'Event date');

    // Optional fields with validation
    if (eventData.description && eventData.description.length > 500) {
      validators.maxLength(eventData.description, 500, 'Description');
    }

    // Validate participants if provided
    if (eventData.participants) {
      if (!Array.isArray(eventData.participants)) {
        throw new ValidationError('Participants must be a list');
      }
      validators.uuidArray(eventData.participants, 'Participants');
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error.message);
    } else {
      errors.push('Invalid event data');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate event update data (all fields optional)
 */
function validateEventUpdate(updateData) {
  const errors = [];
  
  try {
    if (!updateData || typeof updateData !== 'object') {
      return { isValid: false, errors: ['Update data is required'] };
    }

    // Sanitize inputs if present
    if (updateData.name !== undefined) {
      updateData.name = validators.sanitizeString(updateData.name);
    }
    if (updateData.description !== undefined) {
      updateData.description = validators.sanitizeString(updateData.description);
    }

    // Validate provided fields
    if (updateData.name !== undefined) {
      validators.required(updateData.name, 'Event name');
      validators.minLength(updateData.name, 1, 'Event name');
      validators.maxLength(updateData.name, 100, 'Event name');
    }

    if (updateData.date !== undefined) {
      validators.date(updateData.date, 'Event date');
    }

    if (updateData.description !== undefined && updateData.description !== '') {
      validators.maxLength(updateData.description, 500, 'Description');
    }

    if (updateData.participants !== undefined) {
      if (!Array.isArray(updateData.participants)) {
        throw new ValidationError('Participants must be a list');
      }
      validators.uuidArray(updateData.participants, 'Participants');
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error.message);
    } else {
      errors.push('Invalid update data');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate cost item creation data
 */
function validateCostItemData(costItemData) {
  const errors = [];
  
  try {
    if (!costItemData || typeof costItemData !== 'object') {
      return { isValid: false, errors: ['Cost item data is required'] };
    }

    // Sanitize inputs
    if (costItemData.description) costItemData.description = validators.sanitizeString(costItemData.description);

    // Required fields
    validators.required(costItemData.description, 'Description');
    validators.minLength(costItemData.description, 1, 'Description');
    validators.maxLength(costItemData.description, 255, 'Description');

    validators.required(costItemData.amount, 'Amount');
    validators.positiveNumber(costItemData.amount, 'Amount');

    validators.required(costItemData.paidBy, 'Paid by user');
    validators.uuid(costItemData.paidBy, 'Paid by user');

    validators.required(costItemData.eventId, 'Event ID');
    validators.uuid(costItemData.eventId, 'Event ID');

    validators.required(costItemData.date, 'Date');
    validators.date(costItemData.date, 'Date');

    // Validate split configuration - either shares or percentages required
    if (!costItemData.splitShares && !costItemData.splitPercentage) {
      throw new ValidationError('Either split shares or split percentages are required');
    }

    // Validate split shares if provided
    if (costItemData.splitShares) {
      validators.splitShares(costItemData.splitShares, 'Split shares');
    }

    // Validate split percentages if provided
    if (costItemData.splitPercentage) {
      validators.splitPercentages(costItemData.splitPercentage, 'Split percentages');
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error.message);
    } else {
      errors.push('Invalid cost item data');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate cost item update data (all fields optional)
 */
function validateCostItemUpdate(updateData) {
  const errors = [];
  
  try {
    if (!updateData || typeof updateData !== 'object') {
      return { isValid: false, errors: ['Update data is required'] };
    }

    // Sanitize inputs if present
    if (updateData.description !== undefined) {
      updateData.description = validators.sanitizeString(updateData.description);
    }

    // Validate provided fields
    if (updateData.description !== undefined) {
      validators.required(updateData.description, 'Description');
      validators.minLength(updateData.description, 1, 'Description');
      validators.maxLength(updateData.description, 255, 'Description');
    }

    if (updateData.amount !== undefined) {
      validators.positiveNumber(updateData.amount, 'Amount');
    }

    if (updateData.paidBy !== undefined) {
      validators.uuid(updateData.paidBy, 'Paid by user');
    }

    if (updateData.date !== undefined) {
      validators.date(updateData.date, 'Date');
    }

    if (updateData.splitPercentage !== undefined) {
      validators.splitPercentages(updateData.splitPercentage, 'Split percentages');
    }

    if (updateData.splitShares !== undefined) {
      validators.splitShares(updateData.splitShares, 'Split shares');
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error.message);
    } else {
      errors.push('Invalid update data');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate payment creation data
 */
function validatePaymentData(paymentData) {
  const errors = [];
  
  try {
    if (!paymentData || typeof paymentData !== 'object') {
      return { isValid: false, errors: ['Payment data is required'] };
    }

    // Sanitize inputs
    if (paymentData.description) paymentData.description = validators.sanitizeString(paymentData.description);

    // Required fields
    validators.required(paymentData.userId, 'User ID');
    validators.uuid(paymentData.userId, 'User ID');

    validators.required(paymentData.amount, 'Amount');
    validators.nonZeroNumber(paymentData.amount, 'Amount');

    validators.required(paymentData.date, 'Date');
    validators.date(paymentData.date, 'Date');

    // Optional fields with validation
    if (paymentData.description) {
      validators.minLength(paymentData.description, 1, 'Description');
      validators.maxLength(paymentData.description, 255, 'Description');
    }

    if (paymentData.relatedEventId) {
      validators.uuid(paymentData.relatedEventId, 'Related event ID');
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error.message);
    } else {
      errors.push('Invalid payment data');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate payment update data (all fields optional)
 */
function validatePaymentUpdate(updateData) {
  const errors = [];
  
  try {
    if (!updateData || typeof updateData !== 'object') {
      return { isValid: false, errors: ['Update data is required'] };
    }

    // Sanitize inputs if present
    if (updateData.description !== undefined) {
      updateData.description = validators.sanitizeString(updateData.description);
    }

    // Validate provided fields
    if (updateData.amount !== undefined) {
      validators.nonZeroNumber(updateData.amount, 'Amount');
    }

    if (updateData.date !== undefined) {
      validators.date(updateData.date, 'Date');
    }

    if (updateData.description !== undefined && updateData.description !== '') {
      validators.minLength(updateData.description, 1, 'Description');
      validators.maxLength(updateData.description, 255, 'Description');
    }

    if (updateData.relatedEventId !== undefined && updateData.relatedEventId !== '') {
      validators.uuid(updateData.relatedEventId, 'Related event ID');
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error.message);
    } else {
      errors.push('Invalid update data');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  ValidationError,
  validators,
  validateUserData,
  validateUserUpdate,
  validateEventData,
  validateEventUpdate,
  validateCostItemData,
  validateCostItemUpdate,
  validatePaymentData,
  validatePaymentUpdate,
};