const CostItemService = require('../../../src/services/CostItemService');
const CostItem = require('../../../src/models/CostItem');
const { ValidationError, NotFoundError } = require('../../../src/utils/errors');

describe('CostItemService', () => {
  let costItemService;
  let mockCostItemRepo;
  let mockEventRepo;
  let mockUserRepo;
  let mockCalculationService;

  beforeEach(() => {
    mockCostItemRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEvent: jest.fn(),
      findByPaidBy: jest.fn(),
      findByParticipant: jest.fn(),
      searchByDescription: jest.fn(),
      findByDateRange: jest.fn(),
      findByAmountRange: jest.fn(),
      findExpensiveItems: jest.fn(),
      findEqualSplitItems: jest.fn(),
      findCustomSplitItems: jest.fn(),
      findItemsWithExclusions: jest.fn(),
      findItemsByAmount: jest.fn(),
      findItemsByDate: jest.fn(),
      findRecentItems: jest.fn(),
      findTodayItems: jest.fn(),
      getCategoryBreakdown: jest.fn(),
      findPotentialDuplicates: jest.fn(),
      updateSplitPercentage: jest.fn(),
      getEventCostStatistics: jest.fn(),
    };

    mockEventRepo = {
      findById: jest.fn(),
    };

    mockUserRepo = {
      findById: jest.fn(),
    };

    mockCalculationService = {
      validateSplitPercentages: jest.fn(),
      createEqualSplit: jest.fn(),
      calculateCostItemBalances: jest.fn(),
    };

    costItemService = new CostItemService(
      mockCostItemRepo,
      mockEventRepo,
      mockUserRepo,
      mockCalculationService
    );
  });

  describe('createCostItem', () => {
    const validCostItemData = {
      description: 'Court Rental',
      amount: 60,
      paidBy: '12345678-1234-1234-1234-123456789012',
      eventId: '12345678-1234-1234-1234-123456789013',
      date: '2024-09-14',
      splitPercentage: {
        '12345678-1234-1234-1234-123456789012': 50,
        '12345678-1234-1234-1234-123456789014': 50
      }
    };

    const mockEvent = {
      id: '12345678-1234-1234-1234-123456789013',
      name: 'Test Event',
      participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789014']
    };

    const mockUser = {
      id: '12345678-1234-1234-1234-123456789012',
      name: 'John Doe'
    };

    it('should create a cost item with valid data', async () => {
      const createdCostItem = { id: 'cost1', ...validCostItemData };
      
      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockCalculationService.validateSplitPercentages.mockReturnValue(true);
      mockCostItemRepo.create.mockResolvedValue(createdCostItem);

      const result = await costItemService.createCostItem(validCostItemData);

      expect(mockEventRepo.findById).toHaveBeenCalledWith(validCostItemData.eventId);
      expect(mockUserRepo.findById).toHaveBeenCalledWith(validCostItemData.paidBy);
      expect(mockCalculationService.validateSplitPercentages).toHaveBeenCalledWith(validCostItemData.splitPercentage);
      expect(mockCostItemRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Court Rental',
        amount: 60,
        paidBy: '12345678-1234-1234-1234-123456789012'
      }));
      expect(result).toEqual(createdCostItem);
    });

    it('should throw error for invalid cost item data', async () => {
      const invalidCostItemData = { description: '' };

      await expect(costItemService.createCostItem(invalidCostItemData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error if event not found', async () => {
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(costItemService.createCostItem(validCostItemData))
        .rejects.toThrow('Event not found');
    });

    it('should throw error if paidBy user not found', async () => {
      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(costItemService.createCostItem(validCostItemData))
        .rejects.toThrow('User who paid not found');
    });

    it('should throw error if paidBy user is not event participant', async () => {
      const nonParticipantUser = { id: '99999999-9999-9999-9999-999999999999', name: 'Non Participant' };
      const invalidData = {
        ...validCostItemData,
        paidBy: '99999999-9999-9999-9999-999999999999'
      };

      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockUserRepo.findById.mockResolvedValue(nonParticipantUser);

      await expect(costItemService.createCostItem(invalidData))
        .rejects.toThrow('User who paid must be a participant in the event');
    });

    it('should throw error if split participant is not in event', async () => {
      const invalidData = {
        ...validCostItemData,
        splitPercentage: {
          '12345678-1234-1234-1234-123456789012': 50,
          '99999999-9999-9999-9999-999999999999': 50
        }
      };

      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockUserRepo.findById.mockResolvedValue(mockUser);

      await expect(costItemService.createCostItem(invalidData))
        .rejects.toThrow('User 99999999-9999-9999-9999-999999999999 in split is not a participant in the event');
    });
  });

  describe('getCostItemById', () => {
    it('should return cost item if found', async () => {
      const costItem = { id: 'cost1', description: 'Test Cost' };
      mockCostItemRepo.findById.mockResolvedValue(costItem);

      const result = await costItemService.getCostItemById('cost1');

      expect(result).toEqual(costItem);
      expect(mockCostItemRepo.findById).toHaveBeenCalledWith('cost1');
    });

    it('should throw NotFoundError if cost item does not exist', async () => {
      mockCostItemRepo.findById.mockResolvedValue(null);

      await expect(costItemService.getCostItemById('invalid'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if no ID provided', async () => {
      await expect(costItemService.getCostItemById(''))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateCostItem', () => {
    const existingCostItem = {
      id: 'cost1',
      eventId: '12345678-1234-1234-1234-123456789013',
      description: 'Old Description',
      amount: 50
    };

    const mockEvent = {
      id: '12345678-1234-1234-1234-123456789013',
      participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789014']
    };

    it('should update cost item with valid data', async () => {
      const updateData = { description: 'Updated Description' };
      const updatedCostItem = { ...existingCostItem, ...updateData };

      mockCostItemRepo.findById.mockResolvedValue(existingCostItem);
      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockCostItemRepo.update.mockResolvedValue(updatedCostItem);

      const result = await costItemService.updateCostItem('cost1', updateData);

      expect(mockCostItemRepo.update).toHaveBeenCalledWith('cost1', updateData);
      expect(result).toEqual(updatedCostItem);
    });

    it('should throw error if cost item not found', async () => {
      mockCostItemRepo.findById.mockResolvedValue(null);

      await expect(costItemService.updateCostItem('invalid', { description: 'Test' }))
        .rejects.toThrow(NotFoundError);
    });

    it('should validate paidBy user when updating', async () => {
      const updateData = { paidBy: '12345678-1234-1234-1234-123456789012' };
      const mockUser = { id: '12345678-1234-1234-1234-123456789012', name: 'John' };

      mockCostItemRepo.findById.mockResolvedValue(existingCostItem);
      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockCostItemRepo.update.mockResolvedValue({ ...existingCostItem, ...updateData });

      const result = await costItemService.updateCostItem('cost1', updateData);

      expect(mockUserRepo.findById).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789012');
      expect(result).toEqual(expect.objectContaining(updateData));
    });

    it('should validate split percentages when updating', async () => {
      const updateData = { splitPercentage: { '12345678-1234-1234-1234-123456789012': 100 } };

      mockCostItemRepo.findById.mockResolvedValue(existingCostItem);
      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockCalculationService.validateSplitPercentages.mockReturnValue(true);
      mockCostItemRepo.update.mockResolvedValue({ ...existingCostItem, ...updateData });

      await costItemService.updateCostItem('cost1', updateData);

      expect(mockCalculationService.validateSplitPercentages).toHaveBeenCalledWith(updateData.splitPercentage);
    });
  });

  describe('deleteCostItem', () => {
    it('should delete cost item successfully', async () => {
      const costItem = { id: 'cost1', description: 'Test Cost' };

      mockCostItemRepo.findById.mockResolvedValue(costItem);
      mockCostItemRepo.delete.mockResolvedValue(true);

      const result = await costItemService.deleteCostItem('cost1');

      expect(mockCostItemRepo.delete).toHaveBeenCalledWith('cost1');
      expect(result).toBe(true);
    });

    it('should throw error if cost item not found', async () => {
      mockCostItemRepo.findById.mockResolvedValue(null);

      await expect(costItemService.deleteCostItem('invalid'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getCostItemsForEvent', () => {
    it('should return cost items for valid event', async () => {
      const event = { id: 'event1', name: 'Test Event' };
      const costItems = [{ id: 'cost1' }, { id: 'cost2' }];

      mockEventRepo.findById.mockResolvedValue(event);
      mockCostItemRepo.findByEvent.mockResolvedValue(costItems);

      const result = await costItemService.getCostItemsForEvent('event1');

      expect(result).toEqual(costItems);
      expect(mockCostItemRepo.findByEvent).toHaveBeenCalledWith('event1');
    });

    it('should throw error if event not found', async () => {
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(costItemService.getCostItemsForEvent('invalid'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getCostItemWithBalance', () => {
    it('should return cost item with balance calculations', async () => {
      const costItem = {
        id: 'cost1',
        amount: 100,
        splitPercentage: { user1: 50, user2: 50 }
      };
      const balanceCalculation = {
        costItemId: 'cost1',
        balances: { user1: 50, user2: 50 }
      };

      mockCostItemRepo.findById.mockResolvedValue(costItem);
      mockCalculationService.calculateCostItemBalances.mockReturnValue(balanceCalculation);

      const result = await costItemService.getCostItemWithBalance('cost1');

      expect(result).toEqual({
        ...costItem,
        balanceCalculation
      });
      expect(mockCalculationService.calculateCostItemBalances).toHaveBeenCalledWith(costItem);
    });
  });

  describe('getCostItemsByDateRange', () => {
    it('should return cost items in date range', async () => {
      const costItems = [{ id: 'cost1' }, { id: 'cost2' }];

      mockCostItemRepo.findByDateRange.mockResolvedValue(costItems);

      const result = await costItemService.getCostItemsByDateRange('2024-09-01', '2024-09-30');

      expect(result).toEqual(costItems);
      expect(mockCostItemRepo.findByDateRange).toHaveBeenCalledWith('2024-09-01', '2024-09-30');
    });

    it('should throw error for invalid date range', async () => {
      await expect(costItemService.getCostItemsByDateRange('2024-09-30', '2024-09-01'))
        .rejects.toThrow('Start date must be before end date');
    });

    it('should throw error for missing dates', async () => {
      await expect(costItemService.getCostItemsByDateRange('', '2024-09-30'))
        .rejects.toThrow('Start date and end date are required');
    });
  });

  describe('getCostItemsByAmountRange', () => {
    it('should return cost items in amount range', async () => {
      const costItems = [{ id: 'cost1', amount: 25 }];

      mockCostItemRepo.findByAmountRange.mockResolvedValue(costItems);

      const result = await costItemService.getCostItemsByAmountRange(20, 30);

      expect(result).toEqual(costItems);
      expect(mockCostItemRepo.findByAmountRange).toHaveBeenCalledWith(20, 30);
    });

    it('should throw error for negative amounts', async () => {
      await expect(costItemService.getCostItemsByAmountRange(-10, 30))
        .rejects.toThrow('Amounts must be non-negative');
    });

    it('should throw error when min > max', async () => {
      await expect(costItemService.getCostItemsByAmountRange(50, 30))
        .rejects.toThrow('Minimum amount must be less than or equal to maximum amount');
    });
  });

  describe('updateSplitPercentage', () => {
    const costItem = {
      id: 'cost1',
      eventId: '12345678-1234-1234-1234-123456789013'
    };

    const event = {
      id: '12345678-1234-1234-1234-123456789013',
      participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789014']
    };

    it('should update split percentage successfully', async () => {
      const newSplit = { '12345678-1234-1234-1234-123456789012': 60, '12345678-1234-1234-1234-123456789014': 40 };

      mockCostItemRepo.findById.mockResolvedValue(costItem);
      mockEventRepo.findById.mockResolvedValue(event);
      mockCalculationService.validateSplitPercentages.mockReturnValue(true);
      mockCostItemRepo.updateSplitPercentage.mockResolvedValue({ ...costItem, splitPercentage: newSplit });

      const result = await costItemService.updateSplitPercentage('cost1', newSplit);

      expect(mockCalculationService.validateSplitPercentages).toHaveBeenCalledWith(newSplit);
      expect(mockCostItemRepo.updateSplitPercentage).toHaveBeenCalledWith('cost1', newSplit);
      expect(result.splitPercentage).toEqual(newSplit);
    });

    it('should throw error for invalid split participant', async () => {
      const newSplit = { '99999999-9999-9999-9999-999999999999': 100 };

      mockCostItemRepo.findById.mockResolvedValue(costItem);
      mockEventRepo.findById.mockResolvedValue(event);
      mockCalculationService.validateSplitPercentages.mockReturnValue(true);

      await expect(costItemService.updateSplitPercentage('cost1', newSplit))
        .rejects.toThrow('User 99999999-9999-9999-9999-999999999999 in split is not a participant in the event');
    });
  });

  describe('createEqualSplit', () => {
    const event = {
      id: 'event1',
      participants: ['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789014', '12345678-1234-1234-1234-123456789015']
    };

    it('should create equal split for all participants', async () => {
      const equalSplit = {
        '12345678-1234-1234-1234-123456789012': 33.34,
        '12345678-1234-1234-1234-123456789014': 33.33,
        '12345678-1234-1234-1234-123456789015': 33.33
      };

      mockEventRepo.findById.mockResolvedValue(event);
      mockCalculationService.createEqualSplit.mockReturnValue(equalSplit);

      const result = await costItemService.createEqualSplit('event1');

      expect(mockCalculationService.createEqualSplit).toHaveBeenCalledWith(event.participants);
      expect(result).toEqual(equalSplit);
    });

    it('should create equal split excluding specified users', async () => {
      const excludeUsers = ['12345678-1234-1234-1234-123456789015'];
      const equalSplit = {
        '12345678-1234-1234-1234-123456789012': 50,
        '12345678-1234-1234-1234-123456789014': 50
      };

      mockEventRepo.findById.mockResolvedValue(event);
      mockCalculationService.createEqualSplit.mockReturnValue(equalSplit);

      const result = await costItemService.createEqualSplit('event1', excludeUsers);

      expect(mockCalculationService.createEqualSplit).toHaveBeenCalledWith(['12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789014']);
      expect(result).toEqual(equalSplit);
    });

    it('should throw error if no participants included', async () => {
      const excludeUsers = event.participants; // exclude everyone

      mockEventRepo.findById.mockResolvedValue(event);

      await expect(costItemService.createEqualSplit('event1', excludeUsers))
        .rejects.toThrow('At least one participant must be included in the split');
    });
  });

  describe('getCostItemAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      const allItems = [
        { id: 'cost1', amount: 50 },
        { id: 'cost2', amount: 30 }
      ];
      
      mockCostItemRepo.findAll.mockResolvedValue(allItems);
      mockCostItemRepo.getCategoryBreakdown.mockResolvedValue({ venue: { count: 1, totalAmount: 50 } });
      mockCostItemRepo.findEqualSplitItems.mockResolvedValue([allItems[0]]);
      mockCostItemRepo.findCustomSplitItems.mockResolvedValue([allItems[1]]);
      mockCostItemRepo.findItemsWithExclusions.mockResolvedValue([]);
      mockCostItemRepo.findPotentialDuplicates.mockResolvedValue([]);
      mockCostItemRepo.findRecentItems.mockResolvedValue(allItems);

      const result = await costItemService.getCostItemAnalytics();

      expect(result).toEqual({
        totalItems: 2,
        totalAmount: 80,
        averageAmount: 40,
        largestAmount: 50,
        smallestAmount: 30,
        splitAnalysis: {
          equalSplitItems: 1,
          customSplitItems: 1,
          itemsWithExclusions: 0,
          equalSplitPercentage: 50
        },
        categoryBreakdown: { venue: { count: 1, totalAmount: 50 } },
        potentialDuplicates: 0,
        recentItems: allItems
      });
    });
  });
});