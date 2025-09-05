const { validators, ValidationError } = require('../utils/validators');

/**
 * CostItem model with validation
 * Represents an expense that needs to be split among participants
 */
class CostItem {
  constructor(data) {
    this.validate(data);
    
    this.id = data.id || null; // ID can be null initially, will be set by repository
    this.eventId = data.eventId;
    this.description = data.description;
    this.amount = data.amount;
    this.paidBy = data.paidBy;
    this.date = data.date || new Date().toISOString();
    this.splitPercentage = data.splitPercentage;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validate cost item data
   */
  validate(data) {
    try {
      // Required fields
      validators.required(data.eventId, 'Event');
      validators.uuid(data.eventId, 'Event ID');

      validators.required(data.description, 'Description');
      validators.minLength(data.description, 3, 'Description');
      validators.maxLength(data.description, 200, 'Description');

      validators.required(data.amount, 'Amount');
      validators.currency(data.amount, 'Amount');

      validators.required(data.paidBy, 'Paid by');
      validators.uuid(data.paidBy, 'Paid by');

      validators.required(data.date, 'Date');
      validators.date(data.date, 'Date');

      validators.required(data.splitPercentage, 'Split configuration');
      validators.splitPercentages(data.splitPercentage, 'Split percentages');

      // Ensure splitPercentage has at least one participant
      const participants = Object.keys(data.splitPercentage);
      if (participants.length === 0) {
        throw new ValidationError(
          'At least one person must be included in the split',
          'splitPercentage'
        );
      }

      // Validate that paidBy is included in splitPercentage
      if (!(data.paidBy in data.splitPercentage)) {
        throw new ValidationError(
          'The person who paid must be included in the split',
          'paidBy'
        );
      }

      // Sanitize inputs
      data.description = validators.sanitizeString(data.description);
      data.amount = validators.currency(data.amount, 'Amount');

    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`Cost item validation failed: ${error.message}`, error.field);
      }
      throw error;
    }
  }

  /**
   * Create cost item data for API responses
   */
  toJSON() {
    return {
      id: this.id,
      eventId: this.eventId,
      description: this.description,
      amount: this.amount,
      paidBy: this.paidBy,
      date: this.date,
      splitPercentage: this.splitPercentage,
      participantCount: Object.keys(this.splitPercentage).length,
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
   * Calculate individual shares for each participant
   */
  calculateShares() {
    const shares = {};
    
    Object.entries(this.splitPercentage).forEach(([userId, percentage]) => {
      const share = (this.amount * percentage) / 100;
      shares[userId] = Math.round(share * 100) / 100; // Round to 2 decimal places
    });
    
    return shares;
  }

  /**
   * Calculate balances for each participant (what they owe/are owed)
   */
  calculateBalances() {
    const shares = this.calculateShares();
    const balances = {};
    
    // Everyone starts by owing their share
    Object.entries(shares).forEach(([userId, share]) => {
      balances[userId] = -share; // Negative = owes money
    });
    
    // Person who paid gets credited for the full amount
    balances[this.paidBy] += this.amount;
    
    return balances;
  }

  /**
   * Get excluded participants (0% share)
   */
  getExcludedParticipants() {
    return Object.entries(this.splitPercentage)
      .filter(([_, percentage]) => percentage === 0)
      .map(([userId]) => userId);
  }

  /**
   * Get included participants (>0% share)
   */
  getIncludedParticipants() {
    return Object.entries(this.splitPercentage)
      .filter(([_, percentage]) => percentage > 0)
      .map(([userId]) => userId);
  }

  /**
   * Check if split is equal among all participants
   */
  isEqualSplit() {
    const percentages = Object.values(this.splitPercentage);
    const nonZeroPercentages = percentages.filter(p => p > 0);
    
    if (nonZeroPercentages.length === 0) return false;
    
    const expectedPercentage = 100 / nonZeroPercentages.length;
    const tolerance = 0.01;
    
    return nonZeroPercentages.every(p => 
      Math.abs(p - expectedPercentage) < tolerance
    );
  }

  /**
   * Get summary for UI display
   */
  getSummary(users = {}) {
    const shares = this.calculateShares();
    const included = this.getIncludedParticipants();
    const excluded = this.getExcludedParticipants();
    
    const paidByName = users[this.paidBy]?.name || 'Unknown';
    
    let splitDescription;
    if (excluded.length === 0) {
      splitDescription = `Split equally among ${included.length} people`;
    } else {
      const includedNames = included.map(id => users[id]?.name || 'Unknown');
      splitDescription = `Split among: ${includedNames.join(', ')}`;
    }
    
    return {
      description: this.description,
      amount: this.getFormattedAmount(),
      paidBy: paidByName,
      date: this.getFormattedDate(),
      splitDescription,
      shares,
      includedCount: included.length,
      excludedCount: excluded.length,
      isEqualSplit: this.isEqualSplit(),
    };
  }

  /**
   * Static method to create cost item from form data
   */
  static fromFormData(formData, eventParticipants) {
    // Generate default equal split if not provided
    let splitPercentage = formData.splitPercentage;
    
    if (!splitPercentage && eventParticipants) {
      splitPercentage = CostItem.generateEqualSplit(eventParticipants);
    }
    
    return new CostItem({
      eventId: formData.eventId,
      description: formData.description,
      amount: formData.amount,
      paidBy: formData.paidBy,
      date: formData.date || new Date().toISOString(),
      splitPercentage: splitPercentage,
    });
  }

  /**
   * Generate equal split percentages for participants
   */
  static generateEqualSplit(participantIds) {
    if (!participantIds || participantIds.length === 0) {
      return {};
    }

    const basePercentage = 100 / participantIds.length;
    const splitPercentage = {};
    let totalAssigned = 0;
    
    // Assign base percentage to all but last participant
    for (let i = 0; i < participantIds.length - 1; i++) {
      const percentage = Math.floor(basePercentage * 100) / 100;
      splitPercentage[participantIds[i]] = percentage;
      totalAssigned += percentage;
    }
    
    // Give remaining to last participant (handles rounding)
    const remaining = Math.round((100 - totalAssigned) * 100) / 100;
    splitPercentage[participantIds[participantIds.length - 1]] = remaining;
    
    return splitPercentage;
  }

  /**
   * Exclude specific participants from split (set to 0%)
   */
  static excludeParticipants(originalSplit, excludeIds) {
    const newSplit = { ...originalSplit };
    let totalToRedistribute = 0;
    
    // Set excluded participants to 0% and calculate redistribution amount
    excludeIds.forEach(userId => {
      if (userId in newSplit) {
        totalToRedistribute += newSplit[userId];
        newSplit[userId] = 0;
      }
    });
    
    // Get remaining participants
    const remainingParticipants = Object.entries(newSplit)
      .filter(([_, percentage]) => percentage > 0)
      .map(([userId]) => userId);
    
    if (remainingParticipants.length === 0) {
      throw new ValidationError('Cannot exclude all participants from the split');
    }
    
    // Redistribute excluded percentages equally among remaining participants
    const redistributionPerParticipant = totalToRedistribute / remainingParticipants.length;
    
    remainingParticipants.forEach(userId => {
      newSplit[userId] += redistributionPerParticipant;
    });
    
    // Round to 2 decimal places
    Object.keys(newSplit).forEach(userId => {
      newSplit[userId] = Math.round(newSplit[userId] * 100) / 100;
    });
    
    return newSplit;
  }

  /**
   * Static method to validate update data
   */
  static validateUpdate(updateData) {
    const allowedFields = ['description', 'amount', 'date', 'splitPercentage'];
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
}

module.exports = CostItem;