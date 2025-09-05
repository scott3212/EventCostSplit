const express = require('express');
const router = express.Router();

function createUserRoutes(userController) {
  // Basic CRUD operations
  router.post('/', userController.createUser.bind(userController));
  router.get('/', userController.getAllUsers.bind(userController));
  router.get('/:id', userController.getUserById.bind(userController));
  router.put('/:id', userController.updateUser.bind(userController));
  router.delete('/:id', userController.deleteUser.bind(userController));

  // Balance operations
  router.get('/:id/balance', userController.getUserBalance.bind(userController));
  router.put('/:id/balance', userController.updateUserBalance.bind(userController));
  router.patch('/:id/balance/adjust', userController.adjustUserBalance.bind(userController));
  router.get('/:id/balance/breakdown', userController.getUserBalanceBreakdown.bind(userController));

  // User relationships
  router.get('/:id/events', userController.getUserEvents.bind(userController));
  router.get('/:id/payments', userController.getUserPayments.bind(userController));
  router.get('/:id/cost-items', userController.getUserCostItems.bind(userController));

  // User statistics and analytics
  router.get('/:id/statistics', userController.getUserStatistics.bind(userController));

  // Search and filtering endpoints
  router.get('/search/by-name', userController.findUsersByName.bind(userController));
  router.get('/search/by-email', userController.findUsersByEmail.bind(userController));
  router.get('/filter/active', userController.getActiveUsers.bind(userController));
  router.get('/filter/with-debt', userController.getUsersWithDebt.bind(userController));
  router.get('/filter/with-credit', userController.getUsersWithCredit.bind(userController));

  // Utility endpoints
  router.post('/validate', userController.validateUserData.bind(userController));

  return router;
}

module.exports = createUserRoutes;