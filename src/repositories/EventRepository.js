const BaseRepository = require('./BaseRepository');
const { DATA_FILES } = require('../config/constants');

/**
 * Event repository for event-specific data operations
 * Extends BaseRepository with event-specific methods
 */
class EventRepository extends BaseRepository {
  constructor() {
    super(DATA_FILES.EVENTS);
  }

  /**
   * Find events by participant user ID
   */
  async findByParticipant(userId) {
    if (!userId) return [];
    
    return await this.findBy({
      participants: (participants) => participants && participants.includes(userId)
    });
  }

  /**
   * Find events by date range
   */
  async findByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return await this.findBy({
      date: (eventDate) => {
        const date = new Date(eventDate);
        return date >= start && date <= end;
      }
    });
  }

  /**
   * Find events on a specific date
   */
  async findByDate(date) {
    const targetDate = new Date(date).toDateString();
    
    return await this.findBy({
      date: (eventDate) => new Date(eventDate).toDateString() === targetDate
    });
  }

  /**
   * Find upcoming events (future dates)
   */
  async findUpcomingEvents() {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    return await this.findBy({
      date: (eventDate) => new Date(eventDate) >= now
    });
  }

  /**
   * Find past events (previous dates)
   */
  async findPastEvents() {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    return await this.findBy({
      date: (eventDate) => new Date(eventDate) < now
    });
  }

  /**
   * Find events happening today
   */
  async findTodayEvents() {
    const today = new Date().toDateString();
    
    return await this.findBy({
      date: (eventDate) => new Date(eventDate).toDateString() === today
    });
  }

  /**
   * Find events with specific number of participants
   */
  async findByParticipantCount(count) {
    return await this.findBy({
      participants: (participants) => participants && participants.length === count
    });
  }

  /**
   * Find events with participant count in range
   */
  async findByParticipantCountRange(minCount, maxCount) {
    return await this.findBy({
      participants: (participants) => {
        if (!participants) return false;
        const count = participants.length;
        return count >= minCount && count <= maxCount;
      }
    });
  }

  /**
   * Add participant to event
   */
  async addParticipant(eventId, userId) {
    const event = await this.findById(eventId);
    if (!event) return null;
    
    // Check if already a participant
    if (event.participants.includes(userId)) {
      return event; // Already a participant
    }
    
    const updatedParticipants = [...event.participants, userId];
    return await this.update(eventId, { participants: updatedParticipants });
  }

  /**
   * Remove participant from event
   */
  async removeParticipant(eventId, userId) {
    const event = await this.findById(eventId);
    if (!event) return null;
    
    const updatedParticipants = event.participants.filter(id => id !== userId);
    return await this.update(eventId, { participants: updatedParticipants });
  }

  /**
   * Check if user is participant in event
   */
  async isParticipant(eventId, userId) {
    const event = await this.findById(eventId);
    if (!event) return false;
    
    return event.participants.includes(userId);
  }

  /**
   * Get events sorted by date
   */
  async findEventsByDate(order = 'desc') {
    const events = await this.findAll();
    
    return events.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }

  /**
   * Get recently created events
   */
  async findRecentEvents(limit = 10) {
    const events = await this.findAll();
    
    return events
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Search events by name (partial match)
   */
  async searchByName(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') return [];
    
    const normalizedSearch = searchTerm.trim().toLowerCase();
    
    return await this.findBy({
      name: (name) => name.toLowerCase().includes(normalizedSearch)
    });
  }

  /**
   * Get event statistics
   */
  async getEventStatistics() {
    const events = await this.findAll();
    
    if (events.length === 0) {
      return {
        totalEvents: 0,
        upcomingEvents: 0,
        pastEvents: 0,
        todayEvents: 0,
        averageParticipants: 0,
        totalParticipants: 0,
        mostPopularEventSize: 0,
      };
    }

    const now = new Date();
    const today = now.toDateString();
    now.setHours(0, 0, 0, 0);

    let upcomingCount = 0;
    let pastCount = 0;
    let todayCount = 0;
    let totalParticipants = 0;
    const participantCounts = {};

    events.forEach(event => {
      const eventDate = new Date(event.date);
      const eventDateString = eventDate.toDateString();
      
      if (eventDateString === today) {
        todayCount++;
      } else if (eventDate >= now) {
        upcomingCount++;
      } else {
        pastCount++;
      }

      const participantCount = event.participants.length;
      totalParticipants += participantCount;
      participantCounts[participantCount] = (participantCounts[participantCount] || 0) + 1;
    });

    // Find most common participant count
    const mostPopularSize = Object.entries(participantCounts)
      .reduce((max, [size, count]) => 
        count > max.count ? { size: parseInt(size), count } : max, 
        { size: 0, count: 0 }
      ).size;

    return {
      totalEvents: events.length,
      upcomingEvents: upcomingCount,
      pastEvents: pastCount,
      todayEvents: todayCount,
      averageParticipants: Math.round((totalParticipants / events.length) * 100) / 100,
      totalParticipants: totalParticipants,
      mostPopularEventSize: mostPopularSize,
    };
  }

  /**
   * Get events that need participants (less than minimum threshold)
   */
  async findEventsNeedingParticipants(minParticipants = 4) {
    return await this.findBy({
      participants: (participants) => participants && participants.length < minParticipants
    });
  }

  /**
   * Get events by month
   */
  async findEventsByMonth(year, month) {
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed
    const endDate = new Date(year, month, 0); // Last day of the month
    
    return await this.findByDateRange(startDate, endDate);
  }

  /**
   * Check if event name is unique
   */
  async isNameUnique(name, excludeEventId = null) {
    if (!name || typeof name !== 'string') return false;
    
    const normalizedName = name.trim().toLowerCase();
    const events = await this.findAll();
    
    return !events.some(event => 
      event.id !== excludeEventId && 
      event.name.toLowerCase() === normalizedName
    );
  }
}

module.exports = EventRepository;