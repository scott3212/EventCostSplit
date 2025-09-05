const EventController = require('../../../src/controllers/EventController');
const { ValidationError, NotFoundError, BusinessLogicError } = require('../../../src/utils/errors');

describe('EventController', () => {
  let eventController;
  let mockEventService;
  let mockCostItemService;
  let mockPaymentService;
  let req;
  let res;

  beforeEach(() => {
    mockEventService = {
      createEvent: jest.fn(),
      getAllEvents: jest.fn(),
      getEventById: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
      addParticipant: jest.fn(),
      removeParticipant: jest.fn(),
      getEventParticipants: jest.fn(),
      getEventBalance: jest.fn(),
      getEventSummary: jest.fn(),
      getEventStatistics: jest.fn(),
      searchEventsByName: jest.fn(),
      getEventsByDateRange: jest.fn(),
      getActiveEvents: jest.fn(),
      getCompletedEvents: jest.fn(),
      getRecentEvents: jest.fn(),
      getEventsForUser: jest.fn(),
      getEventsCreatedByUser: jest.fn(),
      bulkAddParticipants: jest.fn(),
      validateEventData: jest.fn(),
      getEventDetails: jest.fn(),
      getEventAnalytics: jest.fn()
    };

    mockCostItemService = {
      getCostItemsForEvent: jest.fn()
    };

    mockPaymentService = {
      getPaymentsForEvent: jest.fn()
    };

    eventController = new EventController(
      mockEventService,
      mockCostItemService,
      mockPaymentService
    );

    req = {
      body: {},
      params: {},
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('createEvent', () => {
    test('should create event successfully', async () => {
      const eventData = {
        id: '12345678-1234-1234-1234-123456789012',
        name: 'Badminton Game',
        description: 'Weekly badminton session',
        date: '2024-03-15',
        participants: []
      };
      req.body = eventData;
      mockEventService.createEvent.mockResolvedValue(eventData);

      await eventController.createEvent(req, res);

      expect(mockEventService.createEvent).toHaveBeenCalledWith(eventData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: eventData,
        message: 'Event created successfully'
      });
    });

    test('should return 400 for validation error', async () => {
      req.body = { name: '' };
      mockEventService.createEvent.mockRejectedValue(new ValidationError('Name is required'));

      await eventController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Name is required'
      });
    });

    test('should return 500 for server error', async () => {
      req.body = { name: 'Event' };
      mockEventService.createEvent.mockRejectedValue(new Error('Server error'));

      await eventController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create event'
      });
    });
  });

  describe('getAllEvents', () => {
    test('should get all events successfully', async () => {
      const events = [
        { id: '12345678-1234-1234-1234-123456789012', name: 'Event 1' },
        { id: '12345678-1234-1234-1234-123456789013', name: 'Event 2' }
      ];
      mockEventService.getAllEvents.mockResolvedValue(events);

      await eventController.getAllEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: events,
        count: 2
      });
    });

    test('should return 500 for server error', async () => {
      mockEventService.getAllEvents.mockRejectedValue(new Error('Server error'));

      await eventController.getAllEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve events'
      });
    });
  });

  describe('getEventById', () => {
    test('should get event by id successfully', async () => {
      const event = { id: '12345678-1234-1234-1234-123456789012', name: 'Event 1' };
      req.params.id = event.id;
      mockEventService.getEventById.mockResolvedValue(event);

      await eventController.getEventById(req, res);

      expect(mockEventService.getEventById).toHaveBeenCalledWith(event.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: event
      });
    });

    test('should return 404 for not found error', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockEventService.getEventById.mockRejectedValue(new NotFoundError('Event not found'));

      await eventController.getEventById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Event not found'
      });
    });
  });

  describe('updateEvent', () => {
    test('should update event successfully', async () => {
      const updatedEvent = { id: '12345678-1234-1234-1234-123456789012', name: 'Updated Event' };
      req.params.id = updatedEvent.id;
      req.body = { name: 'Updated Event' };
      mockEventService.updateEvent.mockResolvedValue(updatedEvent);

      await eventController.updateEvent(req, res);

      expect(mockEventService.updateEvent).toHaveBeenCalledWith(updatedEvent.id, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedEvent,
        message: 'Event updated successfully'
      });
    });
  });

  describe('deleteEvent', () => {
    test('should delete event successfully', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockEventService.deleteEvent.mockResolvedValue(true);

      await eventController.deleteEvent(req, res);

      expect(mockEventService.deleteEvent).toHaveBeenCalledWith(req.params.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Event deleted successfully'
      });
    });

    test('should return 422 for business logic error', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockEventService.deleteEvent.mockRejectedValue(
        new BusinessLogicError('Cannot delete event with existing cost items')
      );

      await eventController.deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete event with existing cost items'
      });
    });
  });

  describe('addParticipant', () => {
    test('should add participant successfully', async () => {
      const event = { id: '12345678-1234-1234-1234-123456789012', participants: ['12345678-1234-1234-1234-123456789013'] };
      req.params.id = event.id;
      req.body = { userId: '12345678-1234-1234-1234-123456789013' };
      mockEventService.addParticipant.mockResolvedValue(event);

      await eventController.addParticipant(req, res);

      expect(mockEventService.addParticipant).toHaveBeenCalledWith(event.id, '12345678-1234-1234-1234-123456789013');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: event,
        message: 'Participant added successfully'
      });
    });

    test('should return 400 if userId is missing', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      req.body = {};

      await eventController.addParticipant(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required'
      });
    });
  });

  describe('removeParticipant', () => {
    test('should remove participant successfully', async () => {
      const event = { id: '12345678-1234-1234-1234-123456789012', participants: [] };
      req.params = { id: event.id, userId: '12345678-1234-1234-1234-123456789013' };
      mockEventService.removeParticipant.mockResolvedValue(event);

      await eventController.removeParticipant(req, res);

      expect(mockEventService.removeParticipant).toHaveBeenCalledWith(event.id, '12345678-1234-1234-1234-123456789013');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getEventParticipants', () => {
    test('should get event participants successfully', async () => {
      const participants = [
        { id: '12345678-1234-1234-1234-123456789012', name: 'User 1' },
        { id: '12345678-1234-1234-1234-123456789013', name: 'User 2' }
      ];
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockEventService.getEventParticipants.mockResolvedValue(participants);

      await eventController.getEventParticipants(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: participants,
        count: 2
      });
    });
  });

  describe('getEventCostItems', () => {
    test('should get event cost items successfully', async () => {
      const costItems = [
        { id: '12345678-1234-1234-1234-123456789012', description: 'Court rental' },
        { id: '12345678-1234-1234-1234-123456789013', description: 'Shuttlecocks' }
      ];
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockCostItemService.getCostItemsForEvent.mockResolvedValue(costItems);

      await eventController.getEventCostItems(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: costItems,
        count: 2
      });
    });
  });

  describe('getEventPayments', () => {
    test('should get event payments successfully', async () => {
      const payments = [
        { id: '12345678-1234-1234-1234-123456789012', amount: 50 },
        { id: '12345678-1234-1234-1234-123456789013', amount: 75 }
      ];
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockPaymentService.getPaymentsForEvent.mockResolvedValue(payments);

      await eventController.getEventPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: payments,
        count: 2
      });
    });
  });

  describe('getEventBalance', () => {
    test('should get event balance successfully', async () => {
      const balance = {
        totalCosts: 100,
        totalPayments: 80,
        outstanding: 20
      };
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockEventService.getEventBalance.mockResolvedValue(balance);

      await eventController.getEventBalance(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: balance
      });
    });
  });

  describe('getEventSummary', () => {
    test('should get event summary successfully', async () => {
      const summary = {
        event: { id: '12345678-1234-1234-1234-123456789012', name: 'Event 1' },
        participants: 4,
        totalCosts: 100,
        costItems: 3
      };
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockEventService.getEventSummary.mockResolvedValue(summary);

      await eventController.getEventSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: summary
      });
    });
  });

  describe('getEventStatistics', () => {
    test('should get event statistics successfully', async () => {
      const statistics = {
        participantCount: 4,
        averageCostPerParticipant: 25,
        totalExpenses: 100
      };
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockEventService.getEventStatistics.mockResolvedValue(statistics);

      await eventController.getEventStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: statistics
      });
    });
  });

  describe('searchEvents', () => {
    test('should search events successfully', async () => {
      const events = [
        { id: '12345678-1234-1234-1234-123456789012', name: 'Badminton Game' }
      ];
      req.query.name = 'Badminton';
      mockEventService.searchEventsByName.mockResolvedValue(events);

      await eventController.searchEvents(req, res);

      expect(mockEventService.searchEventsByName).toHaveBeenCalledWith('Badminton');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: events,
        count: 1
      });
    });

    test('should return 400 if name parameter is missing', async () => {
      req.query = {};

      await eventController.searchEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Name parameter is required for search'
      });
    });
  });

  describe('getEventsByDateRange', () => {
    test('should get events by date range successfully', async () => {
      const events = [
        { id: '12345678-1234-1234-1234-123456789012', date: '2024-03-15' }
      ];
      req.query = { startDate: '2024-03-01', endDate: '2024-03-31' };
      mockEventService.getEventsByDateRange.mockResolvedValue(events);

      await eventController.getEventsByDateRange(req, res);

      expect(mockEventService.getEventsByDateRange).toHaveBeenCalledWith('2024-03-01', '2024-03-31');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 if date parameters are missing', async () => {
      req.query = { startDate: '2024-03-01' };

      await eventController.getEventsByDateRange(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Start date and end date are required'
      });
    });
  });

  describe('getActiveEvents', () => {
    test('should get active events successfully', async () => {
      const events = [
        { id: '12345678-1234-1234-1234-123456789012', status: 'active' }
      ];
      mockEventService.getActiveEvents.mockResolvedValue(events);

      await eventController.getActiveEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: events,
        count: 1
      });
    });
  });

  describe('getCompletedEvents', () => {
    test('should get completed events successfully', async () => {
      const events = [
        { id: '12345678-1234-1234-1234-123456789012', status: 'completed' }
      ];
      mockEventService.getCompletedEvents.mockResolvedValue(events);

      await eventController.getCompletedEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: events,
        count: 1
      });
    });
  });

  describe('getRecentEvents', () => {
    test('should get recent events successfully', async () => {
      const events = [
        { id: '12345678-1234-1234-1234-123456789012', createdAt: '2024-03-15' }
      ];
      req.query.limit = '10';
      mockEventService.getRecentEvents.mockResolvedValue(events);

      await eventController.getRecentEvents(req, res);

      expect(mockEventService.getRecentEvents).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should use default limit when not provided', async () => {
      const events = [];
      mockEventService.getRecentEvents.mockResolvedValue(events);

      await eventController.getRecentEvents(req, res);

      expect(mockEventService.getRecentEvents).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getUserEventsAsParticipant', () => {
    test('should get user events as participant successfully', async () => {
      const events = [
        { id: '12345678-1234-1234-1234-123456789012', name: 'Event 1' }
      ];
      req.params.userId = '12345678-1234-1234-1234-123456789013';
      mockEventService.getEventsForUser.mockResolvedValue(events);

      await eventController.getUserEventsAsParticipant(req, res);

      expect(mockEventService.getEventsForUser).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789013');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getEventsCreatedByUser', () => {
    test('should get events created by user successfully', async () => {
      const events = [
        { id: '12345678-1234-1234-1234-123456789012', createdBy: '12345678-1234-1234-1234-123456789013' }
      ];
      req.params.userId = '12345678-1234-1234-1234-123456789013';
      mockEventService.getEventsCreatedByUser.mockResolvedValue(events);

      await eventController.getEventsCreatedByUser(req, res);

      expect(mockEventService.getEventsCreatedByUser).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789013');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('bulkAddParticipants', () => {
    test('should bulk add participants successfully', async () => {
      const result = {
        successful: ['12345678-1234-1234-1234-123456789013'],
        failed: []
      };
      req.params.id = '12345678-1234-1234-1234-123456789012';
      req.body = { userIds: ['12345678-1234-1234-1234-123456789013'] };
      mockEventService.bulkAddParticipants.mockResolvedValue(result);

      await eventController.bulkAddParticipants(req, res);

      expect(mockEventService.bulkAddParticipants).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        ['12345678-1234-1234-1234-123456789013']
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 if userIds is not provided or empty', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      req.body = { userIds: [] };

      await eventController.bulkAddParticipants(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User IDs array is required'
      });
    });
  });

  describe('validateEventData', () => {
    test('should validate event data successfully', async () => {
      const eventData = { name: 'Event', date: '2024-03-15' };
      const validation = { isValid: true, errors: [] };
      req.body = eventData;
      mockEventService.validateEventData.mockReturnValue(validation);

      await eventController.validateEventData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: validation
      });
    });
  });

  describe('getEventDetails', () => {
    test('should get event details successfully', async () => {
      const details = {
        event: { id: '12345678-1234-1234-1234-123456789012', name: 'Event' },
        participants: [],
        costItems: [],
        balance: {}
      };
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockEventService.getEventDetails.mockResolvedValue(details);

      await eventController.getEventDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: details
      });
    });
  });

  describe('getEventAnalytics', () => {
    test('should get event analytics successfully', async () => {
      const analytics = {
        totalEvents: 10,
        activeEvents: 5,
        completedEvents: 5
      };
      mockEventService.getEventAnalytics.mockResolvedValue(analytics);

      await eventController.getEventAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: analytics
      });
    });
  });
});