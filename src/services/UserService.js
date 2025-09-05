const User = require('../models/User');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { validateUserData, validateUserUpdate } = require('../utils/validators');

/**
 * Service for user-related business logic
 * Handles user CRUD operations with validation and business rules
 */
class UserService {
  constructor(userRepository, calculationService, eventRepository = null, paymentRepository = null) {
    this.userRepo = userRepository;
    this.calculationService = calculationService;
    this.eventRepo = eventRepository;
    this.paymentRepo = paymentRepository;
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    // Validate input data
    const validation = validateUserData(userData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Check if name is unique
    const isNameUnique = await this.userRepo.isNameUnique(userData.name);
    if (!isNameUnique) {
      throw new ValidationError('A user with this name already exists');
    }

    // Check if email is unique (if provided)
    if (userData.email) {
      const isEmailUnique = await this.userRepo.isEmailUnique(userData.email);
      if (!isEmailUnique) {
        throw new ValidationError('A user with this email already exists');
      }
    }

    // Create user model
    const user = new User(userData);
    
    // Save to repository
    return await this.userRepo.create(user.toJSON());
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    return await this.userRepo.findAll();
  }

  /**
   * Update user information
   */
  async updateUser(userId, updateData) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Validate update data
    const validation = validateUserUpdate(updateData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Check if user exists
    const existingUser = await this.userRepo.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Check name uniqueness if name is being updated
    if (updateData.name && updateData.name !== existingUser.name) {
      const isNameUnique = await this.userRepo.isNameUnique(updateData.name, userId);
      if (!isNameUnique) {
        throw new ValidationError('A user with this name already exists');
      }
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const isEmailUnique = await this.userRepo.isEmailUnique(updateData.email, userId);
      if (!isEmailUnique) {
        throw new ValidationError('A user with this email already exists');
      }
    }

    // Update user
    return await this.userRepo.update(userId, updateData);
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user has outstanding balances
    const userBalance = await this.calculationService.calculateUserBalance(userId);
    if (Math.abs(userBalance.netBalance) > 0.01) {
      throw new ValidationError('Cannot delete user with outstanding balance. Please settle accounts first.');
    }

    return await this.userRepo.delete(userId);
  }

  /**
   * Search users by name
   */
  async searchUsers(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }

    return await this.userRepo.searchByName(searchTerm);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get user by phone
   */
  async getUserByPhone(phone) {
    if (!phone) {
      throw new ValidationError('Phone number is required');
    }

    const user = await this.userRepo.findByPhone(phone);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get user balance summary
   */
  async getUserBalance(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.calculationService.calculateUserBalance(userId);
  }

  /**
   * Get users with outstanding balances
   */
  async getUsersWithBalances() {
    return await this.userRepo.findUsersWithBalances();
  }

  /**
   * Get users who owe money
   */
  async getUsersOwingMoney() {
    return await this.userRepo.findUsersOwingMoney();
  }

  /**
   * Get users who are owed money
   */
  async getUsersOwedMoney() {
    return await this.userRepo.findUsersOwedMoney();
  }

  /**
   * Get users with settled balances
   */
  async getSettledUsers() {
    return await this.userRepo.findSettledUsers();
  }

  /**
   * Get balance summary for all users
   */
  async getBalanceSummary() {
    return await this.userRepo.getBalanceSummary();
  }

  /**
   * Get recently created users
   */
  async getRecentUsers(limit = 10) {
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    return await this.userRepo.findRecentUsers(limit);
  }

  /**
   * Get users sorted by balance
   */
  async getUsersByBalance(order = 'desc') {
    if (!['asc', 'desc'].includes(order)) {
      throw new ValidationError('Order must be "asc" or "desc"');
    }

    return await this.userRepo.findUsersByBalance(order);
  }

  /**
   * Update user balance directly (for payments/settlements)
   */
  async updateUserBalance(userId, newBalance) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (typeof newBalance !== 'number') {
      throw new ValidationError('Balance must be a number');
    }

    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.userRepo.updateBalance(userId, newBalance);
  }

  /**
   * Adjust user balance by amount (positive or negative)
   */
  async adjustUserBalance(userId, amount) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (typeof amount !== 'number') {
      throw new ValidationError('Amount must be a number');
    }

    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.userRepo.adjustBalance(userId, amount);
  }

  /**
   * Get detailed user profile with balance information
   */
  async getUserProfile(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const balance = await this.calculationService.calculateUserBalance(userId);
    
    return {
      ...user,
      balanceDetails: balance
    };
  }

  /**
   * Validate user data without creating
   */
  validateUserData(userData) {
    return validateUserData(userData);
  }

  /**
   * Check if user name is available
   */
  async isNameAvailable(name, excludeUserId = null) {
    if (!name || typeof name !== 'string') {
      return false;
    }

    return await this.userRepo.isNameUnique(name.trim(), excludeUserId);
  }

  /**
   * Check if email is available
   */
  async isEmailAvailable(email, excludeUserId = null) {
    if (!email || typeof email !== 'string') {
      return true; // Email is optional
    }

    return await this.userRepo.isEmailUnique(email.trim(), excludeUserId);
  }

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    const allUsers = await this.userRepo.findAll();
    const usersWithBalances = await this.userRepo.findUsersWithBalances();
    const usersOwing = await this.userRepo.findUsersOwingMoney();
    const usersOwed = await this.userRepo.findUsersOwedMoney();
    const settledUsers = await this.userRepo.findSettledUsers();
    const balanceSummary = await this.userRepo.getBalanceSummary();

    return {
      totalUsers: allUsers.length,
      usersWithBalances: usersWithBalances.length,
      usersOwing: usersOwing.length,
      usersOwed: usersOwed.length,
      settledUsers: settledUsers.length,
      balanceSummary
    };
  }

  /**
   * Get events that a user is participating in
   */
  async getUserEvents(userId) {
    // Validate user exists
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!this.eventRepo) {
      throw new Error('Event repository not available');
    }

    // Find all events where the user is a participant
    const allEvents = await this.eventRepo.findAll();
    const userEvents = allEvents.filter(event => 
      event.participants && event.participants.includes(userId)
    );

    return userEvents;
  }

  /**
   * Get payments made by a user
   */
  async getUserPayments(userId) {
    // Validate user exists
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!this.paymentRepo) {
      throw new Error('Payment repository not available');
    }

    // Find all payments made by the user
    const userPayments = await this.paymentRepo.findBy({ userId: userId });

    return userPayments;
  }
}

module.exports = UserService;