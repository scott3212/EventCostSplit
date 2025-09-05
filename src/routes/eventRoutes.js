const express = require('express');
const router = express.Router();

function createEventRoutes(eventController) {
  // Basic CRUD operations
  router.post('/', eventController.createEvent.bind(eventController));
  router.get('/', eventController.getAllEvents.bind(eventController));
  router.get('/:id', eventController.getEventById.bind(eventController));
  router.put('/:id', eventController.updateEvent.bind(eventController));
  router.delete('/:id', eventController.deleteEvent.bind(eventController));

  // Participant management
  router.post('/:id/participants', eventController.addParticipant.bind(eventController));
  router.delete('/:id/participants/:userId', eventController.removeParticipant.bind(eventController));
  router.get('/:id/participants', eventController.getEventParticipants.bind(eventController));
  router.post('/:id/participants/bulk', eventController.bulkAddParticipants.bind(eventController));

  // Event relationships
  router.get('/:id/cost-items', eventController.getEventCostItems.bind(eventController));
  router.get('/:id/payments', eventController.getEventPayments.bind(eventController));

  // Event analytics and reporting
  router.get('/:id/balance', eventController.getEventBalance.bind(eventController));
  router.get('/:id/summary', eventController.getEventSummary.bind(eventController));
  router.get('/:id/statistics', eventController.getEventStatistics.bind(eventController));
  router.get('/:id/details', eventController.getEventDetails.bind(eventController));

  // Search and filtering endpoints
  router.get('/search/by-name', eventController.searchEvents.bind(eventController));
  router.get('/search/by-date-range', eventController.getEventsByDateRange.bind(eventController));
  router.get('/filter/active', eventController.getActiveEvents.bind(eventController));
  router.get('/filter/completed', eventController.getCompletedEvents.bind(eventController));
  router.get('/filter/recent', eventController.getRecentEvents.bind(eventController));

  // User-specific event queries
  router.get('/user/:userId/participant', eventController.getUserEventsAsParticipant.bind(eventController));
  router.get('/user/:userId/created', eventController.getEventsCreatedByUser.bind(eventController));

  // Analytics endpoints
  router.get('/analytics/overview', eventController.getEventAnalytics.bind(eventController));

  // Utility endpoints
  router.post('/validate', eventController.validateEventData.bind(eventController));

  return router;
}

module.exports = createEventRoutes;