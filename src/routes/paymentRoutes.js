const express = require('express');
const router = express.Router();

function createPaymentRoutes(paymentController) {
  // Basic CRUD operations
  router.post('/', paymentController.createPayment.bind(paymentController));
  router.get('/', paymentController.getAllPayments.bind(paymentController));
  router.get('/:id', paymentController.getPaymentById.bind(paymentController));
  router.put('/:id', paymentController.updatePayment.bind(paymentController));
  router.delete('/:id', paymentController.deletePayment.bind(paymentController));

  // Payment details and enriched data
  router.get('/:id/details', paymentController.getPaymentDetails.bind(paymentController));

  // Filtering by relationships
  router.get('/user/:userId', paymentController.getPaymentsForUser.bind(paymentController));
  router.get('/event/:eventId', paymentController.getPaymentsForEvent.bind(paymentController));

  // Search and filtering endpoints
  router.get('/search/by-description', paymentController.searchPayments.bind(paymentController));
  router.get('/search/by-date-range', paymentController.getPaymentsByDateRange.bind(paymentController));
  router.get('/search/by-amount-range', paymentController.getPaymentsByAmountRange.bind(paymentController));
  router.get('/filter/large', paymentController.getLargePayments.bind(paymentController));
  router.get('/filter/recent', paymentController.getRecentPayments.bind(paymentController));

  // Aggregation endpoints
  router.get('/user/:userId/total', paymentController.getTotalPaidByUser.bind(paymentController));
  router.get('/event/:eventId/total', paymentController.getTotalForEvent.bind(paymentController));
  router.get('/user/:userId/statistics', paymentController.getUserPaymentStatistics.bind(paymentController));

  // Settlement functionality
  router.post('/settlement', paymentController.processSettlement.bind(paymentController));
  router.get('/settlement/suggestions', paymentController.getSettlementSuggestions.bind(paymentController));

  // Bulk operations
  router.post('/bulk', paymentController.bulkCreatePayments.bind(paymentController));

  // Analytics and reporting
  router.get('/analytics/overview', paymentController.getPaymentAnalytics.bind(paymentController));
  router.get('/analytics/statistics', paymentController.getPaymentStatistics.bind(paymentController));

  // Utility endpoints
  router.post('/validate', paymentController.validatePaymentData.bind(paymentController));

  return router;
}

module.exports = createPaymentRoutes;