const CostItem = require('../models/CostItem');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { validateCostItemData, validateCostItemUpdate } = require('../utils/validators');

/**
 * Service for cost item-related business logic
 * Handles expense CRUD operations, split calculations, and cost analysis
 */
class CostItemService {
  constructor(costItemRepository, eventRepository, userRepository, calculationService) {
    this.costItemRepo = costItemRepository;
    this.eventRepo = eventRepository;
    this.userRepo = userRepository;
    this.calculationService = calculationService;
  }

  /**
   * Create a new cost item
   */
  async createCostItem(costItemData) {
    // Validate input data
    const validation = validateCostItemData(costItemData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Validate event exists
    const event = await this.eventRepo.findById(costItemData.eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Validate paidBy user exists and is participant
    const paidByUser = await this.userRepo.findById(costItemData.paidBy);
    if (!paidByUser) {
      throw new NotFoundError('User who paid not found');
    }

    if (!event.participants.includes(costItemData.paidBy)) {
      throw new ValidationError('User who paid must be a participant in the event');
    }

    // Validate split percentages and participants
    const splitParticipants = Object.keys(costItemData.splitPercentage);
    for (const userId of splitParticipants) {
      if (!event.participants.includes(userId)) {
        throw new ValidationError(`User ${userId} in split is not a participant in the event`);
      }
    }

    // Validate split percentages sum to 100%
    this.calculationService.validateSplitPercentages(costItemData.splitPercentage);

    // Create cost item model
    const costItem = new CostItem(costItemData);
    
    // Save to repository
    return await this.costItemRepo.create(costItem.toJSON());
  }

  /**
   * Get cost item by ID
   */
  async getCostItemById(costItemId) {
    if (!costItemId) {
      throw new ValidationError('Cost item ID is required');
    }

    const costItem = await this.costItemRepo.findById(costItemId);
    if (!costItem) {
      throw new NotFoundError('Cost item not found');
    }

    return costItem;
  }

  /**
   * Get all cost items
   */
  async getAllCostItems() {
    return await this.costItemRepo.findAll();
  }

  /**
   * Update cost item
   */
  async updateCostItem(costItemId, updateData) {
    if (!costItemId) {
      throw new ValidationError('Cost item ID is required');
    }

    // Validate update data
    const validation = validateCostItemUpdate(updateData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Check if cost item exists
    const existingCostItem = await this.costItemRepo.findById(costItemId);
    if (!existingCostItem) {
      throw new NotFoundError('Cost item not found');
    }

    // Get event for validation
    const event = await this.eventRepo.findById(existingCostItem.eventId);
    if (!event) {
      throw new NotFoundError('Associated event not found');
    }

    // Validate paidBy if being updated
    if (updateData.paidBy) {
      const paidByUser = await this.userRepo.findById(updateData.paidBy);
      if (!paidByUser) {
        throw new NotFoundError('User who paid not found');
      }

      if (!event.participants.includes(updateData.paidBy)) {
        throw new ValidationError('User who paid must be a participant in the event');
      }
    }

    // Validate split percentages if being updated
    if (updateData.splitPercentage) {
      const splitParticipants = Object.keys(updateData.splitPercentage);
      for (const userId of splitParticipants) {
        if (!event.participants.includes(userId)) {
          throw new ValidationError(`User ${userId} in split is not a participant in the event`);
        }
      }
      
      this.calculationService.validateSplitPercentages(updateData.splitPercentage);
    }

    // Update cost item
    return await this.costItemRepo.update(costItemId, updateData);
  }

  /**
   * Delete cost item
   */
  async deleteCostItem(costItemId) {
    if (!costItemId) {
      throw new ValidationError('Cost item ID is required');
    }

    const costItem = await this.costItemRepo.findById(costItemId);
    if (!costItem) {
      throw new NotFoundError('Cost item not found');
    }

    return await this.costItemRepo.delete(costItemId);
  }

  /**
   * Get cost items for an event
   */
  async getCostItemsForEvent(eventId) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    // Check if event exists
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return await this.costItemRepo.findByEvent(eventId);
  }

  /**
   * Get cost items paid by a user
   */
  async getCostItemsPaidByUser(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.costItemRepo.findByPaidBy(userId);
  }

  /**
   * Get cost items where user is a participant (has split allocation)
   */
  async getCostItemsForParticipant(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.costItemRepo.findByParticipant(userId);
  }

  /**
   * Get cost item with balance calculations
   */
  async getCostItemWithBalance(costItemId) {
    if (!costItemId) {
      throw new ValidationError('Cost item ID is required');
    }

    const costItem = await this.costItemRepo.findById(costItemId);
    if (!costItem) {
      throw new NotFoundError('Cost item not found');
    }

    const balance = this.calculationService.calculateCostItemBalances(costItem);
    
    return {
      ...costItem,
      balanceCalculation: balance
    };
  }

  /**
   * Search cost items by description
   */
  async searchCostItems(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }

    return await this.costItemRepo.searchByDescription(searchTerm);
  }

  /**
   * Get cost items by date range
   */
  async getCostItemsByDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new ValidationError('Start date and end date are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid date format');
    }

    if (start > end) {
      throw new ValidationError('Start date must be before end date');
    }

    return await this.costItemRepo.findByDateRange(startDate, endDate);
  }

  /**
   * Get cost items by amount range
   */
  async getCostItemsByAmountRange(minAmount, maxAmount) {
    if (minAmount == null || maxAmount == null) {
      throw new ValidationError('Minimum and maximum amounts are required');
    }

    if (minAmount < 0 || maxAmount < 0) {
      throw new ValidationError('Amounts must be non-negative');
    }

    if (minAmount > maxAmount) {
      throw new ValidationError('Minimum amount must be less than or equal to maximum amount');
    }

    return await this.costItemRepo.findByAmountRange(minAmount, maxAmount);
  }

  /**
   * Get expensive cost items above threshold
   */
  async getExpensiveCostItems(threshold = 50) {
    if (threshold < 0) {
      throw new ValidationError('Threshold must be non-negative');
    }

    return await this.costItemRepo.findExpensiveItems(threshold);
  }

  /**
   * Get cost items with equal splits
   */
  async getEqualSplitItems() {
    return await this.costItemRepo.findEqualSplitItems();
  }

  /**
   * Get cost items with custom splits
   */
  async getCustomSplitItems() {
    return await this.costItemRepo.findCustomSplitItems();
  }

  /**
   * Get cost items with exclusions (some participants have 0% split)
   */
  async getItemsWithExclusions() {
    return await this.costItemRepo.findItemsWithExclusions();
  }

  /**
   * Get cost items sorted by amount
   */
  async getCostItemsByAmount(order = 'desc') {
    if (!['asc', 'desc'].includes(order)) {
      throw new ValidationError('Order must be "asc" or "desc"');
    }

    return await this.costItemRepo.findItemsByAmount(order);
  }

  /**
   * Get cost items sorted by date
   */
  async getCostItemsByDate(order = 'desc') {
    if (!['asc', 'desc'].includes(order)) {
      throw new ValidationError('Order must be "asc" or "desc"');
    }

    return await this.costItemRepo.findItemsByDate(order);
  }

  /**
   * Get recent cost items
   */
  async getRecentCostItems(limit = 10) {
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    return await this.costItemRepo.findRecentItems(limit);
  }

  /**
   * Get today's cost items
   */
  async getTodayCostItems() {
    return await this.costItemRepo.findTodayItems();
  }

  /**
   * Get cost category breakdown
   */
  async getCategoryBreakdown() {
    return await this.costItemRepo.getCategoryBreakdown();
  }

  /**
   * Find potential duplicate cost items
   */
  async findPotentialDuplicates() {
    return await this.costItemRepo.findPotentialDuplicates();
  }

  /**
   * Update split percentage for a cost item
   */
  async updateSplitPercentage(costItemId, newSplitPercentage) {
    if (!costItemId) {
      throw new ValidationError('Cost item ID is required');
    }

    if (!newSplitPercentage || typeof newSplitPercentage !== 'object') {
      throw new ValidationError('Split percentage data is required');
    }

    // Validate split percentages
    this.calculationService.validateSplitPercentages(newSplitPercentage);

    // Check if cost item exists
    const costItem = await this.costItemRepo.findById(costItemId);
    if (!costItem) {
      throw new NotFoundError('Cost item not found');
    }

    // Get event for participant validation
    const event = await this.eventRepo.findById(costItem.eventId);
    if (!event) {
      throw new NotFoundError('Associated event not found');
    }

    // Validate all participants in split are event participants
    const splitParticipants = Object.keys(newSplitPercentage);
    for (const userId of splitParticipants) {
      if (!event.participants.includes(userId)) {
        throw new ValidationError(`User ${userId} in split is not a participant in the event`);
      }
    }

    return await this.costItemRepo.updateSplitPercentage(costItemId, newSplitPercentage);
  }

  /**
   * Create equal split for event participants
   */
  async createEqualSplit(eventId, excludeUsers = []) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Filter out excluded users
    const includedParticipants = event.participants.filter(userId => !excludeUsers.includes(userId));

    if (includedParticipants.length === 0) {
      throw new ValidationError('At least one participant must be included in the split');
    }

    return this.calculationService.createEqualSplit(includedParticipants);
  }

  /**
   * Get cost statistics for an event
   */
  async getEventCostStatistics(eventId) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return await this.costItemRepo.getEventCostStatistics(eventId);
  }

  /**
   * Validate cost item data without creating
   */
  validateCostItemData(costItemData) {
    return validateCostItemData(costItemData);
  }

  /**
   * Get cost item with enriched data (event details, participant names, etc.)
   */
  async getCostItemDetails(costItemId) {
    if (!costItemId) {
      throw new ValidationError('Cost item ID is required');
    }

    const costItem = await this.costItemRepo.findById(costItemId);
    if (!costItem) {
      throw new NotFoundError('Cost item not found');
    }

    // Get event details
    const event = await this.eventRepo.findById(costItem.eventId);
    
    // Get paidBy user details
    const paidByUser = await this.userRepo.findById(costItem.paidBy);

    // Get participant details for split
    const participantDetails = {};
    for (const userId of Object.keys(costItem.splitPercentage)) {
      const user = await this.userRepo.findById(userId);
      if (user) {
        participantDetails[userId] = {
          name: user.name,
          percentage: costItem.splitPercentage[userId],
          amount: (costItem.amount * costItem.splitPercentage[userId]) / 100
        };
      }
    }

    // Get balance calculations
    const balanceCalculation = this.calculationService.calculateCostItemBalances(costItem);

    return {
      costItem,
      event,
      paidByUser,
      participantDetails,
      balanceCalculation
    };
  }

  /**
   * Get comprehensive cost item analytics
   */
  async getCostItemAnalytics() {
    const allItems = await this.costItemRepo.findAll();
    const categoryBreakdown = await this.getCategoryBreakdown();
    const equalSplitItems = await this.getEqualSplitItems();
    const customSplitItems = await this.getCustomSplitItems();
    const itemsWithExclusions = await this.getItemsWithExclusions();
    const potentialDuplicates = await this.findPotentialDuplicates();

    const totalAmount = allItems.reduce((sum, item) => sum + item.amount, 0);
    const averageAmount = allItems.length > 0 ? totalAmount / allItems.length : 0;
    const amounts = allItems.map(item => item.amount);

    return {
      totalItems: allItems.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      averageAmount: Math.round(averageAmount * 100) / 100,
      largestAmount: amounts.length > 0 ? Math.max(...amounts) : 0,
      smallestAmount: amounts.length > 0 ? Math.min(...amounts) : 0,
      splitAnalysis: {
        equalSplitItems: equalSplitItems.length,
        customSplitItems: customSplitItems.length,
        itemsWithExclusions: itemsWithExclusions.length,
        equalSplitPercentage: Math.round((equalSplitItems.length / allItems.length) * 100) || 0
      },
      categoryBreakdown,
      potentialDuplicates: potentialDuplicates.length,
      recentItems: await this.getRecentCostItems(5)
    };
  }
}

module.exports = CostItemService;