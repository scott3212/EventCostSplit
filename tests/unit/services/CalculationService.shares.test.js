const CalculationService = require('../../../src/services/CalculationService');
const { ValidationError } = require('../../../src/utils/errors');

describe('CalculationService Shares-Based Functionality', () => {
  let calculationService;
  let mockUserRepo, mockEventRepo, mockCostItemRepo, mockPaymentRepo;

  beforeEach(() => {
    mockUserRepo = {};
    mockEventRepo = {};
    mockCostItemRepo = {};
    mockPaymentRepo = {};

    calculationService = new CalculationService(
      mockUserRepo,
      mockEventRepo,
      mockCostItemRepo,
      mockPaymentRepo
    );
  });

  describe('calculateSharesBasedBalances', () => {
    test('should calculate equal shares correctly without rounding errors', () => {
      const costItem = {
        id: 'cost1',
        amount: 60,
        paidBy: 'user1',
        splitShares: {
          'user1': 1,
          'user2': 1,
          'user3': 1,
          'user4': 1,
          'user5': 1,
          'user6': 1
        },
        splitMode: 'shares'
      };

      const result = calculationService.calculateSharesBasedBalances(costItem);

      // Each person should owe exactly $10.00
      expect(result.balances['user1']).toBe(10.00);
      expect(result.balances['user2']).toBe(10.00);
      expect(result.balances['user3']).toBe(10.00);
      expect(result.balances['user4']).toBe(10.00);
      expect(result.balances['user5']).toBe(10.00);
      expect(result.balances['user6']).toBe(10.00);

      // Total should equal original amount
      const total = Object.values(result.balances).reduce((sum, amount) => sum + amount, 0);
      expect(total).toBe(60);

      expect(result.splitMode).toBe('shares');
      expect(result.costItemId).toBe('cost1');
      expect(result.paidBy).toBe('user1');
      expect(result.totalAmount).toBe(60);
    });

    test('should handle unequal shares correctly', () => {
      const costItem = {
        id: 'cost1',
        amount: 100,
        paidBy: 'user1',
        splitShares: {
          'user1': 1,  // 1 share = 20%
          'user2': 2,  // 2 shares = 40%
          'user3': 2   // 2 shares = 40%
        },
        splitMode: 'shares'
      };

      const result = calculationService.calculateSharesBasedBalances(costItem);

      expect(result.balances['user1']).toBe(20.00);
      expect(result.balances['user2']).toBe(40.00);
      expect(result.balances['user3']).toBe(40.00);

      // Total should equal original amount
      const total = Object.values(result.balances).reduce((sum, amount) => sum + amount, 0);
      expect(total).toBe(100);
    });

    test('should handle rounding by giving remainder to last participant', () => {
      const costItem = {
        id: 'cost1',
        amount: 10,  // Doesn't divide evenly by 3
        paidBy: 'user1',
        splitShares: {
          'user1': 1,
          'user2': 1,
          'user3': 1
        },
        splitMode: 'shares'
      };

      const result = calculationService.calculateSharesBasedBalances(costItem);

      // Total must equal original amount exactly
      const total = Object.values(result.balances).reduce((sum, amount) => sum + amount, 0);
      expect(total).toBe(10);

      // Each amount should be reasonable (around $3.33)
      Object.values(result.balances).forEach(amount => {
        expect(amount).toBeGreaterThan(3);
        expect(amount).toBeLessThan(4);
      });
    });

    test('should exclude participants with 0 shares', () => {
      const costItem = {
        id: 'cost1',
        amount: 100,
        paidBy: 'user1',
        splitShares: {
          'user1': 1,
          'user2': 0,  // excluded
          'user3': 1
        },
        splitMode: 'shares'
      };

      const result = calculationService.calculateSharesBasedBalances(costItem);

      expect(result.balances['user1']).toBe(50.00);
      expect(result.balances['user3']).toBe(50.00);
      expect(result.balances).not.toHaveProperty('user2');

      const total = Object.values(result.balances).reduce((sum, amount) => sum + amount, 0);
      expect(total).toBe(100);
    });

    test('should throw error when total shares is 0', () => {
      const costItem = {
        id: 'cost1',
        amount: 100,
        paidBy: 'user1',
        splitShares: {
          'user1': 0,
          'user2': 0,
          'user3': 0
        },
        splitMode: 'shares'
      };

      expect(() => {
        calculationService.calculateSharesBasedBalances(costItem);
      }).toThrow(ValidationError);
    });
  });

  describe('calculateCostItemBalances (Main Method)', () => {
    test('should route to shares calculation when splitMode is shares', () => {
      const costItem = {
        id: 'cost1',
        amount: 60,
        paidBy: 'user1',
        splitShares: {
          'user1': 1,
          'user2': 1,
          'user3': 1
        },
        splitMode: 'shares'
      };

      const result = calculationService.calculateCostItemBalances(costItem);

      expect(result.splitMode).toBe('shares');
      expect(result.balances['user1']).toBe(20.00);
      expect(result.balances['user2']).toBe(20.00);
      expect(result.balances['user3']).toBe(20.00);
    });

    test('should route to percentage calculation when splitMode is percentage', () => {
      const costItem = {
        id: 'cost1',
        amount: 60,
        paidBy: 'user1',
        splitPercentage: {
          'user1': 33.33,
          'user2': 33.33,
          'user3': 33.34
        },
        splitMode: 'percentage'
      };

      const result = calculationService.calculateCostItemBalances(costItem);

      expect(result.splitMode).toBe('percentage');
      // This should use the percentage-based calculation
      expect(Object.values(result.balances)).toHaveLength(3);
    });

    test('should default to percentage mode when no splitMode specified but has splitPercentage', () => {
      const costItem = {
        id: 'cost1',
        amount: 60,
        paidBy: 'user1',
        splitPercentage: {
          'user1': 50,
          'user2': 50
        }
        // No splitMode specified
      };

      const result = calculationService.calculateCostItemBalances(costItem);

      expect(result.splitMode).toBe('percentage');
    });

    test('should throw error when neither shares nor percentages provided', () => {
      const costItem = {
        id: 'cost1',
        amount: 60,
        paidBy: 'user1'
        // No splitShares or splitPercentage
      };

      expect(() => {
        calculationService.calculateCostItemBalances(costItem);
      }).toThrow(ValidationError);
    });
  });

  describe('Precision Comparison: Shares vs Percentages', () => {
    test('shares should provide consistent results like equal split percentage detection', () => {
      // Test case with equal splits: both should give same results now due to equal split detection
      const sharesCostItem = {
        id: 'cost1',
        amount: 60,
        paidBy: 'user1',
        splitShares: {
          'user1': 1,
          'user2': 1,
          'user3': 1,
          'user4': 1,
          'user5': 1,
          'user6': 1
        },
        splitMode: 'shares'
      };

      const percentagesCostItem = {
        id: 'cost1',
        amount: 60,
        paidBy: 'user1',
        splitPercentage: {
          'user1': 16.66,
          'user2': 16.66,
          'user3': 16.66,
          'user4': 16.66,
          'user5': 16.66,
          'user6': 16.70  // This triggers equal split detection
        },
        splitMode: 'percentage'
      };

      const sharesResult = calculationService.calculateSharesBasedBalances(sharesCostItem);
      const percentagesResult = calculationService.calculatePercentageBasedBalances(percentagesCostItem);

      // Both should result in exactly $10.00 per person due to equal split detection
      Object.values(sharesResult.balances).forEach(amount => {
        expect(amount).toBe(10.00);
      });

      Object.values(percentagesResult.balances).forEach(amount => {
        expect(amount).toBe(10.00);
      });

      // Total should be exact in both cases
      expect(Object.values(sharesResult.balances).reduce((sum, amount) => sum + amount, 0)).toBe(60);
      expect(Object.values(percentagesResult.balances).reduce((sum, amount) => sum + amount, 0)).toBe(60);
    });
  });

  describe('Edge Cases', () => {
    test('should handle single participant shares', () => {
      const costItem = {
        id: 'cost1',
        amount: 100,
        paidBy: 'user1',
        splitShares: {
          'user1': 1
        },
        splitMode: 'shares'
      };

      const result = calculationService.calculateSharesBasedBalances(costItem);

      expect(result.balances['user1']).toBe(100.00);
      expect(Object.keys(result.balances)).toHaveLength(1);
    });

    test('should handle very small amounts', () => {
      const costItem = {
        id: 'cost1',
        amount: 0.01,
        paidBy: 'user1',
        splitShares: {
          'user1': 1,
          'user2': 1
        },
        splitMode: 'shares'
      };

      const result = calculationService.calculateSharesBasedBalances(costItem);

      const total = Object.values(result.balances).reduce((sum, amount) => sum + amount, 0);
      expect(total).toBe(0.01);
    });

    test('should handle large share ratios', () => {
      const costItem = {
        id: 'cost1',
        amount: 1000,
        paidBy: 'user1',
        splitShares: {
          'user1': 1,
          'user2': 99  // Very unequal split
        },
        splitMode: 'shares'
      };

      const result = calculationService.calculateSharesBasedBalances(costItem);

      expect(result.balances['user1']).toBe(10.00);  // 1/100 of $1000
      expect(result.balances['user2']).toBe(990.00); // 99/100 of $1000

      const total = Object.values(result.balances).reduce((sum, amount) => sum + amount, 0);
      expect(total).toBe(1000);
    });
  });
});