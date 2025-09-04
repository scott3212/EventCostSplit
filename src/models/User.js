const { validators, ValidationError } = require('../utils/validators');

/**
 * User model with validation
 * Represents a person who can participate in badminton events
 */
class User {
  constructor(data) {
    this.validate(data);
    
    this.id = data.id;
    this.name = data.name;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.totalBalance = data.totalBalance || 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Validate user data
   */
  validate(data) {
    try {
      // Sanitize inputs first
      data.name = validators.sanitizeString(data.name);
      if (data.email) data.email = validators.sanitizeString(data.email);
      if (data.phone) data.phone = validators.sanitizeString(data.phone);

      // Required fields
      validators.required(data.name, 'Name');
      validators.minLength(data.name, 2, 'Name');
      validators.maxLength(data.name, 100, 'Name');

      // Optional fields with validation
      if (data.email) {
        validators.email(data.email, 'Email');
        validators.maxLength(data.email, 255, 'Email');
      }

      if (data.phone) {
        validators.phone(data.phone, 'Phone');
        validators.maxLength(data.phone, 50, 'Phone');
      }

      // Balance validation
      if (data.totalBalance !== undefined && data.totalBalance !== null) {
        validators.nonNegativeNumber(Math.abs(data.totalBalance), 'Balance'); // Allow negative balances (debt)
      }

    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`User validation failed: ${error.message}`, error.field);
      }
      throw error;
    }
  }

  /**
   * Create user data for API responses (exclude sensitive info)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      totalBalance: this.totalBalance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get user display name (for UI)
   */
  getDisplayName() {
    return this.name;
  }

  /**
   * Check if user owes money
   */
  oweseMoney() {
    return this.totalBalance < 0;
  }

  /**
   * Check if user is owed money
   */
  isOwedMoney() {
    return this.totalBalance > 0;
  }

  /**
   * Get balance status for UI
   */
  getBalanceStatus() {
    if (this.totalBalance < -0.01) {
      return {
        status: 'owes',
        message: `Owes $${Math.abs(this.totalBalance).toFixed(2)}`,
        color: 'red'
      };
    } else if (this.totalBalance > 0.01) {
      return {
        status: 'owed',
        message: `Owed $${this.totalBalance.toFixed(2)}`,
        color: 'green'
      };
    } else {
      return {
        status: 'settled',
        message: 'All settled up! 🎉',
        color: 'gray'
      };
    }
  }

  /**
   * Static method to create user from form data
   */
  static fromFormData(formData) {
    return new User({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      totalBalance: 0, // New users start with zero balance
    });
  }

  /**
   * Static method to validate update data
   */
  static validateUpdate(updateData) {
    const allowedFields = ['name', 'email', 'phone'];
    const updates = {};

    // Only allow updating specific fields
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });

    // Validate the updates
    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Create temporary user to validate
    const tempUserData = {
      name: updates.name !== undefined ? updates.name : 'temp',
      email: updates.email,
      phone: updates.phone,
      totalBalance: 0,
    };

    try {
      new User(tempUserData);
    } catch (error) {
      throw error;
    }

    return updates;
  }

  /**
   * Check if user name is unique (to be used by service layer)
   */
  static isNameUnique(name, users, excludeId = null) {
    const sanitizedName = validators.sanitizeString(name).toLowerCase();
    
    return !users.some(user => 
      user.id !== excludeId && 
      user.name.toLowerCase() === sanitizedName
    );
  }
}

module.exports = User;