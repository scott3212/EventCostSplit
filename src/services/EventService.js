const Event = require('../models/Event');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { validateEventData, validateEventUpdate } = require('../utils/validators');

/**
 * Service for event-related business logic
 * Handles event CRUD operations, participant management, and event statistics
 */
class EventService {
  constructor(eventRepository, userRepository, costItemRepository, paymentRepository, calculationService) {
    this.eventRepo = eventRepository;
    this.userRepo = userRepository;
    this.costItemRepo = costItemRepository;
    this.paymentRepo = paymentRepository;
    this.calculationService = calculationService;
  }

  /**
   * Create a new event
   */
  async createEvent(eventData) {
    // Validate input data
    const validation = validateEventData(eventData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Check if name is unique
    const isNameUnique = await this.eventRepo.isNameUnique(eventData.name);
    if (!isNameUnique) {
      throw new ValidationError('An event with this name already exists');
    }

    // Validate all participants exist
    if (eventData.participants && eventData.participants.length > 0) {
      await this.validateParticipantsExist(eventData.participants);
    }

    // Create event model
    const event = new Event(eventData);
    
    // Save to repository
    return await this.eventRepo.create(event.toJSON());
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  }

  /**
   * Get all events
   */
  async getAllEvents() {
    return await this.eventRepo.findAll();
  }

  /**
   * Update event information
   */
  async updateEvent(eventId, updateData) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    // Validate update data
    const validation = validateEventUpdate(updateData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Check if event exists
    const existingEvent = await this.eventRepo.findById(eventId);
    if (!existingEvent) {
      throw new NotFoundError('Event not found');
    }

    // Check name uniqueness if name is being updated
    if (updateData.name && updateData.name !== existingEvent.name) {
      const isNameUnique = await this.eventRepo.isNameUnique(updateData.name, eventId);
      if (!isNameUnique) {
        throw new ValidationError('An event with this name already exists');
      }
    }

    // Validate participants if being updated
    if (updateData.participants) {
      await this.validateParticipantsExist(updateData.participants);
      
      // Check if any cost items exist that would become invalid
      const costItems = await this.costItemRepo.findByEvent(eventId);
      if (costItems.length > 0) {
        await this.validateParticipantUpdateWithCostItems(updateData.participants, costItems);
      }
    }

    // Auto-update participantCount if participants are being updated
    if (updateData.participants) {
      updateData.participantCount = updateData.participants.length;
    }
    
    // Update event
    return await this.eventRepo.update(eventId, updateData);
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if event has any cost items or payments
    const costItems = await this.costItemRepo.findByEvent(eventId);
    const payments = await this.paymentRepo.findByEvent(eventId);

    if (costItems.length > 0 || payments.length > 0) {
      throw new ValidationError('Cannot delete event with existing expenses or payments. Please remove them first.');
    }

    return await this.eventRepo.delete(eventId);
  }

  /**
   * Add participant to event
   */
  async addParticipant(eventId, userId) {
    if (!eventId || !userId) {
      throw new ValidationError('Event ID and User ID are required');
    }

    // Check if event exists
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Add participant
    return await this.eventRepo.addParticipant(eventId, userId);
  }

  /**
   * Remove participant from event
   */
  async removeParticipant(eventId, userId) {
    if (!eventId || !userId) {
      throw new ValidationError('Event ID and User ID are required');
    }

    // Check if event exists
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if participant can be removed (no cost items assigned)
    const costItems = await this.costItemRepo.findByEvent(eventId);
    const userInCostItems = costItems.some(item => 
      item.splitPercentage[userId] > 0 || item.paidBy === userId
    );

    if (userInCostItems) {
      throw new ValidationError('Cannot remove participant who has expenses assigned to them. Please update expenses first.');
    }

    // Remove participant
    return await this.eventRepo.removeParticipant(eventId, userId);
  }

  /**
   * Check if user is participant in event
   */
  async isParticipant(eventId, userId) {
    if (!eventId || !userId) {
      throw new ValidationError('Event ID and User ID are required');
    }

    return await this.eventRepo.isParticipant(eventId, userId);
  }

  /**
   * Get events for a specific user
   */
  async getEventsForUser(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.eventRepo.findByParticipant(userId);
  }

  /**
   * Get event balance details
   */
  async getEventBalance(eventId) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return await this.calculationService.calculateEventBalance(eventId);
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(eventId) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return await this.calculationService.getEventStatistics(eventId);
  }

  /**
   * Search events by name
   */
  async searchEvents(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }

    return await this.eventRepo.searchByName(searchTerm);
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents() {
    return await this.eventRepo.findUpcomingEvents();
  }

  /**
   * Get past events
   */
  async getPastEvents() {
    return await this.eventRepo.findPastEvents();
  }

  /**
   * Get today's events
   */
  async getTodayEvents() {
    return await this.eventRepo.findTodayEvents();
  }

  /**
   * Get events by date range
   */
  async getEventsByDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new ValidationError('Start date and end date are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid date format');
    }

    if (start > end) {
      throw new ValidationError('Start date must be before end date');
    }

    return await this.eventRepo.findByDateRange(startDate, endDate);
  }

  /**
   * Get events sorted by date
   */
  async getEventsByDate(order = 'desc') {
    if (!['asc', 'desc'].includes(order)) {
      throw new ValidationError('Order must be "asc" or "desc"');
    }

    return await this.eventRepo.findEventsByDate(order);
  }

  /**
   * Get recent events
   */
  async getRecentEvents(limit = 10) {
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    return await this.eventRepo.findRecentEvents(limit);
  }

  /**
   * Get events that need more participants
   */
  async getEventsNeedingParticipants(minParticipants = 4) {
    if (minParticipants < 1) {
      throw new ValidationError('Minimum participants must be at least 1');
    }

    return await this.eventRepo.findEventsNeedingParticipants(minParticipants);
  }

  /**
   * Get event with enriched participant data
   */
  async getEventWithParticipants(eventId) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Get participant details
    const participants = [];
    for (const userId of event.participants) {
      const user = await this.userRepo.findById(userId);
      if (user) {
        participants.push(user);
      }
    }

    return {
      ...event,
      participantDetails: participants
    };
  }

  /**
   * Get overall event statistics
   */
  async getOverallEventStatistics() {
    return await this.eventRepo.getEventStatistics();
  }

  /**
   * Check if event name is available
   */
  async isNameAvailable(name, excludeEventId = null) {
    if (!name || typeof name !== 'string') {
      return false;
    }

    return await this.eventRepo.isNameUnique(name.trim(), excludeEventId);
  }

  /**
   * Validate event data without creating
   */
  validateEventData(eventData) {
    return validateEventData(eventData);
  }

  /**
   * Get events by month
   */
  async getEventsByMonth(year, month) {
    if (!year || !month || year < 2000 || year > 3000 || month < 1 || month > 12) {
      throw new ValidationError('Valid year and month (1-12) are required');
    }

    return await this.eventRepo.findEventsByMonth(year, month);
  }

  /**
   * Get event with full details including costs and balances
   */
  async getEventDetails(eventId) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const event = await this.getEventWithParticipants(eventId);
    const balance = await this.getEventBalance(eventId);
    const statistics = await this.getEventStatistics(eventId);
    const costItems = await this.costItemRepo.findByEvent(eventId);
    const payments = await this.paymentRepo.findByEvent(eventId);

    return {
      event,
      balance,
      statistics,
      costItems,
      payments
    };
  }

  // Private helper methods

  /**
   * Validate that all participants exist in the user database
   */
  async validateParticipantsExist(participantIds) {
    for (const userId of participantIds) {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new ValidationError(`User with ID ${userId} not found`);
      }
    }
  }

  /**
   * Validate that participant updates don't break existing cost items
   */
  async validateParticipantUpdateWithCostItems(newParticipants, existingCostItems) {
    for (const costItem of existingCostItems) {
      // Check if cost item payer is still in participants
      if (!newParticipants.includes(costItem.paidBy)) {
        throw new ValidationError(`Cannot remove participant who paid for "${costItem.description}". Please update the expense first.`);
      }

      // Check if anyone with split allocation is being removed
      const splitParticipants = Object.keys(costItem.splitPercentage).filter(
        userId => costItem.splitPercentage[userId] > 0
      );
      
      for (const userId of splitParticipants) {
        if (!newParticipants.includes(userId)) {
          throw new ValidationError(`Cannot remove participant who has expense allocation for "${costItem.description}". Please update the expense first.`);
        }
      }
    }
  }
}

module.exports = EventService;