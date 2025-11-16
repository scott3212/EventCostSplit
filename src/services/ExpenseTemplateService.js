const ExpenseTemplate = require('../models/ExpenseTemplate');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Service for expense template business logic
 * Handles template CRUD operations, validation, and template-to-expense conversion
 */
class ExpenseTemplateService {
  constructor(templateRepository, userRepository) {
    this.templateRepo = templateRepository;
    this.userRepo = userRepository;
  }

  /**
   * Create a new expense template
   */
  async createTemplate(templateData) {
    // Validate default payer exists if provided
    if (templateData.defaultPaidBy) {
      await this.validateUserExists(templateData.defaultPaidBy);
    }

    // Check for duplicate template names (optional warning, not blocking)
    const nameExists = await this.templateRepo.nameExists(templateData.name);
    if (nameExists) {
      // Note: We don't block creation, just log it
      // In future, we could return a warning flag
      console.warn(`Template with name "${templateData.name}" already exists`);
    }

    // Create template model (validation happens in constructor)
    const template = new ExpenseTemplate(templateData);

    // Save to repository
    return await this.templateRepo.create(template.toJSON());
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId) {
    if (!templateId) {
      throw new ValidationError('Template ID is required');
    }

    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return template;
  }

  /**
   * Get all templates (ordered by display order)
   */
  async getAllTemplates() {
    return await this.templateRepo.findAll();
  }

  /**
   * Get templates for quick-add bar (first N templates)
   */
  async getQuickAddTemplates(limit = 6) {
    return await this.templateRepo.getQuickAddTemplates(limit);
  }

  /**
   * Get templates by category (for future Phase 2)
   */
  async getTemplatesByCategory(category) {
    if (!category) {
      throw new ValidationError('Category is required');
    }

    return await this.templateRepo.findByCategory(category);
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, updateData) {
    if (!templateId) {
      throw new ValidationError('Template ID is required');
    }

    // Check if template exists
    const existingTemplate = await this.templateRepo.findById(templateId);
    if (!existingTemplate) {
      throw new NotFoundError('Template not found');
    }

    // Validate default payer exists if being updated
    if (updateData.defaultPaidBy !== undefined && updateData.defaultPaidBy !== null && updateData.defaultPaidBy !== '') {
      await this.validateUserExists(updateData.defaultPaidBy);
    }

    // Check name uniqueness if name is being updated
    if (updateData.name && updateData.name !== existingTemplate.name) {
      const nameExists = await this.templateRepo.nameExists(updateData.name, templateId);
      if (nameExists) {
        console.warn(`Another template with name "${updateData.name}" already exists`);
      }
    }

    // Update template
    const updated = await this.templateRepo.update(templateId, updateData);
    return updated;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId) {
    if (!templateId) {
      throw new ValidationError('Template ID is required');
    }

    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return await this.templateRepo.delete(templateId);
  }

  /**
   * Reorder templates (for future drag-to-reorder feature)
   */
  async reorderTemplates(orderUpdates) {
    if (!Array.isArray(orderUpdates) || orderUpdates.length === 0) {
      throw new ValidationError('Order updates must be a non-empty array');
    }

    // Validate each update has id and order
    for (const update of orderUpdates) {
      if (!update.id || typeof update.order !== 'number') {
        throw new ValidationError('Each order update must have id and order fields');
      }

      // Verify template exists
      const exists = await this.templateRepo.exists(update.id);
      if (!exists) {
        throw new NotFoundError(`Template with id ${update.id} not found`);
      }
    }

    return await this.templateRepo.reorder(orderUpdates);
  }

  /**
   * Convert template to expense data for a specific event
   * This is used when user clicks a template to create an expense
   */
  async templateToExpenseData(templateId, eventId, eventParticipants = []) {
    if (!templateId) {
      throw new ValidationError('Template ID is required');
    }

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const template = await this.getTemplateById(templateId);

    // Validate default payer is in event participants (if set)
    let defaultPaidBy = template.defaultPaidBy;
    if (defaultPaidBy && !eventParticipants.includes(defaultPaidBy)) {
      // Clear default payer if they're not in this event
      defaultPaidBy = null;
      console.warn(`Template default payer not in event participants, clearing selection`);
    }

    // Generate expense data from template
    return {
      eventId: eventId,
      description: template.name,
      amount: template.defaultAmount,
      paidBy: defaultPaidBy || '', // Empty string if not set
      date: new Date().toISOString(),
      splitShares: this.generateEqualShares(eventParticipants),
      splitMode: 'shares',
      _fromTemplate: templateId, // Track origin for analytics (optional)
    };
  }

  /**
   * Generate equal shares for participants
   * @private
   */
  generateEqualShares(participantIds) {
    if (!participantIds || participantIds.length === 0) {
      return {};
    }

    const splitShares = {};
    participantIds.forEach(userId => {
      splitShares[userId] = 1; // 1 share each for equal split
    });

    return splitShares;
  }

  /**
   * Validate that a user exists
   * @private
   */
  async validateUserExists(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ValidationError(`User with ID ${userId} does not exist`);
    }
    return true;
  }

  /**
   * Get template statistics (for analytics)
   * Returns counts by category, total templates, etc.
   */
  async getTemplateStats() {
    const allTemplates = await this.getAllTemplates();

    const stats = {
      total: allTemplates.length,
      withDefaultPayer: allTemplates.filter(t => t.defaultPaidBy).length,
      withoutDefaultPayer: allTemplates.filter(t => !t.defaultPaidBy).length,
      categorized: allTemplates.filter(t => t.category).length,
      uncategorized: allTemplates.filter(t => !t.category).length,
    };

    // Group by category (for Phase 2)
    const byCategory = {};
    allTemplates.forEach(template => {
      const cat = template.category || 'Uncategorized';
      if (!byCategory[cat]) {
        byCategory[cat] = [];
      }
      byCategory[cat].push(template);
    });
    stats.byCategory = byCategory;

    return stats;
  }
}

module.exports = ExpenseTemplateService;
