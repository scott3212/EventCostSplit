const express = require('express');

/**
 * Create expense template routes
 * @param {ExpenseTemplateController} templateController - Injected controller instance
 * @returns {express.Router} Configured router
 */
function createExpenseTemplateRoutes(templateController) {
  const router = express.Router();

  // GET /api/expense-templates/quick-add - Get quick-add templates (must be before /:id)
  router.get('/quick-add', templateController.getQuickAddTemplates.bind(templateController));

  // GET /api/expense-templates/stats - Get template statistics (must be before /:id)
  router.get('/stats', templateController.getTemplateStats.bind(templateController));

  // PUT /api/expense-templates/reorder - Reorder templates (must be before /:id)
  router.put('/reorder', templateController.reorderTemplates.bind(templateController));

  // GET /api/expense-templates - Get all templates
  router.get('/', templateController.getAllTemplates.bind(templateController));

  // POST /api/expense-templates - Create new template
  router.post('/', templateController.createTemplate.bind(templateController));

  // GET /api/expense-templates/:id - Get template by ID
  router.get('/:id', templateController.getTemplateById.bind(templateController));

  // PUT /api/expense-templates/:id - Update template
  router.put('/:id', templateController.updateTemplate.bind(templateController));

  // DELETE /api/expense-templates/:id - Delete template
  router.delete('/:id', templateController.deleteTemplate.bind(templateController));

  // GET /api/expense-templates/:id/to-expense - Convert template to expense data
  router.get('/:id/to-expense', templateController.templateToExpense.bind(templateController));

  return router;
}

module.exports = createExpenseTemplateRoutes;
