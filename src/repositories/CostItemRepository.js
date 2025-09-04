const BaseRepository = require('./BaseRepository');
const { DATA_FILES } = require('../config/constants');

/**
 * CostItem repository for expense-specific data operations
 * Extends BaseRepository with cost item-specific methods
 */
class CostItemRepository extends BaseRepository {
  constructor() {
    super(DATA_FILES.COST_ITEMS);
  }

  /**
   * Find cost items by event ID
   */
  async findByEvent(eventId) {
    if (!eventId) return [];
    
    return await this.findBy({ eventId });
  }

  /**
   * Find cost items paid by specific user
   */
  async findByPaidBy(userId) {
    if (!userId) return [];
    
    return await this.findBy({ paidBy: userId });
  }

  /**
   * Find cost items where user is included in split
   */
  async findByParticipant(userId) {
    if (!userId) return [];
    
    return await this.findBy({
      splitPercentage: (splits) => splits && userId in splits && splits[userId] > 0
    });
  }

  /**
   * Find cost items by date range
   */
  async findByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return await this.findBy({
      date: (itemDate) => {
        const date = new Date(itemDate);
        return date >= start && date <= end;
      }
    });
  }

  /**
   * Find cost items by amount range
   */
  async findByAmountRange(minAmount, maxAmount) {
    return await this.findBy({
      amount: (amount) => amount >= minAmount && amount <= maxAmount
    });
  }

  /**
   * Find cost items above certain amount
   */
  async findExpensiveItems(threshold = 50) {
    return await this.findBy({
      amount: (amount) => amount >= threshold
    });
  }

  /**
   * Find cost items with equal splits (all participants have same percentage)
   */
  async findEqualSplitItems() {
    return await this.findBy({
      splitPercentage: (splits) => {
        if (!splits) return false;
        
        const percentages = Object.values(splits);
        const nonZeroPercentages = percentages.filter(p => p > 0);
        
        if (nonZeroPercentages.length === 0) return false;
        
        // Check if all non-zero percentages are equal
        const firstPercentage = nonZeroPercentages[0];
        return nonZeroPercentages.every(p => Math.abs(p - firstPercentage) < 0.01);
      }
    });
  }

  /**
   * Find cost items with custom splits (not equal)
   */
  async findCustomSplitItems() {
    const allItems = await this.findAll();
    const equalSplitItems = await this.findEqualSplitItems();
    const equalSplitIds = new Set(equalSplitItems.map(item => item.id));
    
    return allItems.filter(item => !equalSplitIds.has(item.id));
  }

  /**
   * Find cost items where someone is excluded (0% split)
   */
  async findItemsWithExclusions() {
    return await this.findBy({
      splitPercentage: (splits) => {
        if (!splits) return false;
        return Object.values(splits).some(percentage => percentage === 0);
      }
    });
  }

  /**
   * Get total amount spent for an event
   */
  async getTotalForEvent(eventId) {
    const items = await this.findByEvent(eventId);
    return items.reduce((total, item) => total + item.amount, 0);
  }

  /**
   * Get total amount paid by a specific user
   */
  async getTotalPaidByUser(userId) {
    const items = await this.findByPaidBy(userId);
    return items.reduce((total, item) => total + item.amount, 0);
  }

  /**
   * Get cost item statistics for an event
   */
  async getEventCostStatistics(eventId) {
    const items = await this.findByEvent(eventId);
    
    if (items.length === 0) {
      return {
        totalItems: 0,
        totalAmount: 0,
        averageAmount: 0,
        largestExpense: 0,
        smallestExpense: 0,
        paidByCount: {},
      };
    }

    const amounts = items.map(item => item.amount);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const paidByCount = {};

    items.forEach(item => {
      paidByCount[item.paidBy] = (paidByCount[item.paidBy] || 0) + 1;
    });

    return {
      totalItems: items.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      averageAmount: Math.round((totalAmount / items.length) * 100) / 100,
      largestExpense: Math.max(...amounts),
      smallestExpense: Math.min(...amounts),
      paidByCount,
    };
  }

  /**
   * Get cost items sorted by amount
   */
  async findItemsByAmount(order = 'desc') {
    const items = await this.findAll();
    
    return items.sort((a, b) => {
      return order === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    });
  }

  /**
   * Get cost items sorted by date
   */
  async findItemsByDate(order = 'desc') {
    const items = await this.findAll();
    
    return items.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }

  /**
   * Search cost items by description (partial match)
   */
  async searchByDescription(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') return [];
    
    const normalizedSearch = searchTerm.trim().toLowerCase();
    
    return await this.findBy({
      description: (desc) => desc.toLowerCase().includes(normalizedSearch)
    });
  }

  /**
   * Get recently created cost items
   */
  async findRecentItems(limit = 10) {
    const items = await this.findAll();
    
    return items
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Get cost items for today
   */
  async findTodayItems() {
    const today = new Date().toDateString();
    
    return await this.findBy({
      date: (itemDate) => new Date(itemDate).toDateString() === today
    });
  }

  /**
   * Get cost breakdown by description category
   */
  async getCategoryBreakdown() {
    const items = await this.findAll();
    const categories = {};
    
    items.forEach(item => {
      const desc = item.description.toLowerCase();
      let category = 'other';
      
      // Categorize based on common keywords
      if (desc.includes('court') || desc.includes('venue') || desc.includes('rental')) {
        category = 'venue';
      } else if (desc.includes('shuttle') || desc.includes('bird') || desc.includes('cock')) {
        category = 'shuttlecocks';
      } else if (desc.includes('food') || desc.includes('drink') || desc.includes('snack') || desc.includes('refreshment')) {
        category = 'refreshments';
      } else if (desc.includes('transport') || desc.includes('gas') || desc.includes('parking') || desc.includes('fuel')) {
        category = 'transport';
      } else if (desc.includes('equipment') || desc.includes('racket') || desc.includes('gear')) {
        category = 'equipment';
      }
      
      if (!categories[category]) {
        categories[category] = { count: 0, totalAmount: 0 };
      }
      
      categories[category].count++;
      categories[category].totalAmount += item.amount;
    });
    
    // Round amounts
    Object.keys(categories).forEach(category => {
      categories[category].totalAmount = Math.round(categories[category].totalAmount * 100) / 100;
      categories[category].averageAmount = Math.round((categories[category].totalAmount / categories[category].count) * 100) / 100;
    });
    
    return categories;
  }

  /**
   * Get cost items that might be duplicates (similar description and amount)
   */
  async findPotentialDuplicates() {
    const items = await this.findAll();
    const duplicates = [];
    
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i];
        const item2 = items[j];
        
        // Check if descriptions are similar and amounts are same
        const desc1 = item1.description.toLowerCase().trim();
        const desc2 = item2.description.toLowerCase().trim();
        const amountMatch = Math.abs(item1.amount - item2.amount) < 0.01;
        
        if (amountMatch && (desc1 === desc2 || desc1.includes(desc2) || desc2.includes(desc1))) {
          duplicates.push([item1, item2]);
        }
      }
    }
    
    return duplicates;
  }

  /**
   * Update split percentage for a cost item
   */
  async updateSplitPercentage(costItemId, newSplitPercentage) {
    const item = await this.findById(costItemId);
    if (!item) return null;
    
    return await this.update(costItemId, { 
      splitPercentage: newSplitPercentage 
    });
  }
}

module.exports = CostItemRepository;