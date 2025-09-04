const { validators, ValidationError } = require('../utils/validators');

/**
 * Payment model with validation
 * Represents a payment made by a user (settlement or top-up)
 */
class Payment {
  constructor(data) {
    this.validate(data);
    
    this.id = data.id;
    this.userId = data.userId;
    this.amount = data.amount;
    this.date = data.date;
    this.description = data.description || '';
    this.relatedEventId = data.relatedEventId || null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Validate payment data
   */
  validate(data) {
    try {
      // Required fields
      validators.required(data.userId, 'User');
      validators.uuid(data.userId, 'User ID');

      validators.required(data.amount, 'Amount');
      validators.currency(data.amount, 'Amount');

      validators.required(data.date, 'Date');
      validators.date(data.date, 'Date');

      // Optional fields
      if (data.description) {
        validators.maxLength(data.description, 500, 'Description');
      }

      if (data.relatedEventId) {
        validators.uuid(data.relatedEventId, 'Related event ID');
      }

      // Sanitize inputs
      if (data.description) {
        data.description = validators.sanitizeString(data.description);
      }
      data.amount = validators.currency(data.amount, 'Amount');

    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`Payment validation failed: ${error.message}`, error.field);
      }
      throw error;
    }
  }

  /**
   * Create payment data for API responses
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      amount: this.amount,
      date: this.date,
      description: this.description,
      relatedEventId: this.relatedEventId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get formatted amount for UI
   */
  getFormattedAmount() {
    return `$${this.amount.toFixed(2)}`;
  }

  /**
   * Get formatted date for UI
   */
  getFormattedDate() {
    const date = new Date(this.date);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get formatted datetime for UI
   */
  getFormattedDateTime() {
    const date = new Date(this.date);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  /**
   * Check if payment is recent (within last 24 hours)
   */
  isRecent() {
    const paymentDate = new Date(this.date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return paymentDate > yesterday;
  }

  /**
   * Check if payment is linked to an event
   */
  isLinkedToEvent() {
    return this.relatedEventId !== null;
  }

  /**
   * Get payment type based on description and context
   */
  getPaymentType() {
    const desc = this.description.toLowerCase();
    
    if (desc.includes('advance') || desc.includes('top-up') || desc.includes('prepay')) {
      return 'advance';
    } else if (desc.includes('settle') || desc.includes('payment') || this.relatedEventId) {
      return 'settlement';
    } else {
      return 'payment';
    }
  }

  /**
   * Get payment summary for UI
   */
  getSummary(user = null, event = null) {
    const userName = user?.name || 'Unknown User';
    const eventName = event?.name || null;
    
    return {
      id: this.id,
      userName,
      amount: this.getFormattedAmount(),
      date: this.getFormattedDate(),
      description: this.description || 'Payment',
      eventName,
      paymentType: this.getPaymentType(),
      isRecent: this.isRecent(),
      isLinkedToEvent: this.isLinkedToEvent(),
    };
  }

  /**
   * Generate suggested description based on context
   */
  static generateSuggestedDescription(amount, relatedEventId, eventName) {
    if (relatedEventId && eventName) {
      return `Payment for ${eventName}`;
    } else if (parseFloat(amount) >= 50) {
      return 'Advance payment for future events';
    } else {
      return 'Payment for badminton expenses';
    }
  }

  /**
   * Static method to create payment from form data
   */
  static fromFormData(formData) {
    // Generate suggested description if not provided
    let description = formData.description;
    if (!description || description.trim() === '') {
      description = Payment.generateSuggestedDescription(
        formData.amount,
        formData.relatedEventId,
        formData.eventName
      );
    }
    
    return new Payment({
      userId: formData.userId,
      amount: formData.amount,
      date: formData.date || new Date().toISOString(),
      description: description,
      relatedEventId: formData.relatedEventId || null,
    });
  }

  /**
   * Static method to validate update data
   */
  static validateUpdate(updateData) {
    const allowedFields = ['amount', 'date', 'description', 'relatedEventId'];
    const updates = {};

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Create temporary payment to validate
    const tempPaymentData = {
      userId: 'temp-user-id', // This won't be validated in update
      amount: updates.amount || 1,
      date: updates.date || new Date().toISOString(),
      description: updates.description,
      relatedEventId: updates.relatedEventId,
    };

    // Validate only the fields being updated
    try {
      if (updates.amount !== undefined) {
        validators.currency(updates.amount, 'Amount');
      }
      if (updates.date !== undefined) {
        validators.date(updates.date, 'Date');
      }
      if (updates.description !== undefined) {
        validators.maxLength(updates.description, 500, 'Description');
      }
      if (updates.relatedEventId !== undefined && updates.relatedEventId !== null) {
        validators.uuid(updates.relatedEventId, 'Related event ID');
      }
    } catch (error) {
      throw error;
    }

    return updates;
  }

  /**
   * Create payment for settling user balance
   */
  static createSettlement(userId, amount, description, relatedEventId = null) {
    if (!description || description.trim() === '') {
      description = amount >= 50 
        ? 'Settling up for recent events' 
        : 'Payment for badminton expenses';
    }
    
    return new Payment({
      userId,
      amount,
      date: new Date().toISOString(),
      description,
      relatedEventId,
    });
  }

  /**
   * Create payment for advance/top-up
   */
  static createAdvancePayment(userId, amount, description) {
    if (!description || description.trim() === '') {
      description = 'Advance payment for future events';
    }
    
    return new Payment({
      userId,
      amount,
      date: new Date().toISOString(),
      description,
      relatedEventId: null,
    });
  }

  /**
   * Validate payment amount against user balance (for UI warnings)
   */
  static validateAmountAgainstBalance(amount, userBalance) {
    const warnings = [];
    
    if (amount > Math.abs(userBalance) * 2) {
      warnings.push(
        `Payment amount ($${amount.toFixed(2)}) is much larger than current balance ($${Math.abs(userBalance).toFixed(2)})`
      );
    }
    
    if (userBalance >= 0 && amount > 100) {
      warnings.push(
        'User doesn\'t owe money. This might be an advance payment.'
      );
    }
    
    return warnings;
  }

  /**
   * Get payment history summary for user
   */
  static getPaymentHistorySummary(payments) {
    if (!payments || payments.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        averagePayment: 0,
        lastPaymentDate: null,
        paymentFrequency: 'none',
      };
    }

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const sortedPayments = payments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate frequency (very basic)
    let frequency = 'rare';
    if (payments.length >= 5) frequency = 'frequent';
    else if (payments.length >= 2) frequency = 'occasional';
    
    return {
      totalPayments: payments.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      averagePayment: Math.round((totalAmount / payments.length) * 100) / 100,
      lastPaymentDate: sortedPayments[0].date,
      paymentFrequency: frequency,
    };
  }
}

module.exports = Payment;