const { validators, ValidationError, validateCostItemData } = require('../../../src/utils/validators');

describe('Validators Shares-Based Functionality', () => {

  describe('splitShares Validator', () => {
    test('should accept valid shares object', () => {
      const validShares = {
        'user1': 1,
        'user2': 2,
        'user3': 1
      };

      expect(() => {
        validators.splitShares(validShares);
      }).not.toThrow();

      const result = validators.splitShares(validShares);
      expect(result).toEqual(validShares);
    });

    test('should accept shares with zero values', () => {
      const sharesWithZero = {
        'user1': 1,
        'user2': 0,  // excluded participant
        'user3': 2
      };

      expect(() => {
        validators.splitShares(sharesWithZero);
      }).not.toThrow();
    });

    test('should throw error for null/undefined shares', () => {
      expect(() => {
        validators.splitShares(null);
      }).toThrow(ValidationError);

      expect(() => {
        validators.splitShares(undefined);
      }).toThrow(ValidationError);
    });

    test('should throw error for non-object shares', () => {
      expect(() => {
        validators.splitShares('not an object');
      }).toThrow(ValidationError);

      expect(() => {
        validators.splitShares(123);
      }).toThrow(ValidationError);

      expect(() => {
        validators.splitShares([1, 2, 3]);
      }).toThrow(ValidationError);
    });

    test('should throw error for negative share values', () => {
      const invalidShares = {
        'user1': 1,
        'user2': -1,  // negative shares
        'user3': 2
      };

      expect(() => {
        validators.splitShares(invalidShares);
      }).toThrow(ValidationError);
    });

    test('should throw error for non-integer share values', () => {
      const invalidShares = {
        'user1': 1,
        'user2': 1.5,  // decimal shares not allowed
        'user3': 2
      };

      expect(() => {
        validators.splitShares(invalidShares);
      }).toThrow(ValidationError);
    });

    test('should throw error when all shares are zero', () => {
      const allZeroShares = {
        'user1': 0,
        'user2': 0,
        'user3': 0
      };

      expect(() => {
        validators.splitShares(allZeroShares);
      }).toThrow(ValidationError);
    });

    test('should accept string numbers that convert to integers', () => {
      const stringShares = {
        'user1': '1',
        'user2': '2',
        'user3': '0'
      };

      expect(() => {
        validators.splitShares(stringShares);
      }).not.toThrow();
    });

    test('should throw error for string numbers that are not integers', () => {
      const invalidStringShares = {
        'user1': '1',
        'user2': '1.5',  // decimal as string
        'user3': '2'
      };

      expect(() => {
        validators.splitShares(invalidStringShares);
      }).toThrow(ValidationError);
    });
  });

  describe('validateCostItemData with Shares', () => {
    const baseValidData = {
      eventId: '123e4567-e89b-12d3-a456-426614174000',
      description: 'Test Cost Item',
      amount: 100,
      paidBy: '123e4567-e89b-12d3-a456-426614174001',
      date: '2025-09-24'
    };

    test('should accept valid shares-based cost item data', () => {
      const costItemData = {
        ...baseValidData,
        splitShares: {
          '123e4567-e89b-12d3-a456-426614174001': 1,
          '123e4567-e89b-12d3-a456-426614174002': 2,
          '123e4567-e89b-12d3-a456-426614174003': 1
        }
      };

      const result = validateCostItemData(costItemData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept valid percentage-based cost item data', () => {
      const costItemData = {
        ...baseValidData,
        splitPercentage: {
          '123e4567-e89b-12d3-a456-426614174001': 50,
          '123e4567-e89b-12d3-a456-426614174002': 50
        }
      };

      const result = validateCostItemData(costItemData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept both shares and percentages (shares takes precedence)', () => {
      const costItemData = {
        ...baseValidData,
        splitShares: {
          '123e4567-e89b-12d3-a456-426614174001': 1,
          '123e4567-e89b-12d3-a456-426614174002': 1
        },
        splitPercentage: {
          '123e4567-e89b-12d3-a456-426614174001': 50,
          '123e4567-e89b-12d3-a456-426614174002': 50
        }
      };

      const result = validateCostItemData(costItemData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject cost item data with neither shares nor percentages', () => {
      const costItemData = {
        ...baseValidData
        // No splitShares or splitPercentage
      };

      const result = validateCostItemData(costItemData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Either split shares or split percentages are required');
    });

    test('should reject cost item data with invalid shares', () => {
      const costItemData = {
        ...baseValidData,
        splitShares: {
          '123e4567-e89b-12d3-a456-426614174001': -1,  // negative shares
          '123e4567-e89b-12d3-a456-426614174002': 2
        }
      };

      const result = validateCostItemData(costItemData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('non-negative whole number'))).toBe(true);
    });

    test('should reject cost item data with all zero shares', () => {
      const costItemData = {
        ...baseValidData,
        splitShares: {
          '123e4567-e89b-12d3-a456-426614174001': 0,
          '123e4567-e89b-12d3-a456-426614174002': 0
        }
      };

      const result = validateCostItemData(costItemData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('At least one person must have a share greater than 0'))).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle typical equal split shares', () => {
      const equalSplitShares = {
        'user1': 1,
        'user2': 1,
        'user3': 1,
        'user4': 1
      };

      expect(() => {
        validators.splitShares(equalSplitShares);
      }).not.toThrow();
    });

    test('should handle custom split with exclusions', () => {
      const customSplitShares = {
        'alice': 2,    // Alice takes double portion
        'bob': 1,      // Bob normal portion
        'charlie': 0,  // Charlie excluded
        'diana': 1     // Diana normal portion
      };

      expect(() => {
        validators.splitShares(customSplitShares);
      }).not.toThrow();
    });

    test('should handle large groups', () => {
      const largeGroupShares = {};
      for (let i = 1; i <= 20; i++) {
        largeGroupShares[`user${i}`] = 1;
      }

      expect(() => {
        validators.splitShares(largeGroupShares);
      }).not.toThrow();
    });

    test('should handle complex unequal splits', () => {
      const complexShares = {
        'organizer': 3,  // Organizer gets larger share
        'regular1': 2,   // Regular attendees
        'regular2': 2,
        'regular3': 2,
        'student1': 1,   // Students get smaller share
        'student2': 1,
        'guest': 0       // Guest excluded
      };

      expect(() => {
        validators.splitShares(complexShares);
      }).not.toThrow();
    });
  });

  describe('Error Messages', () => {
    test('should provide clear error message for negative shares', () => {
      const invalidShares = {
        'user1': -1
      };

      expect(() => {
        validators.splitShares(invalidShares);
      }).toThrow('Each person\'s share count must be a non-negative whole number');
    });

    test('should provide clear error message for decimal shares', () => {
      const invalidShares = {
        'user1': 1.5
      };

      expect(() => {
        validators.splitShares(invalidShares);
      }).toThrow('Each person\'s share count must be a non-negative whole number');
    });

    test('should provide clear error message for all zero shares', () => {
      const invalidShares = {
        'user1': 0,
        'user2': 0
      };

      expect(() => {
        validators.splitShares(invalidShares);
      }).toThrow('At least one person must have a share greater than 0');
    });

    test('should provide clear error message for non-object input', () => {
      expect(() => {
        validators.splitShares('invalid');
      }).toThrow('Split shares configuration is required');
    });
  });
});