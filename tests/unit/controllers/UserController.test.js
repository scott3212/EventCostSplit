const UserController = require('../../../src/controllers/UserController');
const { ValidationError, NotFoundError } = require('../../../src/utils/errors');

describe('UserController', () => {
  let userController;
  let mockUserService;
  let req;
  let res;

  beforeEach(() => {
    mockUserService = {
      createUser: jest.fn(),
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getUserBalance: jest.fn(),
      updateUserBalance: jest.fn(),
      adjustUserBalance: jest.fn(),
      getUserEvents: jest.fn(),
      getUserPayments: jest.fn(),
      getUserCostItems: jest.fn(),
      getUserStatistics: jest.fn(),
      getUserBalanceBreakdown: jest.fn(),
      findUsersByName: jest.fn(),
      findUsersByEmail: jest.fn(),
      getActiveUsers: jest.fn(),
      getUsersWithDebt: jest.fn(),
      getUsersWithCredit: jest.fn(),
      validateUserData: jest.fn()
    };

    userController = new UserController(mockUserService);

    req = {
      body: {},
      params: {},
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('createUser', () => {
    test('should create user successfully', async () => {
      const userData = {
        id: '12345678-1234-1234-1234-123456789012',
        name: 'John Doe',
        email: 'john@example.com',
        balance: 0
      };
      req.body = userData;
      mockUserService.createUser.mockResolvedValue(userData);

      await userController.createUser(req, res);

      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: userData,
        message: 'User created successfully'
      });
    });

    test('should return 400 for validation error', async () => {
      req.body = { name: '' };
      mockUserService.createUser.mockRejectedValue(new ValidationError('Name is required'));

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Name is required'
      });
    });

    test('should return 500 for server error', async () => {
      req.body = { name: 'John' };
      mockUserService.createUser.mockRejectedValue(new Error('Server error'));

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create user'
      });
    });
  });

  describe('getAllUsers', () => {
    test('should get all users successfully', async () => {
      const users = [
        { id: '12345678-1234-1234-1234-123456789012', name: 'John' },
        { id: '12345678-1234-1234-1234-123456789013', name: 'Jane' }
      ];
      mockUserService.getAllUsers.mockResolvedValue(users);

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: users,
        count: 2
      });
    });

    test('should return 500 for server error', async () => {
      mockUserService.getAllUsers.mockRejectedValue(new Error('Server error'));

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve users'
      });
    });
  });

  describe('getUserById', () => {
    test('should get user by id successfully', async () => {
      const user = { id: '12345678-1234-1234-1234-123456789012', name: 'John' };
      req.params.id = user.id;
      mockUserService.getUserById.mockResolvedValue(user);

      await userController.getUserById(req, res);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(user.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: user
      });
    });

    test('should return 404 for not found error', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockUserService.getUserById.mockRejectedValue(new NotFoundError('User not found'));

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    test('should return 400 for validation error', async () => {
      req.params.id = '';
      mockUserService.getUserById.mockRejectedValue(new ValidationError('User ID is required'));

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required'
      });
    });
  });

  describe('updateUser', () => {
    test('should update user successfully', async () => {
      const updatedUser = { id: '12345678-1234-1234-1234-123456789012', name: 'John Updated' };
      req.params.id = updatedUser.id;
      req.body = { name: 'John Updated' };
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      await userController.updateUser(req, res);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(updatedUser.id, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockUserService.deleteUser.mockResolvedValue(true);

      await userController.deleteUser(req, res);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(req.params.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully'
      });
    });
  });

  describe('getUserBalance', () => {
    test('should get user balance successfully', async () => {
      const balance = 25.50;
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockUserService.getUserBalance.mockResolvedValue(balance);

      await userController.getUserBalance(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { balance }
      });
    });
  });

  describe('updateUserBalance', () => {
    test('should update user balance successfully', async () => {
      const user = { id: '12345678-1234-1234-1234-123456789012', balance: 100 };
      req.params.id = user.id;
      req.body = { balance: 100 };
      mockUserService.updateUserBalance.mockResolvedValue(user);

      await userController.updateUserBalance(req, res);

      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith(user.id, 100);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: user,
        message: 'User balance updated successfully'
      });
    });

    test('should return 400 if balance is not a number', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      req.body = { balance: 'not a number' };

      await userController.updateUserBalance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Balance must be a number'
      });
    });
  });

  describe('adjustUserBalance', () => {
    test('should adjust user balance successfully', async () => {
      const user = { id: '12345678-1234-1234-1234-123456789012', balance: 75 };
      req.params.id = user.id;
      req.body = { amount: 25 };
      mockUserService.adjustUserBalance.mockResolvedValue(user);

      await userController.adjustUserBalance(req, res);

      expect(mockUserService.adjustUserBalance).toHaveBeenCalledWith(user.id, 25);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 if amount is not a number', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      req.body = { amount: 'not a number' };

      await userController.adjustUserBalance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Amount must be a number'
      });
    });
  });

  describe('getUserEvents', () => {
    test('should get user events successfully', async () => {
      const events = [
        { id: '12345678-1234-1234-1234-123456789012', name: 'Event 1' },
        { id: '12345678-1234-1234-1234-123456789013', name: 'Event 2' }
      ];
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockUserService.getUserEvents.mockResolvedValue(events);

      await userController.getUserEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: events,
        count: 2
      });
    });
  });

  describe('getUserPayments', () => {
    test('should get user payments successfully', async () => {
      const payments = [
        { id: '12345678-1234-1234-1234-123456789012', amount: 50 },
        { id: '12345678-1234-1234-1234-123456789013', amount: 75 }
      ];
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockUserService.getUserPayments.mockResolvedValue(payments);

      await userController.getUserPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: payments,
        count: 2
      });
    });
  });

  describe('getUserCostItems', () => {
    test('should get user cost items successfully', async () => {
      const costItems = [
        { id: '12345678-1234-1234-1234-123456789012', description: 'Dinner' },
        { id: '12345678-1234-1234-1234-123456789013', description: 'Lunch' }
      ];
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockUserService.getUserCostItems.mockResolvedValue(costItems);

      await userController.getUserCostItems(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: costItems,
        count: 2
      });
    });
  });

  describe('getUserStatistics', () => {
    test('should get user statistics successfully', async () => {
      const statistics = {
        totalPayments: 5,
        totalAmount: 250,
        averageAmount: 50
      };
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockUserService.getUserStatistics.mockResolvedValue(statistics);

      await userController.getUserStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: statistics
      });
    });
  });

  describe('getUserBalanceBreakdown', () => {
    test('should get user balance breakdown successfully', async () => {
      const breakdown = {
        totalOwed: 150,
        totalOwing: 100,
        netBalance: 50
      };
      req.params.id = '12345678-1234-1234-1234-123456789012';
      mockUserService.getUserBalanceBreakdown.mockResolvedValue(breakdown);

      await userController.getUserBalanceBreakdown(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: breakdown
      });
    });
  });

  describe('findUsersByName', () => {
    test('should find users by name successfully', async () => {
      const users = [{ id: '12345678-1234-1234-1234-123456789012', name: 'John Doe' }];
      req.query.name = 'John';
      mockUserService.findUsersByName.mockResolvedValue(users);

      await userController.findUsersByName(req, res);

      expect(mockUserService.findUsersByName).toHaveBeenCalledWith('John');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: users,
        count: 1
      });
    });

    test('should return 400 if name parameter is missing', async () => {
      req.query = {};

      await userController.findUsersByName(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Name parameter is required'
      });
    });
  });

  describe('findUsersByEmail', () => {
    test('should find users by email successfully', async () => {
      const users = [{ id: '12345678-1234-1234-1234-123456789012', email: 'john@example.com' }];
      req.query.email = 'john';
      mockUserService.findUsersByEmail.mockResolvedValue(users);

      await userController.findUsersByEmail(req, res);

      expect(mockUserService.findUsersByEmail).toHaveBeenCalledWith('john');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 if email parameter is missing', async () => {
      req.query = {};

      await userController.findUsersByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email parameter is required'
      });
    });
  });

  describe('getActiveUsers', () => {
    test('should get active users successfully', async () => {
      const users = [{ id: '12345678-1234-1234-1234-123456789012', name: 'Active User' }];
      req.query.days = '30';
      mockUserService.getActiveUsers.mockResolvedValue(users);

      await userController.getActiveUsers(req, res);

      expect(mockUserService.getActiveUsers).toHaveBeenCalledWith(30);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should use default days when not provided', async () => {
      const users = [];
      mockUserService.getActiveUsers.mockResolvedValue(users);

      await userController.getActiveUsers(req, res);

      expect(mockUserService.getActiveUsers).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getUsersWithDebt', () => {
    test('should get users with debt successfully', async () => {
      const users = [{ id: '12345678-1234-1234-1234-123456789012', balance: -50 }];
      mockUserService.getUsersWithDebt.mockResolvedValue(users);

      await userController.getUsersWithDebt(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: users,
        count: 1
      });
    });
  });

  describe('getUsersWithCredit', () => {
    test('should get users with credit successfully', async () => {
      const users = [{ id: '12345678-1234-1234-1234-123456789012', balance: 50 }];
      mockUserService.getUsersWithCredit.mockResolvedValue(users);

      await userController.getUsersWithCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: users,
        count: 1
      });
    });
  });

  describe('validateUserData', () => {
    test('should validate user data successfully', async () => {
      const userData = { name: 'John', email: 'john@example.com' };
      const validation = { isValid: true, errors: [] };
      req.body = userData;
      mockUserService.validateUserData.mockReturnValue(validation);

      await userController.validateUserData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: validation
      });
    });
  });
});