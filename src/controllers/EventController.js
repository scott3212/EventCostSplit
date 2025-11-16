const { ValidationError, NotFoundError, BusinessLogicError } = require('../utils/errors');

class EventController {
  constructor(eventService, costItemService, paymentService) {
    this.eventService = eventService;
    this.costItemService = costItemService;
    this.paymentService = paymentService;
  }

  async createEvent(req, res) {
    try {
      const eventData = req.body;
      const event = await this.eventService.createEvent(eventData);
      res.status(201).json({
        success: true,
        data: event,
        message: 'Event created successfully'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create event',
          details: error.message
        });
      }
    }
  }

  async getAllEvents(req, res) {
    try {
      const events = await this.eventService.getAllEvents();
      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve events'
      });
    }
  }

  async getEventById(req, res) {
    try {
      const { id } = req.params;
      const event = await this.eventService.getEventById(id);
      res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve event'
        });
      }
    }
  }

  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const event = await this.eventService.updateEvent(id, updateData);
      res.status(200).json({
        success: true,
        data: event,
        message: 'Event updated successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('❌ Unexpected error in updateEvent:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update event'
        });
      }
    }
  }

  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      await this.eventService.deleteEvent(id);
      res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof BusinessLogicError) {
        res.status(422).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete event'
        });
      }
    }
  }

  async addParticipant(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const event = await this.eventService.addParticipant(id, userId);
      res.status(200).json({
        success: true,
        data: event,
        message: 'Participant added successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError || error instanceof BusinessLogicError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to add participant'
        });
      }
    }
  }

  async removeParticipant(req, res) {
    try {
      const { id, userId } = req.params;
      const event = await this.eventService.removeParticipant(id, userId);
      res.status(200).json({
        success: true,
        data: event,
        message: 'Participant removed successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError || error instanceof BusinessLogicError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to remove participant'
        });
      }
    }
  }

  async getEventParticipants(req, res) {
    try {
      const { id } = req.params;
      const participants = await this.eventService.getEventParticipants(id);
      res.status(200).json({
        success: true,
        data: participants,
        count: participants.length
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve event participants'
        });
      }
    }
  }

  async getEventCostItems(req, res) {
    try {
      const { id } = req.params;
      const costItems = await this.costItemService.getCostItemsForEvent(id);
      res.status(200).json({
        success: true,
        data: costItems,
        count: costItems.length
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve event cost items'
        });
      }
    }
  }

  async getEventPayments(req, res) {
    try {
      const { id } = req.params;
      const payments = await this.paymentService.getPaymentsForEvent(id);
      res.status(200).json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve event payments'
        });
      }
    }
  }

  async getEventBalance(req, res) {
    try {
      const { id } = req.params;
      const balance = await this.eventService.getEventBalance(id);
      res.status(200).json({
        success: true,
        data: balance
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve event balance'
        });
      }
    }
  }

  async getEventSummary(req, res) {
    try {
      const { id } = req.params;
      const summary = await this.eventService.getEventSummary(id);
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve event summary'
        });
      }
    }
  }

  async getEventStatistics(req, res) {
    try {
      const { id } = req.params;
      const statistics = await this.eventService.getEventStatistics(id);
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve event statistics'
        });
      }
    }
  }

  async searchEvents(req, res) {
    try {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name parameter is required for search'
        });
      }

      const events = await this.eventService.searchEventsByName(name);
      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to search events'
      });
    }
  }

  async getEventsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Start date and end date are required'
        });
      }

      const events = await this.eventService.getEventsByDateRange(startDate, endDate);
      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve events by date range'
        });
      }
    }
  }

  async getActiveEvents(req, res) {
    try {
      const events = await this.eventService.getActiveEvents();
      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve active events'
      });
    }
  }

  async getCompletedEvents(req, res) {
    try {
      const events = await this.eventService.getCompletedEvents();
      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve completed events'
      });
    }
  }

  async getRecentEvents(req, res) {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit) : undefined;
      const events = await this.eventService.getRecentEvents(limitNum);
      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve recent events'
        });
      }
    }
  }

  async getUserEventsAsParticipant(req, res) {
    try {
      const { userId } = req.params;
      const events = await this.eventService.getEventsForUser(userId);
      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve user events'
        });
      }
    }
  }

  async getEventsCreatedByUser(req, res) {
    try {
      const { userId } = req.params;
      const events = await this.eventService.getEventsCreatedByUser(userId);
      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve events created by user'
        });
      }
    }
  }

  async bulkAddParticipants(req, res) {
    try {
      const { id } = req.params;
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'User IDs array is required'
        });
      }

      const result = await this.eventService.bulkAddParticipants(id, userIds);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Participants added successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError || error instanceof BusinessLogicError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to add participants'
        });
      }
    }
  }

  async validateEventData(req, res) {
    try {
      const eventData = req.body;
      const validation = this.eventService.validateEventData(eventData);
      res.status(200).json({
        success: true,
        data: validation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to validate event data'
      });
    }
  }

  async getEventDetails(req, res) {
    try {
      const { id } = req.params;
      const details = await this.eventService.getEventDetails(id);
      res.status(200).json({
        success: true,
        data: details
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve event details'
        });
      }
    }
  }

  async getEventAnalytics(req, res) {
    try {
      const analytics = await this.eventService.getEventAnalytics();
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve event analytics'
      });
    }
  }
}

module.exports = EventController;