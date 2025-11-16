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

    // Shares-based splitting (new feature)
    this.splitShares = data.splitShares || null;
    this.splitMode = data.splitMode || this.detectSplitMode(data);

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
      validators.minLength(data.description, 1, 'Description');
      validators.maxLength(data.description, 200, 'Description');

      validators.required(data.amount, 'Amount');
      validators.currency(data.amount, 'Amount');

      validators.required(data.paidBy, 'Paid by');
      validators.uuid(data.paidBy, 'Paid by');

      validators.required(data.date, 'Date');
      validators.date(data.date, 'Date');

      // Validate split configuration - either splitShares or splitPercentage required
      if (!data.splitShares && !data.splitPercentage) {
        throw new ValidationError('Either split shares or split percentage must be provided');
      }

      // Validate shares if provided
      if (data.splitShares) {
        validators.splitShares(data.splitShares, 'Split shares');

        // Ensure splitShares has at least one participant
        const participants = Object.keys(data.splitShares);
        if (participants.length === 0) {
          throw new ValidationError(
            'At least one person must be included in the split',
            'splitShares'
          );
        }

        // Validate that paidBy is included in splitShares
        if (!(data.paidBy in data.splitShares)) {
          throw new ValidationError(
            'The person who paid must be included in the split',
            'paidBy'
          );
        }
      }

      // Validate percentages if provided and no shares
      if (!data.splitShares && data.splitPercentage) {
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
   * Detect split mode based on available data
   */
  detectSplitMode(data = {}) {
    // Use data parameter during construction, or instance properties after
    const splitShares = data.splitShares || this.splitShares;
    const splitPercentage = data.splitPercentage || this.splitPercentage;

    if (splitShares && Object.keys(splitShares).length > 0) {
      return 'shares';
    }
    if (splitPercentage && Object.keys(splitPercentage).length > 0) {
      return 'percentage';
    }
    return 'percentage'; // Default fallback
  }

  /**
   * Create cost item data for API responses
   */
  toJSON() {
    // Determine participant count based on split mode
    const participantCount = this.splitMode === 'shares' && this.splitShares
      ? Object.keys(this.splitShares).length
      : Object.keys(this.splitPercentage || {}).length;

    return {
      id: this.id,
      eventId: this.eventId,
      description: this.description,
      amount: this.amount,
      paidBy: this.paidBy,
      date: this.date,
      splitPercentage: this.splitPercentage,
      splitShares: this.splitShares,
      splitMode: this.splitMode,
      participantCount: participantCount,
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
   * Calculate individual dollar amounts for each participant
   */
  calculateShares() {
    if (this.splitMode === 'shares' && this.splitShares) {
      return this.calculateSharesFromShares();
    }
    return this.calculateSharesFromPercentages();
  }

  /**
   * Calculate shares using the shares-based method (precise, no rounding errors)
   */
  calculateSharesFromShares() {
    const shares = {};
    const totalShares = Object.values(this.splitShares).reduce((sum, shares) => sum + shares, 0);

    if (totalShares === 0) {
      return shares;
    }

    // Calculate base amount per share
    const amountPerShare = this.amount / totalShares;
    let totalAssigned = 0;
    const participants = Object.entries(this.splitShares);

    // Assign amounts to all participants except the last
    for (let i = 0; i < participants.length - 1; i++) {
      const [userId, userShares] = participants[i];
      const amount = Math.round(amountPerShare * userShares * 100) / 100;
      shares[userId] = amount;
      totalAssigned += amount;
    }

    // Last participant gets remainder to ensure total equals original amount
    if (participants.length > 0) {
      const [lastUserId] = participants[participants.length - 1];
      const remainingAmount = Math.round((this.amount - totalAssigned) * 100) / 100;
      shares[lastUserId] = remainingAmount;
    }

    return shares;
  }

  /**
   * Calculate shares using percentage-based method (legacy)
   */
  calculateSharesFromPercentages() {
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
   * Get excluded participants (0% share or 0 shares)
   */
  getExcludedParticipants() {
    if (this.splitMode === 'shares' && this.splitShares) {
      return Object.entries(this.splitShares)
        .filter(([_, shares]) => shares === 0)
        .map(([userId]) => userId);
    }
    return Object.entries(this.splitPercentage || {})
      .filter(([_, percentage]) => percentage === 0)
      .map(([userId]) => userId);
  }

  /**
   * Get included participants (>0% share or >0 shares)
   */
  getIncludedParticipants() {
    if (this.splitMode === 'shares' && this.splitShares) {
      return Object.entries(this.splitShares)
        .filter(([_, shares]) => shares > 0)
        .map(([userId]) => userId);
    }
    return Object.entries(this.splitPercentage || {})
      .filter(([_, percentage]) => percentage > 0)
      .map(([userId]) => userId);
  }

  /**
   * Check if split is equal among all participants
   */
  isEqualSplit() {
    if (this.splitMode === 'shares' && this.splitShares) {
      const shareValues = Object.values(this.splitShares);
      const nonZeroShares = shareValues.filter(s => s > 0);

      if (nonZeroShares.length === 0) return false;

      // In shares mode, equal split means all participants have the same number of shares
      const firstShareValue = nonZeroShares[0];
      return nonZeroShares.every(s => s === firstShareValue);
    }

    // Legacy percentage mode
    const percentages = Object.values(this.splitPercentage || {});
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
   * Generate equal split shares for participants (preferred method)
   */
  static generateEqualShares(participantIds) {
    if (!participantIds || participantIds.length === 0) {
      return {};
    }

    const splitShares = {};
    participantIds.forEach(userId => {
      splitShares[userId] = 1; // 1 share each for equal split
    });

    return splitShares;
  }

  /**
   * Convert percentage split to shares split
   */
  static convertPercentagesToShares(splitPercentage) {
    if (!splitPercentage) return {};

    const splitShares = {};
    const activeParticipants = Object.entries(splitPercentage).filter(([_, pct]) => pct > 0);

    // Check if it's an equal split
    if (activeParticipants.length > 0) {
      const expectedPercentage = 100 / activeParticipants.length;
      const tolerance = 0.1;
      const isEqual = activeParticipants.every(([_, pct]) =>
        Math.abs(pct - expectedPercentage) <= tolerance
      );

      if (isEqual) {
        // Convert to equal shares
        activeParticipants.forEach(([userId]) => {
          splitShares[userId] = 1;
        });
        // Set excluded participants to 0 shares
        Object.keys(splitPercentage).forEach(userId => {
          if (splitPercentage[userId] === 0) {
            splitShares[userId] = 0;
          }
        });
      } else {
        // Convert custom percentages to proportional shares
        // Use smallest percentage as base unit
        const minPercentage = Math.min(...activeParticipants.map(([_, pct]) => pct));
        Object.entries(splitPercentage).forEach(([userId, pct]) => {
          splitShares[userId] = pct === 0 ? 0 : Math.round(pct / minPercentage);
        });
      }
    }

    return splitShares;
  }

  /**
   * Convert shares split to percentage split
   */
  static convertSharesToPercentages(splitShares) {
    if (!splitShares) return {};

    const totalShares = Object.values(splitShares).reduce((sum, shares) => sum + shares, 0);
    if (totalShares === 0) return {};

    const splitPercentage = {};
    Object.entries(splitShares).forEach(([userId, shares]) => {
      const percentage = (shares / totalShares) * 100;
      splitPercentage[userId] = Math.round(percentage * 100) / 100;
    });

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