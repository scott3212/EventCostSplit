const CalculationService = require('../../../src/services/CalculationService');
const { ValidationError } = require('../../../src/utils/errors');

describe('CalculationService', () => {
  let calculationService;
  let mockUserRepo;
  let mockEventRepo;
  let mockCostItemRepo;
  let mockPaymentRepo;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    mockEventRepo = {
      findById: jest.fn(),
      findByParticipant: jest.fn(),
    };

    mockCostItemRepo = {
      findByEvent: jest.fn(),
      findByParticipant: jest.fn(),
      findByPaidBy: jest.fn(),
    };

    mockPaymentRepo = {
      findByEvent: jest.fn(),
      findByUser: jest.fn(),
    };

    calculationService = new CalculationService(
      mockUserRepo,
      mockEventRepo,
      mockCostItemRepo,
      mockPaymentRepo
    );
  });

  describe('calculateCostItemBalances', () => {
    it('should calculate balances for a cost item with equal split', () => {
      const costItem = {
        id: 'cost1',
        amount: 100,
        paidBy: 'user1',
        splitPercentage: {
          user1: 50,
          user2: 50
        }
      };

      const result = calculationService.calculateCostItemBalances(costItem);

      expect(result).toEqual({
        costItemId: 'cost1',
        paidBy: 'user1',
        totalAmount: 100,
        balances: {
          user1: 50,
          user2: 50
        }
      });
    });

    it('should calculate balances for a cost item with custom split', () => {
      const costItem = {
        id: 'cost1',
        amount: 100,
        paidBy: 'user1',
        splitPercentage: {
          user1: 60,
          user2: 40
        }
      };

      const result = calculationService.calculateCostItemBalances(costItem);

      expect(result).toEqual({
        costItemId: 'cost1',
        paidBy: 'user1',
        totalAmount: 100,
        balances: {
          user1: 60,
          user2: 40
        }
      });
    });

    it('should exclude users with 0% split', () => {
      const costItem = {
        id: 'cost1',
        amount: 100,
        paidBy: 'user1',
        splitPercentage: {
          user1: 70,
          user2: 30,
          user3: 0
        }
      };

      const result = calculationService.calculateCostItemBalances(costItem);

      expect(result.balances).toEqual({
        user1: 70,
        user2: 30
      });
      expect(result.balances.user3).toBeUndefined();
    });

    it('should throw error if split percentages do not sum to 100', () => {
      const costItem = {
        id: 'cost1',
        amount: 100,
        paidBy: 'user1',
        splitPercentage: {
          user1: 60,
          user2: 30
        }
      };

      expect(() => calculationService.calculateCostItemBalances(costItem))
        .toThrow('Split percentages must sum to 100%');
    });

    it('should throw error for invalid cost item', () => {
      expect(() => calculationService.calculateCostItemBalances(null))
        .toThrow('Invalid cost item for balance calculation');
    });
  });

  describe('calculateEventBalance', () => {
    it('should calculate event balance correctly', async () => {
      const event = {
        id: 'event1',
        name: 'Test Event',
        participants: ['user1', 'user2']
      };

      const costItems = [
        {
          id: 'cost1',
          amount: 100,
          paidBy: 'user1',
          splitPercentage: { user1: 50, user2: 50 }
        }
      ];

      const payments = [
        {
          userId: 'user2',
          amount: 30
        }
      ];

      mockEventRepo.findById.mockResolvedValue(event);
      mockCostItemRepo.findByEvent.mockResolvedValue(costItems);
      mockPaymentRepo.findByEvent.mockResolvedValue(payments);

      const result = await calculationService.calculateEventBalance('event1');

      expect(result).toEqual({
        eventId: 'event1',
        eventName: 'Test Event',
        userBalances: {
          user1: {
            owes: 50,
            paid: 100,
            net: 50
          },
          user2: {
            owes: 50,
            paid: 30,
            net: -20
          }
        },
        totalCosts: 100,
        totalPayments: 30
      });
    });

    it('should throw error if event not found', async () => {
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(calculationService.calculateEventBalance('invalid'))
        .rejects.toThrow('Event not found');
    });
  });

  describe('calculateUserBalance', () => {
    it('should calculate user balance across events', async () => {
      const user = { id: 'user1', name: 'John Doe' };
      const events = [{ id: 'event1' }, { id: 'event2' }];
      const costItems = [
        {
          id: 'cost1',
          amount: 100,
          splitPercentage: { user1: 50 }
        }
      ];
      const paidCostItems = [
        { id: 'cost2', amount: 80 }
      ];
      const payments = [
        { userId: 'user1', amount: 20 }
      ];

      mockUserRepo.findById.mockResolvedValue(user);
      mockEventRepo.findByParticipant.mockResolvedValue(events);
      mockCostItemRepo.findByParticipant.mockResolvedValue(costItems);
      mockCostItemRepo.findByPaidBy.mockResolvedValue(paidCostItems);
      mockPaymentRepo.findByUser.mockResolvedValue(payments);

      const result = await calculationService.calculateUserBalance('user1');

      expect(result).toEqual({
        userId: 'user1',
        userName: 'John Doe',
        totalOwes: 50,
        totalPaid: 100,
        netBalance: 50,
        status: 'owed',
        events: 2,
        costItems: 1,
        payments: 1
      });
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(calculationService.calculateUserBalance('invalid'))
        .rejects.toThrow('User not found');
    });
  });

  describe('validateSplitPercentages', () => {
    it('should validate correct split percentages', () => {
      const splitPercentage = { user1: 60, user2: 40 };
      expect(() => calculationService.validateSplitPercentages(splitPercentage))
        .not.toThrow();
    });

    it('should throw error for split percentages not summing to 100', () => {
      const splitPercentage = { user1: 60, user2: 30 };
      expect(() => calculationService.validateSplitPercentages(splitPercentage))
        .toThrow('Split percentages must sum to exactly 100%');
    });

    it('should throw error for negative percentages', () => {
      const splitPercentage = { user1: 120, user2: -20 };
      expect(() => calculationService.validateSplitPercentages(splitPercentage))
        .toThrow('Each split percentage must be between 0 and 100');
    });

    it('should throw error for empty split', () => {
      expect(() => calculationService.validateSplitPercentages({}))
        .toThrow('At least one participant must have a non-zero split');
    });
  });

  describe('createEqualSplit', () => {
    it('should create equal split for 2 participants', () => {
      const result = calculationService.createEqualSplit(['user1', 'user2']);
      expect(result).toEqual({
        user1: 50,
        user2: 50
      });
    });

    it('should create equal split for 3 participants with rounding adjustment', () => {
      const result = calculationService.createEqualSplit(['user1', 'user2', 'user3']);
      
      const total = Object.values(result).reduce((sum, pct) => sum + pct, 0);
      expect(Math.abs(total - 100)).toBeLessThan(0.01);
      
      // First user should get the rounding adjustment
      expect(result.user1).toBeCloseTo(33.34, 2);
      expect(result.user2).toBeCloseTo(33.33, 2);
      expect(result.user3).toBeCloseTo(33.33, 2);
    });

    it('should throw error for empty participant list', () => {
      expect(() => calculationService.createEqualSplit([]))
        .toThrow('Must provide at least one participant');
    });
  });

  describe('getBalanceStatus', () => {
    it('should return "owed" for positive balance', () => {
      expect(calculationService.getBalanceStatus(10.50)).toBe('owed');
    });

    it('should return "owes" for negative balance', () => {
      expect(calculationService.getBalanceStatus(-5.25)).toBe('owes');
    });

    it('should return "settled" for zero balance', () => {
      expect(calculationService.getBalanceStatus(0)).toBe('settled');
      expect(calculationService.getBalanceStatus(0.005)).toBe('settled');
      expect(calculationService.getBalanceStatus(-0.005)).toBe('settled');
    });
  });

  describe('calculateSettlements', () => {
    it('should calculate optimal settlements', async () => {
      const userBalances = [
        { userId: 'user1', userName: 'Alice', netBalance: 30 },
        { userId: 'user2', userName: 'Bob', netBalance: -20 },
        { userId: 'user3', userName: 'Charlie', netBalance: -10 }
      ];

      calculationService.calculateAllUserBalances = jest.fn().mockResolvedValue(userBalances);

      const result = await calculationService.calculateSettlements();

      expect(result.settlements).toHaveLength(2);
      expect(result.settlements[0]).toEqual({
        from: { userId: 'user2', userName: 'Bob' },
        to: { userId: 'user1', userName: 'Alice' },
        amount: 20,
        description: 'Bob pays Alice'
      });
      expect(result.settlements[1]).toEqual({
        from: { userId: 'user3', userName: 'Charlie' },
        to: { userId: 'user1', userName: 'Alice' },
        amount: 10,
        description: 'Charlie pays Alice'
      });
      expect(result.summary.balanced).toBe(true);
    });
  });
});