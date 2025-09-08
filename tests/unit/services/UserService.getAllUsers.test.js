const UserService = require('../../../src/services/UserService');
const { NotFoundError } = require('../../../src/utils/errors');

describe('UserService - getAllUsers with Balance Calculations', () => {
  let userService;
  let mockUserRepo;
  let mockCalculationService;

  beforeEach(() => {
    mockUserRepo = {
      findAll: jest.fn(),
    };

    mockCalculationService = {
      calculateUserBalance: jest.fn(),
    };

    userService = new UserService(mockUserRepo, mockCalculationService);
  });

  describe('getAllUsers', () => {
    it('should return users with calculated balances', async () => {
      const mockUsers = [
        { id: 'user1', name: 'Alice', email: 'alice@test.com', totalBalance: 0 },
        { id: 'user2', name: 'Bob', email: 'bob@test.com', totalBalance: 0 }
      ];

      const mockBalanceUser1 = { netBalance: 50.25, totalOwes: 25, totalPaid: 75.25 };
      const mockBalanceUser2 = { netBalance: -30.50, totalOwes: 60.50, totalPaid: 30 };

      mockUserRepo.findAll.mockResolvedValue(mockUsers);
      mockCalculationService.calculateUserBalance
        .mockResolvedValueOnce(mockBalanceUser1)
        .mockResolvedValueOnce(mockBalanceUser2);

      const result = await userService.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...mockUsers[0],
        totalBalance: 50.25
      });
      expect(result[1]).toEqual({
        ...mockUsers[1],
        totalBalance: -30.50
      });

      expect(mockCalculationService.calculateUserBalance).toHaveBeenCalledWith('user1');
      expect(mockCalculationService.calculateUserBalance).toHaveBeenCalledWith('user2');
      expect(mockCalculationService.calculateUserBalance).toHaveBeenCalledTimes(2);
    });

    it('should handle balance calculation errors gracefully', async () => {
      const mockUsers = [
        { id: 'user1', name: 'Alice', email: 'alice@test.com', totalBalance: 0 },
        { id: 'user2', name: 'Bob', email: 'bob@test.com', totalBalance: 0 }
      ];

      const mockBalanceUser1 = { netBalance: 25.75 };
      const balanceError = new Error('Balance calculation failed');

      mockUserRepo.findAll.mockResolvedValue(mockUsers);
      mockCalculationService.calculateUserBalance
        .mockResolvedValueOnce(mockBalanceUser1)
        .mockRejectedValueOnce(balanceError);

      // Spy on console.warn to check error logging
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await userService.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...mockUsers[0],
        totalBalance: 25.75
      });
      expect(result[1]).toEqual({
        ...mockUsers[1],
        totalBalance: 0  // Fallback to 0 when calculation fails
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to calculate balance for user user2:',
        'Balance calculation failed'
      );

      consoleSpy.mockRestore();
    });

    it('should return empty array when no users exist', async () => {
      mockUserRepo.findAll.mockResolvedValue([]);

      const result = await userService.getAllUsers();

      expect(result).toEqual([]);
      expect(mockCalculationService.calculateUserBalance).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const repoError = new Error('Database connection failed');
      mockUserRepo.findAll.mockRejectedValue(repoError);

      await expect(userService.getAllUsers()).rejects.toThrow('Database connection failed');
      expect(mockCalculationService.calculateUserBalance).not.toHaveBeenCalled();
    });

    it('should preserve user data structure and add totalBalance', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        totalBalance: 0  // Original value should be overwritten
      };

      const mockBalance = { 
        netBalance: 123.45,
        totalOwes: 50,
        totalPaid: 173.45,
        status: 'owed'
      };

      mockUserRepo.findAll.mockResolvedValue([mockUser]);
      mockCalculationService.calculateUserBalance.mockResolvedValue(mockBalance);

      const result = await userService.getAllUsers();

      expect(result[0]).toEqual({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        totalBalance: 123.45  // Updated with calculated balance
      });
    });

    it('should handle complex balance scenarios correctly', async () => {
      const mockUsers = [
        { id: 'user1', name: 'Owes Money' },
        { id: 'user2', name: 'Owed Money' },
        { id: 'user3', name: 'Settled' }
      ];

      mockUserRepo.findAll.mockResolvedValue(mockUsers);
      mockCalculationService.calculateUserBalance
        .mockResolvedValueOnce({ netBalance: -45.67 })  // Owes money
        .mockResolvedValueOnce({ netBalance: 78.33 })   // Owed money
        .mockResolvedValueOnce({ netBalance: 0.00 });   // Settled

      const result = await userService.getAllUsers();

      expect(result[0].totalBalance).toBe(-45.67);
      expect(result[1].totalBalance).toBe(78.33);
      expect(result[2].totalBalance).toBe(0.00);
    });
  });
});