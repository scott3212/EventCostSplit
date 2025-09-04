const EventService = require('../../../src/services/EventService');
const Event = require('../../../src/models/Event');
const { ValidationError, NotFoundError } = require('../../../src/utils/errors');

describe('EventService', () => {
  let eventService;
  let mockEventRepo;
  let mockUserRepo;
  let mockCostItemRepo;
  let mockPaymentRepo;
  let mockCalculationService;

  beforeEach(() => {
    mockEventRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addParticipant: jest.fn(),
      removeParticipant: jest.fn(),
      isParticipant: jest.fn(),
      findByParticipant: jest.fn(),
      searchByName: jest.fn(),
      findUpcomingEvents: jest.fn(),
      findPastEvents: jest.fn(),
      findTodayEvents: jest.fn(),
      findByDateRange: jest.fn(),
      findEventsByDate: jest.fn(),
      findRecentEvents: jest.fn(),
      findEventsNeedingParticipants: jest.fn(),
      getEventStatistics: jest.fn(),
      isNameUnique: jest.fn(),
      findEventsByMonth: jest.fn(),
    };

    mockUserRepo = {
      findById: jest.fn(),
    };

    mockCostItemRepo = {
      findByEvent: jest.fn(),
    };

    mockPaymentRepo = {
      findByEvent: jest.fn(),
    };

    mockCalculationService = {
      calculateEventBalance: jest.fn(),
      getEventStatistics: jest.fn(),
    };

    eventService = new EventService(
      mockEventRepo,
      mockUserRepo,
      mockCostItemRepo,
      mockPaymentRepo,
      mockCalculationService
    );
  });

  describe('createEvent', () => {
    const validEventData = {
      name: 'Saturday Badminton',
      date: '2024-09-14',
      description: 'Weekly badminton session',
      participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789013']
    };

    it('should create an event with valid data', async () => {
      const createdEvent = { id: 'event1', ...validEventData };
      
      mockEventRepo.isNameUnique.mockResolvedValue(true);
      mockUserRepo.findById.mockResolvedValue({ id: '12345678-1234-1234-1234-123456789012', name: 'John' });
      mockEventRepo.create.mockResolvedValue(createdEvent);

      const result = await eventService.createEvent(validEventData);

      expect(mockEventRepo.isNameUnique).toHaveBeenCalledWith('Saturday Badminton');
      expect(mockUserRepo.findById).toHaveBeenCalledTimes(2);
      expect(mockEventRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Saturday Badminton',
        date: expect.any(String),
        participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789013']
      }));
      expect(result).toEqual(createdEvent);
    });

    it('should throw error for invalid event data', async () => {
      const invalidEventData = { name: '' };

      await expect(eventService.createEvent(invalidEventData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error if name is not unique', async () => {
      mockEventRepo.isNameUnique.mockResolvedValue(false);

      await expect(eventService.createEvent(validEventData))
        .rejects.toThrow('An event with this name already exists');
    });

    it('should throw error if participant does not exist', async () => {
      mockEventRepo.isNameUnique.mockResolvedValue(true);
      mockUserRepo.findById.mockResolvedValueOnce({ id: '12345678-1234-1234-1234-123456789012' });
      mockUserRepo.findById.mockResolvedValueOnce(null);

      await expect(eventService.createEvent(validEventData))
        .rejects.toThrow('User with ID 12345678-1234-1234-1234-123456789013 not found');
    });
  });

  describe('getEventById', () => {
    it('should return event if found', async () => {
      const event = { id: 'event1', name: 'Test Event' };
      mockEventRepo.findById.mockResolvedValue(event);

      const result = await eventService.getEventById('event1');

      expect(result).toEqual(event);
      expect(mockEventRepo.findById).toHaveBeenCalledWith('event1');
    });

    it('should throw NotFoundError if event does not exist', async () => {
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(eventService.getEventById('invalid'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if no ID provided', async () => {
      await expect(eventService.getEventById(''))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateEvent', () => {
    const existingEvent = {
      id: 'event1',
      name: 'Test Event',
      participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789013']
    };

    it('should update event with valid data', async () => {
      const updateData = { name: 'Updated Event' };
      const updatedEvent = { ...existingEvent, ...updateData };

      mockEventRepo.findById.mockResolvedValue(existingEvent);
      mockEventRepo.isNameUnique.mockResolvedValue(true);
      mockEventRepo.update.mockResolvedValue(updatedEvent);

      const result = await eventService.updateEvent('event1', updateData);

      expect(mockEventRepo.isNameUnique).toHaveBeenCalledWith('Updated Event', 'event1');
      expect(mockEventRepo.update).toHaveBeenCalledWith('event1', updateData);
      expect(result).toEqual(updatedEvent);
    });

    it('should throw error if event not found', async () => {
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(eventService.updateEvent('invalid', { name: 'Test' }))
        .rejects.toThrow(NotFoundError);
    });

    it('should validate participant updates with cost items', async () => {
      const updateData = { participants: ['12345678-1234-1234-1234-123456789012'] }; // removing user2
      const costItems = [{
        id: 'cost1',
        paidBy: '12345678-1234-1234-1234-123456789013',
        splitPercentage: { '12345678-1234-1234-1234-123456789012': 50, '12345678-1234-1234-1234-123456789013': 50 },
        description: 'Court rental'
      }];

      mockEventRepo.findById.mockResolvedValue(existingEvent);
      mockUserRepo.findById.mockResolvedValue({ id: '12345678-1234-1234-1234-123456789012' });
      mockCostItemRepo.findByEvent.mockResolvedValue(costItems);

      await expect(eventService.updateEvent('event1', updateData))
        .rejects.toThrow('Cannot remove participant who paid for "Court rental"');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event with no cost items or payments', async () => {
      const event = { id: 'event1', name: 'Test Event' };

      mockEventRepo.findById.mockResolvedValue(event);
      mockCostItemRepo.findByEvent.mockResolvedValue([]);
      mockPaymentRepo.findByEvent.mockResolvedValue([]);
      mockEventRepo.delete.mockResolvedValue(true);

      const result = await eventService.deleteEvent('event1');

      expect(mockEventRepo.delete).toHaveBeenCalledWith('event1');
      expect(result).toBe(true);
    });

    it('should throw error if event has cost items', async () => {
      const event = { id: 'event1', name: 'Test Event' };
      const costItems = [{ id: 'cost1' }];

      mockEventRepo.findById.mockResolvedValue(event);
      mockCostItemRepo.findByEvent.mockResolvedValue(costItems);
      mockPaymentRepo.findByEvent.mockResolvedValue([]);

      await expect(eventService.deleteEvent('event1'))
        .rejects.toThrow('Cannot delete event with existing expenses or payments');
    });

    it('should throw error if event not found', async () => {
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(eventService.deleteEvent('invalid'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('addParticipant', () => {
    it('should add participant to event', async () => {
      const event = { id: 'event1', name: 'Test Event', participants: ['12345678-1234-1234-1234-123456789012'] };
      const user = { id: '12345678-1234-1234-1234-123456789013', name: 'Jane' };
      const updatedEvent = { ...event, participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789013'] };

      mockEventRepo.findById.mockResolvedValue(event);
      mockUserRepo.findById.mockResolvedValue(user);
      mockEventRepo.addParticipant.mockResolvedValue(updatedEvent);

      const result = await eventService.addParticipant('event1', '12345678-1234-1234-1234-123456789013');

      expect(mockEventRepo.addParticipant).toHaveBeenCalledWith('event1', '12345678-1234-1234-1234-123456789013');
      expect(result).toEqual(updatedEvent);
    });

    it('should throw error if user not found', async () => {
      const event = { id: 'event1', name: 'Test Event' };

      mockEventRepo.findById.mockResolvedValue(event);
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(eventService.addParticipant('event1', 'invalid'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant with no cost item assignments', async () => {
      const event = { id: 'event1', participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789013'] };
      const updatedEvent = { ...event, participants: ['12345678-1234-1234-1234-123456789012'] };

      mockEventRepo.findById.mockResolvedValue(event);
      mockCostItemRepo.findByEvent.mockResolvedValue([]);
      mockEventRepo.removeParticipant.mockResolvedValue(updatedEvent);

      const result = await eventService.removeParticipant('event1', '12345678-1234-1234-1234-123456789013');

      expect(mockEventRepo.removeParticipant).toHaveBeenCalledWith('event1', '12345678-1234-1234-1234-123456789013');
      expect(result).toEqual(updatedEvent);
    });

    it('should throw error if participant has cost item assignments', async () => {
      const event = { id: 'event1', participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789013'] };
      const costItems = [{
        id: 'cost1',
        paidBy: '12345678-1234-1234-1234-123456789012',
        splitPercentage: { '12345678-1234-1234-1234-123456789012': 50, '12345678-1234-1234-1234-123456789013': 50 }
      }];

      mockEventRepo.findById.mockResolvedValue(event);
      mockCostItemRepo.findByEvent.mockResolvedValue(costItems);

      await expect(eventService.removeParticipant('event1', '12345678-1234-1234-1234-123456789013'))
        .rejects.toThrow('Cannot remove participant who has expenses assigned');
    });
  });

  describe('getEventBalance', () => {
    it('should return event balance', async () => {
      const event = { id: 'event1', name: 'Test Event' };
      const balance = { eventId: 'event1', userBalances: {} };

      mockEventRepo.findById.mockResolvedValue(event);
      mockCalculationService.calculateEventBalance.mockResolvedValue(balance);

      const result = await eventService.getEventBalance('event1');

      expect(result).toEqual(balance);
      expect(mockCalculationService.calculateEventBalance).toHaveBeenCalledWith('event1');
    });

    it('should throw error if event not found', async () => {
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(eventService.getEventBalance('invalid'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('searchEvents', () => {
    it('should return search results', async () => {
      const searchResults = [
        { id: 'event1', name: 'Badminton Session' },
        { id: 'event2', name: 'Badminton Tournament' }
      ];

      mockEventRepo.searchByName.mockResolvedValue(searchResults);

      const result = await eventService.searchEvents('Badminton');

      expect(result).toEqual(searchResults);
      expect(mockEventRepo.searchByName).toHaveBeenCalledWith('Badminton');
    });

    it('should return empty array for empty search term', async () => {
      const result = await eventService.searchEvents('');

      expect(result).toEqual([]);
      expect(mockEventRepo.searchByName).not.toHaveBeenCalled();
    });
  });

  describe('getEventsByDateRange', () => {
    it('should return events in date range', async () => {
      const events = [{ id: 'event1', name: 'Test Event' }];

      mockEventRepo.findByDateRange.mockResolvedValue(events);

      const result = await eventService.getEventsByDateRange('2024-09-01', '2024-09-30');

      expect(result).toEqual(events);
      expect(mockEventRepo.findByDateRange).toHaveBeenCalledWith('2024-09-01', '2024-09-30');
    });

    it('should throw error for invalid date range', async () => {
      await expect(eventService.getEventsByDateRange('2024-09-30', '2024-09-01'))
        .rejects.toThrow('Start date must be before end date');
    });

    it('should throw error for missing dates', async () => {
      await expect(eventService.getEventsByDateRange('', '2024-09-30'))
        .rejects.toThrow('Start date and end date are required');
    });
  });

  describe('getEventWithParticipants', () => {
    it('should return event with participant details', async () => {
      const event = {
        id: 'event1',
        name: 'Test Event',
        participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789013']
      };
      const user1 = { id: '12345678-1234-1234-1234-123456789012', name: 'John' };
      const user2 = { id: '12345678-1234-1234-1234-123456789013', name: 'Jane' };

      mockEventRepo.findById.mockResolvedValue(event);
      mockUserRepo.findById.mockResolvedValueOnce(user1);
      mockUserRepo.findById.mockResolvedValueOnce(user2);

      const result = await eventService.getEventWithParticipants('event1');

      expect(result).toEqual({
        ...event,
        participantDetails: [user1, user2]
      });
    });
  });

  describe('isNameAvailable', () => {
    it('should return true if name is available', async () => {
      mockEventRepo.isNameUnique.mockResolvedValue(true);

      const result = await eventService.isNameAvailable('New Event');

      expect(result).toBe(true);
      expect(mockEventRepo.isNameUnique).toHaveBeenCalledWith('New Event', null);
    });

    it('should return false if name is taken', async () => {
      mockEventRepo.isNameUnique.mockResolvedValue(false);

      const result = await eventService.isNameAvailable('Existing Event');

      expect(result).toBe(false);
    });

    it('should return false for empty name', async () => {
      const result = await eventService.isNameAvailable('');

      expect(result).toBe(false);
      expect(mockEventRepo.isNameUnique).not.toHaveBeenCalled();
    });
  });
});