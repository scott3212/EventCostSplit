const BaseRepository = require('./BaseRepository');
const ExpenseTemplate = require('../models/ExpenseTemplate');

/**
 * Repository for managing expense templates
 * Handles CRUD operations for reusable expense templates
 */
class ExpenseTemplateRepository extends BaseRepository {
  constructor() {
    super('expense_templates.json');
  }

  /**
   * Create new template with auto-generated order
   * @override
   */
  async create(data) {
    // Auto-assign order if not provided
    if (!data.order && data.order !== 0) {
      const existingTemplates = await this.findAll();
      data.order = ExpenseTemplate.getNextOrder(existingTemplates);
    }

    const template = new ExpenseTemplate(data);
    const created = await super.create(template.toJSON());

    return new ExpenseTemplate(created);
  }

  /**
   * Update existing template
   * @override
   */
  async update(id, updates) {
    // Validate update data
    const validUpdates = ExpenseTemplate.validateUpdate(updates);

    // If updating to a new template, validate it
    if (Object.keys(validUpdates).length > 0) {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      // Merge and validate
      const merged = { ...existing, ...validUpdates };
      new ExpenseTemplate(merged); // Validate merged data
    }

    const updated = await super.update(id, validUpdates);
    return updated ? new ExpenseTemplate(updated) : null;
  }

  /**
   * Find template by ID and return as ExpenseTemplate instance
   * @override
   */
  async findById(id) {
    const data = await super.findById(id);
    return data ? new ExpenseTemplate(data) : null;
  }

  /**
   * Find all templates, ordered by 'order' field
   * @override
   */
  async findAll() {
    const data = await super.findAll();
    const templates = data.map(item => new ExpenseTemplate(item));

    // Sort by order field (ascending)
    templates.sort((a, b) => a.order - b.order);

    return templates;
  }

  /**
   * Find templates by category (for future Phase 2)
   */
  async findByCategory(category) {
    const templates = await this.findAll();
    return templates.filter(t => t.category === category);
  }

  /**
   * Reorder templates (for future drag-to-reorder feature)
   * Takes array of {id, order} objects
   */
  async reorder(orderUpdates) {
    const allData = await this.loadData();

    // Create a map of id -> new order
    const orderMap = new Map(orderUpdates.map(item => [item.id, item.order]));

    // Update order for affected templates
    const updated = allData.map(template => {
      if (orderMap.has(template.id)) {
        return {
          ...template,
          order: orderMap.get(template.id),
          updatedAt: new Date().toISOString(),
        };
      }
      return template;
    });

    await this.saveData(updated);

    // Return updated templates sorted by order
    return this.findAll();
  }

  /**
   * Check if template name already exists (case-insensitive)
   * Useful for preventing duplicates
   */
  async nameExists(name, excludeId = null) {
    const templates = await this.findAll();
    const normalizedName = name.toLowerCase().trim();

    return templates.some(t =>
      t.name.toLowerCase().trim() === normalizedName &&
      t.id !== excludeId
    );
  }

  /**
   * Get templates visible in quick-add bar (first N templates by order)
   */
  async getQuickAddTemplates(limit = 6) {
    const allTemplates = await this.findAll(); // Already sorted by order
    return allTemplates.slice(0, limit);
  }
}

module.exports = ExpenseTemplateRepository;
