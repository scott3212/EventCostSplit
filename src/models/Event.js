const { validators, ValidationError } = require('../utils/validators');

/**
 * Event model with validation
 * Represents a badminton session/event
 */
class Event {
  constructor(data) {
    this.validate(data);
    
    this.id = data.id;
    this.name = data.name;
    this.date = data.date;
    this.description = data.description || '';
    this.participants = data.participants || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Validate event data
   */
  validate(data) {
    try {
      // Required fields
      validators.required(data.name, 'Event name');
      validators.minLength(data.name, 3, 'Event name');
      validators.maxLength(data.name, 200, 'Event name');

      validators.required(data.date, 'Date');
      validators.date(data.date, 'Date');

      // Optional description
      if (data.description) {
        validators.maxLength(data.description, 500, 'Description');
      }

      // Participants validation
      if (data.participants) {
        validators.uuidArray(data.participants, 'Participants');
        
        // Check for duplicates
        const unique = new Set(data.participants);
        if (unique.size !== data.participants.length) {
          throw new ValidationError(
            'Cannot add the same person multiple times',
            'participants'
          );
        }

        // Must have at least one participant
        if (data.participants.length === 0) {
          throw new ValidationError(
            'Event must have at least one participant',
            'participants'
          );
        }

        // Reasonable limit on participants
        if (data.participants.length > 50) {
          throw new ValidationError(
            'Event cannot have more than 50 participants',
            'participants'
          );
        }
      }

      // Sanitize inputs
      data.name = validators.sanitizeString(data.name);
      if (data.description) {
        data.description = validators.sanitizeString(data.description);
      }

    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`Event validation failed: ${error.message}`, error.field);
      }
      throw error;
    }
  }

  /**
   * Create event data for API responses
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      date: this.date,
      description: this.description,
      participants: this.participants,
      participantCount: this.participants.length,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get formatted date for UI
   */
  getFormattedDate() {
    const date = new Date(this.date);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get short date for UI
   */
  getShortDate() {
    const date = new Date(this.date);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Check if event is in the past
   */
  isPastEvent() {
    const eventDate = new Date(this.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    return eventDate < today;
  }

  /**
   * Check if event is today
   */
  isToday() {
    const eventDate = new Date(this.date);
    const today = new Date();
    
    return eventDate.toDateString() === today.toDateString();
  }

  /**
   * Check if user is participant
   */
  hasParticipant(userId) {
    return this.participants.includes(userId);
  }

  /**
   * Add participant to event
   */
  addParticipant(userId) {
    if (!this.hasParticipant(userId)) {
      this.participants.push(userId);
    }
  }

  /**
   * Remove participant from event
   */
  removeParticipant(userId) {
    const index = this.participants.indexOf(userId);
    if (index > -1) {
      this.participants.splice(index, 1);
    }
  }

  /**
   * Get default split percentage for participants
   */
  getDefaultSplitPercentage() {
    if (this.participants.length === 0) {
      return {};
    }

    const basePercentage = 100 / this.participants.length;
    const splitPercentage = {};
    
    // Distribute percentages, handling rounding
    let totalAssigned = 0;
    
    for (let i = 0; i < this.participants.length - 1; i++) {
      const percentage = Math.floor(basePercentage * 100) / 100; // Round down to 2 decimals
      splitPercentage[this.participants[i]] = percentage;
      totalAssigned += percentage;
    }
    
    // Give remaining percentage to last participant
    const remaining = Math.round((100 - totalAssigned) * 100) / 100;
    splitPercentage[this.participants[this.participants.length - 1]] = remaining;
    
    return splitPercentage;
  }

  /**
   * Static method to create event from form data
   */
  static fromFormData(formData) {
    return new Event({
      name: formData.name,
      date: formData.date,
      description: formData.description || '',
      participants: formData.participants || [],
    });
  }

  /**
   * Static method to validate update data
   */
  static validateUpdate(updateData) {
    const allowedFields = ['name', 'date', 'description', 'participants'];
    const updates = {};

    // Only allow updating specific fields
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Create temporary event to validate
    const tempEventData = {
      name: updates.name || 'temp event',
      date: updates.date || new Date().toISOString(),
      description: updates.description,
      participants: updates.participants,
    };

    try {
      new Event(tempEventData);
    } catch (error) {
      throw error;
    }

    return updates;
  }

  /**
   * Validate participants exist (to be used by service layer)
   */
  static async validateParticipantsExist(participantIds, userService) {
    for (const userId of participantIds) {
      const userExists = await userService.exists(userId);
      if (!userExists) {
        throw new ValidationError(
          `Participant with ID ${userId} does not exist`,
          'participants'
        );
      }
    }
  }

  /**
   * Generate suggested event name based on date
   */
  static generateSuggestedName(date) {
    const eventDate = new Date(date);
    const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = eventDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${dayName} Badminton - ${monthDay}`;
  }
}

module.exports = Event;