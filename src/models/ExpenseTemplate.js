const { validators, ValidationError } = require('../utils/validators');

/**
 * ExpenseTemplate model with validation
 * Represents a reusable expense template for quick-adding common expenses
 */
class ExpenseTemplate {
  constructor(data) {
    this.validate(data);

    this.id = data.id || null; // ID can be null initially, will be set by repository
    this.name = data.name;
    this.defaultAmount = data.defaultAmount;
    this.category = data.category || null; // Reserved for future Phase 2 categorization
    this.defaultPaidBy = data.defaultPaidBy || null; // Optional: pre-select default payer
    this.order = data.order || 0; // Display order (for future drag-to-reorder)
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validate expense template data
   */
  validate(data) {
    try {
      // Required fields
      validators.required(data.name, 'Template name');
      validators.minLength(data.name, 1, 'Template name');
      validators.maxLength(data.name, 100, 'Template name');

      validators.required(data.defaultAmount, 'Default amount');
      validators.currency(data.defaultAmount, 'Default amount');

      // Optional fields with validation if provided
      if (data.defaultPaidBy !== null && data.defaultPaidBy !== undefined && data.defaultPaidBy !== '') {
        validators.uuid(data.defaultPaidBy, 'Default payer');
      }

      if (data.category !== null && data.category !== undefined && data.category !== '') {
        validators.minLength(data.category, 1, 'Category');
        validators.maxLength(data.category, 50, 'Category');
      }

      if (data.order !== null && data.order !== undefined) {
        if (typeof data.order !== 'number' || data.order < 0) {
          throw new ValidationError('Order must be a non-negative number', 'order');
        }
      }

      // Sanitize inputs
      data.name = validators.sanitizeString(data.name);
      if (data.category) {
        data.category = validators.sanitizeString(data.category);
      }
      data.defaultAmount = validators.currency(data.defaultAmount, 'Default amount');

    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`Template validation failed: ${error.message}`, error.field);
      }
      throw error;
    }
  }

  /**
   * Create template data for API responses
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      defaultAmount: this.defaultAmount,
      category: this.category,
      defaultPaidBy: this.defaultPaidBy,
      order: this.order,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get formatted amount for UI
   */
  getFormattedAmount() {
    return `$${this.defaultAmount.toFixed(2)}`;
  }

  /**
   * Get formatted creation date for UI
   */
  getFormattedDate() {
    const date = new Date(this.createdAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Create expense data from this template
   * Used when user clicks template to create a new expense
   */
  toExpenseData(eventId, participants = []) {
    // Generate equal shares for all participants
    const splitShares = {};
    participants.forEach(userId => {
      splitShares[userId] = 1; // Equal split (1 share each)
    });

    return {
      eventId: eventId,
      description: this.name,
      amount: this.defaultAmount,
      paidBy: this.defaultPaidBy || '', // Empty if not set, user must select
      date: new Date().toISOString(),
      splitShares: splitShares,
      splitMode: 'shares',
    };
  }

  /**
   * Static method to validate update data
   */
  static validateUpdate(updateData) {
    const allowedFields = ['name', 'defaultAmount', 'category', 'defaultPaidBy', 'order'];
    const updates = {};

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    return updates;
  }

  /**
   * Static method to generate default order value
   * Should be called by repository when creating new template
   */
  static getNextOrder(existingTemplates = []) {
    if (existingTemplates.length === 0) {
      return 1;
    }

    const maxOrder = Math.max(...existingTemplates.map(t => t.order || 0));
    return maxOrder + 1;
  }
}

module.exports = ExpenseTemplate;
