const express = require('express');
const router = express.Router();

function createCostItemRoutes(costItemController) {
  // Basic CRUD operations
  router.post('/', costItemController.createCostItem.bind(costItemController));
  router.get('/', costItemController.getAllCostItems.bind(costItemController));
  router.get('/:id', costItemController.getCostItemById.bind(costItemController));
  router.put('/:id', costItemController.updateCostItem.bind(costItemController));
  router.delete('/:id', costItemController.deleteCostItem.bind(costItemController));

  // Cost item with calculations
  router.get('/:id/with-balance', costItemController.getCostItemWithBalance.bind(costItemController));
  router.get('/:id/details', costItemController.getCostItemDetails.bind(costItemController));

  // Split management
  router.patch('/:id/split', costItemController.updateSplitPercentage.bind(costItemController));
  router.post('/event/:eventId/equal-split', costItemController.createEqualSplit.bind(costItemController));

  // Filtering by relationships
  router.get('/event/:eventId', costItemController.getCostItemsForEvent.bind(costItemController));
  router.get('/user/:userId/paid-by', costItemController.getCostItemsPaidByUser.bind(costItemController));
  router.get('/user/:userId/participant', costItemController.getCostItemsForParticipant.bind(costItemController));

  // Search and filtering endpoints
  router.get('/search/by-description', costItemController.searchCostItems.bind(costItemController));
  router.get('/search/by-date-range', costItemController.getCostItemsByDateRange.bind(costItemController));
  router.get('/search/by-amount-range', costItemController.getCostItemsByAmountRange.bind(costItemController));

  // Categorization endpoints
  router.get('/filter/expensive', costItemController.getExpensiveCostItems.bind(costItemController));
  router.get('/filter/equal-split', costItemController.getEqualSplitItems.bind(costItemController));
  router.get('/filter/custom-split', costItemController.getCustomSplitItems.bind(costItemController));

  // Analytics and reporting
  router.get('/event/:eventId/statistics', costItemController.getEventCostStatistics.bind(costItemController));
  router.get('/analytics/overview', costItemController.getCostItemAnalytics.bind(costItemController));

  // Utility endpoints
  router.post('/validate', costItemController.validateCostItemData.bind(costItemController));

  return router;
}

module.exports = createCostItemRoutes;