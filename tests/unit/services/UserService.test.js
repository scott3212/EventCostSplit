const UserService = require('../../../src/services/UserService');
const User = require('../../../src/models/User');
const { ValidationError, NotFoundError } = require('../../../src/utils/errors');

describe('UserService', () => {
  let userService;
  let mockUserRepo;
  let mockCalculationService;

  beforeEach(() => {
    mockUserRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      searchByName: jest.fn(),
      isNameUnique: jest.fn(),
      isEmailUnique: jest.fn(),
      updateBalance: jest.fn(),
      adjustBalance: jest.fn(),
      findUsersWithBalances: jest.fn(),
      findUsersOwingMoney: jest.fn(),
      findUsersOwedMoney: jest.fn(),
      findSettledUsers: jest.fn(),
      getBalanceSummary: jest.fn(),
      findRecentUsers: jest.fn(),
      findUsersByBalance: jest.fn(),
    };

    mockCalculationService = {
      calculateUserBalance: jest.fn(),
    };

    userService = new UserService(mockUserRepo, mockCalculationService);
  });

  describe('createUser', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890'
    };

    it('should create a user with valid data', async () => {
      const createdUser = { id: 'user1', ...validUserData, totalBalance: 0 };
      
      mockUserRepo.isNameUnique.mockResolvedValue(true);
      mockUserRepo.isEmailUnique.mockResolvedValue(true);
      mockUserRepo.create.mockResolvedValue(createdUser);

      const result = await userService.createUser(validUserData);

      expect(mockUserRepo.isNameUnique).toHaveBeenCalledWith('John Doe');
      expect(mockUserRepo.isEmailUnique).toHaveBeenCalledWith('john@example.com');
      expect(mockUserRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890'
      }));
      expect(result).toEqual(createdUser);
    });

    it('should throw error for invalid user data', async () => {
      const invalidUserData = { name: '' };

      await expect(userService.createUser(invalidUserData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error if name is not unique', async () => {
      mockUserRepo.isNameUnique.mockResolvedValue(false);

      await expect(userService.createUser(validUserData))
        .rejects.toThrow('A user with this name already exists');
    });

    it('should throw error if email is not unique', async () => {
      mockUserRepo.isNameUnique.mockResolvedValue(true);
      mockUserRepo.isEmailUnique.mockResolvedValue(false);

      await expect(userService.createUser(validUserData))
        .rejects.toThrow('A user with this email already exists');
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const user = { id: 'user1', name: 'John Doe' };
      mockUserRepo.findById.mockResolvedValue(user);

      const result = await userService.getUserById('user1');

      expect(result).toEqual(user);
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user1');
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.getUserById('invalid'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if no ID provided', async () => {
      await expect(userService.getUserById(''))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateUser', () => {
    const existingUser = {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com'
    };

    it('should update user with valid data', async () => {
      const updateData = { name: 'Jane Doe' };
      const updatedUser = { ...existingUser, ...updateData };

      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.isNameUnique.mockResolvedValue(true);
      mockUserRepo.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('user1', updateData);

      expect(mockUserRepo.isNameUnique).toHaveBeenCalledWith('Jane Doe', 'user1');
      expect(mockUserRepo.update).toHaveBeenCalledWith('user1', updateData);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.updateUser('invalid', { name: 'Test' }))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw error if name is not unique', async () => {
      const updateData = { name: 'Existing Name' };

      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.isNameUnique.mockResolvedValue(false);

      await expect(userService.updateUser('user1', updateData))
        .rejects.toThrow('A user with this name already exists');
    });
  });

  describe('deleteUser', () => {
    it('should delete user with zero balance', async () => {
      const user = { id: 'user1', name: 'John Doe' };
      const balance = { netBalance: 0 };

      mockUserRepo.findById.mockResolvedValue(user);
      mockCalculationService.calculateUserBalance.mockResolvedValue(balance);
      mockUserRepo.delete.mockResolvedValue(true);

      const result = await userService.deleteUser('user1');

      expect(mockUserRepo.delete).toHaveBeenCalledWith('user1');
      expect(result).toBe(true);
    });

    it('should throw error if user has outstanding balance', async () => {
      const user = { id: 'user1', name: 'John Doe' };
      const balance = { netBalance: 10.50 };

      mockUserRepo.findById.mockResolvedValue(user);
      mockCalculationService.calculateUserBalance.mockResolvedValue(balance);

      await expect(userService.deleteUser('user1'))
        .rejects.toThrow('Cannot delete user with outstanding balance');
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.deleteUser('invalid'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserBalance', () => {
    it('should return user balance', async () => {
      const user = { id: 'user1', name: 'John Doe' };
      const balance = { userId: 'user1', netBalance: 25.50 };

      mockUserRepo.findById.mockResolvedValue(user);
      mockCalculationService.calculateUserBalance.mockResolvedValue(balance);

      const result = await userService.getUserBalance('user1');

      expect(result).toEqual(balance);
      expect(mockCalculationService.calculateUserBalance).toHaveBeenCalledWith('user1');
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.getUserBalance('invalid'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('searchUsers', () => {
    it('should return search results', async () => {
      const searchResults = [
        { id: 'user1', name: 'John Doe' },
        { id: 'user2', name: 'John Smith' }
      ];

      mockUserRepo.searchByName.mockResolvedValue(searchResults);

      const result = await userService.searchUsers('John');

      expect(result).toEqual(searchResults);
      expect(mockUserRepo.searchByName).toHaveBeenCalledWith('John');
    });

    it('should return empty array for empty search term', async () => {
      const result = await userService.searchUsers('');

      expect(result).toEqual([]);
      expect(mockUserRepo.searchByName).not.toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should return user with balance details', async () => {
      const user = { id: 'user1', name: 'John Doe' };
      const balance = { userId: 'user1', netBalance: 15.25 };

      mockUserRepo.findById.mockResolvedValue(user);
      mockCalculationService.calculateUserBalance.mockResolvedValue(balance);

      const result = await userService.getUserProfile('user1');

      expect(result).toEqual({
        ...user,
        balanceDetails: balance
      });
    });
  });

  describe('updateUserBalance', () => {
    it('should update user balance', async () => {
      const user = { id: 'user1', name: 'John Doe' };
      const updatedUser = { ...user, totalBalance: 50.75 };

      mockUserRepo.findById.mockResolvedValue(user);
      mockUserRepo.updateBalance.mockResolvedValue(updatedUser);

      const result = await userService.updateUserBalance('user1', 50.75);

      expect(mockUserRepo.updateBalance).toHaveBeenCalledWith('user1', 50.75);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error for invalid balance', async () => {
      await expect(userService.updateUserBalance('user1', 'invalid'))
        .rejects.toThrow('Balance must be a number');
    });
  });

  describe('isNameAvailable', () => {
    it('should return true if name is available', async () => {
      mockUserRepo.isNameUnique.mockResolvedValue(true);

      const result = await userService.isNameAvailable('New Name');

      expect(result).toBe(true);
      expect(mockUserRepo.isNameUnique).toHaveBeenCalledWith('New Name', null);
    });

    it('should return false if name is taken', async () => {
      mockUserRepo.isNameUnique.mockResolvedValue(false);

      const result = await userService.isNameAvailable('Existing Name');

      expect(result).toBe(false);
    });

    it('should return false for empty name', async () => {
      const result = await userService.isNameAvailable('');

      expect(result).toBe(false);
      expect(mockUserRepo.isNameUnique).not.toHaveBeenCalled();
    });
  });

  describe('getUserStatistics', () => {
    it('should return comprehensive user statistics', async () => {
      const allUsers = [{ id: 'user1' }, { id: 'user2' }];
      const balanceSummary = { totalUsers: 2, totalAmountOwed: 100 };

      mockUserRepo.findAll.mockResolvedValue(allUsers);
      mockUserRepo.findUsersWithBalances.mockResolvedValue([{ id: 'user1' }]);
      mockUserRepo.findUsersOwingMoney.mockResolvedValue([]);
      mockUserRepo.findUsersOwedMoney.mockResolvedValue([{ id: 'user1' }]);
      mockUserRepo.findSettledUsers.mockResolvedValue([{ id: 'user2' }]);
      mockUserRepo.getBalanceSummary.mockResolvedValue(balanceSummary);

      const result = await userService.getUserStatistics();

      expect(result).toEqual({
        totalUsers: 2,
        usersWithBalances: 1,
        usersOwing: 0,
        usersOwed: 1,
        settledUsers: 1,
        balanceSummary
      });
    });
  });
});