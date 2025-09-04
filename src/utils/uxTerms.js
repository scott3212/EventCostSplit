/**
 * User-friendly terminology and UX utilities
 * Translates technical terms to user-friendly language
 */

const { UI_TERMS } = require('../config/constants');

/**
 * Mapping of technical terms to user-friendly terms
 */
const TERM_MAPPING = {
  // Data model terms
  'costItem': 'expense',
  'splitPercentage': 'share',
  'participant': 'player',
  'balance': 'amount owed',
  'settlement': 'payment',
  'topup': 'advance payment',
  
  // Technical terms
  'validation': 'input check',
  'error': 'issue',
  'failed': 'didn\'t work',
  'success': 'completed',
  'created': 'added',
  'updated': 'changed',
  'deleted': 'removed',
  
  // UI actions
  'submit': 'save',
  'cancel': 'go back',
  'confirm': 'yes, continue',
  'abort': 'stop',
  
  // Status terms
  'pending': 'waiting',
  'processing': 'working on it',
  'completed': 'done',
  'failed': 'something went wrong',
};

/**
 * Convert technical term to user-friendly term
 */
function toUserTerm(technicalTerm) {
  const lowerTerm = technicalTerm.toLowerCase();
  return TERM_MAPPING[lowerTerm] || technicalTerm;
}

/**
 * Convert technical message to user-friendly message
 */
function toUserMessage(technicalMessage) {
  let userMessage = technicalMessage;
  
  // Replace common technical patterns
  const replacements = [
    { pattern: /validation failed/gi, replacement: 'please check your input' },
    { pattern: /required field/gi, replacement: 'this field is needed' },
    { pattern: /invalid format/gi, replacement: 'please enter a valid value' },
    { pattern: /not found/gi, replacement: 'couldn\'t find that' },
    { pattern: /already exists/gi, replacement: 'already have one with that name' },
    { pattern: /unauthorized/gi, replacement: 'permission denied' },
    { pattern: /internal server error/gi, replacement: 'something went wrong on our end' },
    { pattern: /bad request/gi, replacement: 'there\'s an issue with your request' },
    { pattern: /cost item/gi, replacement: 'expense' },
    { pattern: /split percentage/gi, replacement: 'share' },
    { pattern: /participant/gi, replacement: 'player' },
  ];
  
  replacements.forEach(({ pattern, replacement }) => {
    userMessage = userMessage.replace(pattern, replacement);
  });
  
  return userMessage;
}

/**
 * Format currency amount for display
 */
function formatCurrency(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format balance with user-friendly language
 */
function formatBalance(balance) {
  const amount = parseFloat(balance);
  const absAmount = Math.abs(amount);
  const formattedAmount = formatCurrency(absAmount);
  
  if (amount < -0.01) {
    return {
      text: `Owes ${formattedAmount}`,
      color: 'red',
      icon: '💳',
      status: 'owes',
    };
  } else if (amount > 0.01) {
    return {
      text: `Owed ${formattedAmount}`,
      color: 'green',
      icon: '💰',
      status: 'owed',
    };
  } else {
    return {
      text: 'All settled up! 🎉',
      color: 'gray',
      icon: '✅',
      status: 'settled',
    };
  }
}

/**
 * Format percentage for display
 */
function formatPercentage(percentage) {
  const num = parseFloat(percentage);
  if (isNaN(num)) return '0%';
  
  return `${num.toFixed(1)}%`;
}

/**
 * Generate user-friendly error messages
 */
function generateErrorMessage(field, errorType, context = {}) {
  const fieldName = toUserTerm(field);
  
  const errorMessages = {
    required: `${fieldName} is required`,
    minLength: `${fieldName} is too short`,
    maxLength: `${fieldName} is too long`,
    invalid: `Please enter a valid ${fieldName.toLowerCase()}`,
    duplicate: `${fieldName} already exists`,
    notFound: `${fieldName} not found`,
    tooLarge: `${fieldName} is too large`,
    tooSmall: `${fieldName} is too small`,
    invalidFormat: `${fieldName} format is not valid`,
  };
  
  return errorMessages[errorType] || `There's an issue with ${fieldName.toLowerCase()}`;
}

/**
 * Generate success messages
 */
function generateSuccessMessage(action, itemType) {
  const friendlyAction = toUserTerm(action);
  const friendlyItem = toUserTerm(itemType);
  
  const successMessages = {
    created: `${friendlyItem} added successfully! 🎉`,
    updated: `${friendlyItem} updated successfully! ✨`,
    deleted: `${friendlyItem} removed successfully! 🗑️`,
    paid: `Payment recorded successfully! 💰`,
    settled: `All settled up! 🎉`,
  };
  
  return successMessages[action] || `${friendlyAction} completed successfully!`;
}

/**
 * Format date for user display
 */
function formatUserDate(dateString) {
  const date = new Date(dateString);
  
  // Check if date is today
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) {
    return 'Today';
  }
  
  // Check if date is yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isYesterday) {
    return 'Yesterday';
  }
  
  // Check if date is this year
  const isThisYear = date.getFullYear() === today.getFullYear();
  
  if (isThisYear) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
  
  // Full date for other years
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Generate helpful placeholder text
 */
function getPlaceholderText(field) {
  const placeholders = {
    name: 'Enter your name',
    email: 'your.email@example.com',
    phone: '+1-555-0123',
    description: 'What was this expense for?',
    amount: '0.00',
    date: 'When did this happen?',
    eventName: 'Tuesday Badminton Session',
    paymentDescription: 'Payment for badminton expenses',
  };
  
  return placeholders[field] || '';
}

/**
 * Generate contextual help text
 */
function getHelpText(field, context = {}) {
  const helpTexts = {
    splitPercentage: 'Adjust who pays what share of this expense. All shares must add up to 100%.',
    participants: 'Select which players participated in this event.',
    amount: 'Enter the total amount that was paid.',
    paidBy: 'Who paid for this expense?',
    relatedEvent: 'Link this payment to a specific event (optional).',
    balance: 'Positive means they have credit, negative means they owe money.',
  };
  
  return helpTexts[field] || '';
}

/**
 * Convert API response to user-friendly format
 */
function formatApiResponse(response) {
  if (!response.success) {
    return {
      ...response,
      error: {
        ...response.error,
        message: toUserMessage(response.error.message),
      },
    };
  }
  
  return response;
}

/**
 * Accessibility helpers
 */
const AccessibilityHelpers = {
  /**
   * Generate ARIA labels
   */
  generateAriaLabel(element, context = {}) {
    const labels = {
      balanceCard: `${context.name} balance: ${formatBalance(context.balance).text}`,
      expenseItem: `${context.description} expense: ${formatCurrency(context.amount)} paid by ${context.paidBy}`,
      paymentButton: `Record payment for ${context.name}`,
      deleteButton: `Delete ${context.itemType}: ${context.name}`,
      editButton: `Edit ${context.itemType}: ${context.name}`,
    };
    
    return labels[element] || '';
  },
  
  /**
   * Generate screen reader descriptions
   */
  generateScreenReaderText(context) {
    // Implementation for screen reader compatibility
    return `Page contains ${context.itemCount} items. Use tab to navigate between elements.`;
  },
};

module.exports = {
  TERM_MAPPING,
  toUserTerm,
  toUserMessage,
  formatCurrency,
  formatBalance,
  formatPercentage,
  generateErrorMessage,
  generateSuccessMessage,
  formatUserDate,
  getPlaceholderText,
  getHelpText,
  formatApiResponse,
  AccessibilityHelpers,
};