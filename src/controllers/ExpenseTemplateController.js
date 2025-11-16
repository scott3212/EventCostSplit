const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Controller for expense template endpoints
 * Handles HTTP requests for template CRUD operations
 */
class ExpenseTemplateController {
  constructor(templateService) {
    this.templateService = templateService;
  }

  /**
   * Create new expense template
   * POST /api/expense-templates
   */
  async createTemplate(req, res) {
    try {
      const templateData = req.body;
      console.log('📝 Creating template:', JSON.stringify(templateData, null, 2));
      const template = await this.templateService.createTemplate(templateData);
      res.status(201).json({
        success: true,
        data: template,
        message: 'Template created successfully'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        console.warn('⚠️  Template validation failed:', error.message);
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('❌ Unexpected error in createTemplate:', error);
        console.error('Error stack:', error.stack);
        console.error('Template data:', JSON.stringify(req.body, null, 2));
        res.status(500).json({
          success: false,
          error: 'Failed to create template'
        });
      }
    }
  }

  /**
   * Get all expense templates
   * GET /api/expense-templates
   */
  async getAllTemplates(req, res) {
    try {
      const templates = await this.templateService.getAllTemplates();
      res.status(200).json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('❌ Unexpected error in getAllTemplates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve templates'
      });
    }
  }

  /**
   * Get quick-add templates (for quick-add bar)
   * GET /api/expense-templates/quick-add
   */
  async getQuickAddTemplates(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      const templates = await this.templateService.getQuickAddTemplates(limit);
      res.status(200).json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('❌ Unexpected error in getQuickAddTemplates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve quick-add templates'
      });
    }
  }

  /**
   * Get template by ID
   * GET /api/expense-templates/:id
   */
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await this.templateService.getTemplateById(id);
      res.status(200).json({
        success: true,
        data: template
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
        console.error('❌ Unexpected error in getTemplateById:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve template'
        });
      }
    }
  }

  /**
   * Update template
   * PUT /api/expense-templates/:id
   */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const template = await this.templateService.updateTemplate(id, updateData);
      res.status(200).json({
        success: true,
        data: template,
        message: 'Template updated successfully'
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
        console.error('❌ Unexpected error in updateTemplate:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update template'
        });
      }
    }
  }

  /**
   * Delete template
   * DELETE /api/expense-templates/:id
   */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      await this.templateService.deleteTemplate(id);
      res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
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
        console.error('❌ Unexpected error in deleteTemplate:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete template'
        });
      }
    }
  }

  /**
   * Reorder templates (for future drag-to-reorder)
   * PUT /api/expense-templates/reorder
   */
  async reorderTemplates(req, res) {
    try {
      const { orderUpdates } = req.body;
      const templates = await this.templateService.reorderTemplates(orderUpdates);
      res.status(200).json({
        success: true,
        data: templates,
        message: 'Templates reordered successfully'
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
        console.error('❌ Unexpected error in reorderTemplates:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to reorder templates'
        });
      }
    }
  }

  /**
   * Convert template to expense data
   * GET /api/expense-templates/:id/to-expense
   * Query params: eventId (required)
   */
  async templateToExpense(req, res) {
    try {
      const { id } = req.params;
      const { eventId } = req.query;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      // Get event to retrieve participants
      // Note: This requires access to EventService, which we'll inject
      const expenseData = await this.templateService.templateToExpenseData(id, eventId, req.eventParticipants || []);

      res.status(200).json({
        success: true,
        data: expenseData
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
        console.error('❌ Unexpected error in templateToExpense:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to convert template to expense'
        });
      }
    }
  }

  /**
   * Get template statistics
   * GET /api/expense-templates/stats
   */
  async getTemplateStats(req, res) {
    try {
      const stats = await this.templateService.getTemplateStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Unexpected error in getTemplateStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve template statistics'
      });
    }
  }
}

module.exports = ExpenseTemplateController;
