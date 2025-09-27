const CostItem = require('../../../src/models/CostItem');
const { ValidationError } = require('../../../src/utils/errors');

describe('CostItem Shares-Based Functionality', () => {
  const PAID_BY_USER = '123e4567-e89b-12d3-a456-426614174001';
  const USER_2 = '223e4567-e89b-12d3-a456-426614174002';
  const USER_3 = '323e4567-e89b-12d3-a456-426614174003';

  describe('Constructor and Split Mode Detection', () => {
    test('should detect shares mode correctly', () => {
      const costItemData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 100,
        paidBy: PAID_BY_USER,
        date: '2025-09-24',
        splitShares: {
          [PAID_BY_USER]: 1,
          [USER_2]: 1,
          [USER_3]: 2
        }
      };

      const costItem = new CostItem(costItemData);

      expect(costItem.splitMode).toBe('shares');
      expect(costItem.splitShares).toEqual(costItemData.splitShares);
    });

    test('should detect percentage mode correctly', () => {
      const costItemData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 100,
        paidBy: PAID_BY_USER,
        date: '2025-09-24',
        splitPercentage: {
          [PAID_BY_USER]: 50,
          [USER_2]: 50
        }
      };

      const costItem = new CostItem(costItemData);

      expect(costItem.splitMode).toBe('percentage');
      expect(costItem.splitPercentage).toEqual(costItemData.splitPercentage);
    });

    test('should prefer shares over percentages when both provided', () => {
      const costItemData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 100,
        paidBy: PAID_BY_USER,
        date: '2025-09-24',
        splitShares: {
          [PAID_BY_USER]: 1,
          [USER_2]: 1
        },
        splitPercentage: {
          [PAID_BY_USER]: 50,
          [USER_2]: 50
        }
      };

      const costItem = new CostItem(costItemData);

      expect(costItem.splitMode).toBe('shares');
    });
  });

  describe('Shares-Based Calculation Methods', () => {
    test('should calculate equal shares correctly', () => {
      const costItemData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 60,
        paidBy: PAID_BY_USER,
        date: '2025-09-24',
        splitShares: {
          [PAID_BY_USER]: 1,
          [USER_2]: 1,
          [USER_3]: 1
        }
      };

      const costItem = new CostItem(costItemData);
      const shares = costItem.calculateShares();

      // Each person should owe exactly $20.00
      expect(shares[PAID_BY_USER]).toBe(20.00);
      expect(shares[USER_2]).toBe(20.00);
      expect(shares[USER_3]).toBe(20.00);

      // Total should equal original amount
      const total = Object.values(shares).reduce((sum, amount) => sum + amount, 0);
      expect(total).toBe(60);
    });

    test('should calculate unequal shares correctly', () => {
      const costItemData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 100,
        paidBy: PAID_BY_USER,
        date: '2025-09-24',
        splitShares: {
          [PAID_BY_USER]: 1,  // 1/4 = 25%
          [USER_2]: 2,        // 2/4 = 50%
          [USER_3]: 1         // 1/4 = 25%
        }
      };

      const costItem = new CostItem(costItemData);
      const shares = costItem.calculateShares();

      expect(shares[PAID_BY_USER]).toBe(25.00);
      expect(shares[USER_2]).toBe(50.00);
      expect(shares[USER_3]).toBe(25.00);

      // Total should equal original amount
      const total = Object.values(shares).reduce((sum, amount) => sum + amount, 0);
      expect(total).toBe(100);
    });

    test('should handle rounding correctly to ensure total equals original amount', () => {
      const costItemData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 10,  // Amount that doesn't divide evenly by 3
        paidBy: PAID_BY_USER,
        date: '2025-09-24',
        splitShares: {
          [PAID_BY_USER]: 1,
          [USER_2]: 1,
          [USER_3]: 1
        }
      };

      const costItem = new CostItem(costItemData);
      const shares = costItem.calculateShares();

      // Total should still equal original amount despite rounding
      const total = Object.values(shares).reduce((sum, amount) => sum + amount, 0);
      expect(total).toBe(10);

      // Each amount should be reasonable
      Object.values(shares).forEach(amount => {
        expect(amount).toBeGreaterThan(3);
        expect(amount).toBeLessThan(4);
      });
    });
  });

  describe('Participant Management (Shares Mode)', () => {
    test('should identify excluded participants correctly', () => {
      const costItemData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 100,
        paidBy: PAID_BY_USER,
        date: '2025-09-24',
        splitShares: {
          [PAID_BY_USER]: 1,
          [USER_2]: 0,  // excluded
          [USER_3]: 2
        }
      };

      const costItem = new CostItem(costItemData);

      const excluded = costItem.getExcludedParticipants();
      const included = costItem.getIncludedParticipants();

      expect(excluded).toEqual([USER_2]);
      expect(included).toEqual([PAID_BY_USER, USER_3]);
    });

    test('should detect equal split correctly for shares', () => {
      const equalSplitData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 100,
        paidBy: PAID_BY_USER,
        date: '2025-09-24',
        splitShares: {
          [PAID_BY_USER]: 1,
          [USER_2]: 1,
          [USER_3]: 1
        }
      };

      const unequalSplitData = {
        ...equalSplitData,
        splitShares: {
          [PAID_BY_USER]: 1,
          [USER_2]: 2,
          [USER_3]: 1
        }
      };

      const equalCostItem = new CostItem(equalSplitData);
      const unequalCostItem = new CostItem(unequalSplitData);

      expect(equalCostItem.isEqualSplit()).toBe(true);
      expect(unequalCostItem.isEqualSplit()).toBe(false);
    });
  });

  describe('Static Helper Methods', () => {
    test('should generate equal shares correctly', () => {
      const participantIds = [PAID_BY_USER, USER_2, USER_3, 'user4'];
      const shares = CostItem.generateEqualShares(participantIds);

      expect(Object.keys(shares)).toHaveLength(4);
      expect(shares[PAID_BY_USER]).toBe(1);
      expect(shares[USER_2]).toBe(1);
      expect(shares[USER_3]).toBe(1);
      expect(shares['user4']).toBe(1);
    });

    test('should convert equal percentages to shares correctly', () => {
      const splitPercentage = {
        [PAID_BY_USER]: 33.33,
        [USER_2]: 33.33,
        [USER_3]: 33.34
      };

      const shares = CostItem.convertPercentagesToShares(splitPercentage);

      expect(shares[PAID_BY_USER]).toBe(1);
      expect(shares[USER_2]).toBe(1);
      expect(shares[USER_3]).toBe(1);
    });

    test('should convert custom percentages to proportional shares', () => {
      const splitPercentage = {
        [PAID_BY_USER]: 25,    // 1 share
        [USER_2]: 50,          // 2 shares
        [USER_3]: 25           // 1 share
      };

      const shares = CostItem.convertPercentagesToShares(splitPercentage);

      expect(shares[PAID_BY_USER]).toBe(1);
      expect(shares[USER_2]).toBe(2);
      expect(shares[USER_3]).toBe(1);
    });

    test('should convert shares to percentages correctly', () => {
      const splitShares = {
        [PAID_BY_USER]: 1,
        [USER_2]: 2,
        [USER_3]: 1
      };

      const percentages = CostItem.convertSharesToPercentages(splitShares);

      expect(percentages[PAID_BY_USER]).toBe(25);
      expect(percentages[USER_2]).toBe(50);
      expect(percentages[USER_3]).toBe(25);

      // Should sum to 100%
      const total = Object.values(percentages).reduce((sum, pct) => sum + pct, 0);
      expect(total).toBe(100);
    });
  });

  describe('toJSON Method with Shares', () => {
    test('should include shares data in JSON output', () => {
      const costItemData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 100,
        paidBy: PAID_BY_USER,
        date: '2025-09-24',
        splitShares: {
          [PAID_BY_USER]: 1,
          [USER_2]: 2,
          [USER_3]: 1
        }
      };

      const costItem = new CostItem(costItemData);
      const json = costItem.toJSON();

      expect(json.splitShares).toEqual(costItemData.splitShares);
      expect(json.splitMode).toBe('shares');
      expect(json.participantCount).toBe(3);
    });
  });

  describe('Error Cases', () => {
    test('should throw error when neither shares nor percentages provided', () => {
      const costItemData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 100,
        paidBy: PAID_BY_USER,
        date: '2025-09-24'
        // No splitShares or splitPercentage
      };

      expect(() => {
        new CostItem(costItemData);
      }).toThrow('Cost item validation failed: Either split shares or split percentage must be provided');
    });

    test('should throw error when paidBy not included in shares', () => {
      const costItemData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Cost Item',
        amount: 100,
        paidBy: PAID_BY_USER,
        date: '2025-09-24',
        splitShares: {
          [USER_2]: 1,  // paidBy user not included - this should cause error
          [USER_3]: 1
        }
      };

      expect(() => {
        new CostItem(costItemData);
      }).toThrow('Cost item validation failed: The person who paid must be included in the split');
    });
  });
});