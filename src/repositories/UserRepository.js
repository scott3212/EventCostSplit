const BaseRepository = require('./BaseRepository');
const { DATA_FILES } = require('../config/constants');

/**
 * User repository for user-specific data operations
 * Extends BaseRepository with user-specific methods
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(DATA_FILES.USERS);
  }

  /**
   * Find user by email address
   */
  async findByEmail(email) {
    if (!email) return null;
    
    const users = await this.findBy({ 
      email: (userEmail) => userEmail && userEmail.toLowerCase() === email.toLowerCase() 
    });
    
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Find user by phone number
   */
  async findByPhone(phone) {
    if (!phone) return null;
    
    const users = await this.findBy({ 
      phone: (userPhone) => userPhone && userPhone === phone 
    });
    
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Check if user name is unique (excluding specific user ID)
   */
  async isNameUnique(name, excludeUserId = null) {
    if (!name || typeof name !== 'string') return false;
    
    const normalizedName = name.trim().toLowerCase();
    const users = await this.findAll();
    
    return !users.some(user => 
      user.id !== excludeUserId && 
      user.name.toLowerCase() === normalizedName
    );
  }

  /**
   * Check if email is unique (excluding specific user ID)
   */
  async isEmailUnique(email, excludeUserId = null) {
    if (!email || typeof email !== 'string') return true; // Email is optional
    
    const normalizedEmail = email.trim().toLowerCase();
    const users = await this.findAll();
    
    return !users.some(user => 
      user.id !== excludeUserId && 
      user.email && 
      user.email.toLowerCase() === normalizedEmail
    );
  }

  /**
   * Update user's total balance
   */
  async updateBalance(userId, newBalance) {
    const user = await this.findById(userId);
    if (!user) return null;
    
    return await this.update(userId, { 
      totalBalance: parseFloat(newBalance) 
    });
  }

  /**
   * Add amount to user's balance (can be positive or negative)
   */
  async adjustBalance(userId, amount) {
    const user = await this.findById(userId);
    if (!user) return null;
    
    const newBalance = user.totalBalance + parseFloat(amount);
    return await this.updateBalance(userId, newBalance);
  }

  /**
   * Get users with outstanding balances (owing or owed money)
   */
  async findUsersWithBalances() {
    const tolerance = 0.01; // Consider amounts less than 1 cent as zero
    
    return await this.findBy({
      totalBalance: (balance) => Math.abs(balance) > tolerance
    });
  }

  /**
   * Get users who owe money
   */
  async findUsersOwingMoney() {
    const tolerance = 0.01;
    
    return await this.findBy({
      totalBalance: (balance) => balance < -tolerance
    });
  }

  /**
   * Get users who are owed money
   */
  async findUsersOwedMoney() {
    const tolerance = 0.01;
    
    return await this.findBy({
      totalBalance: (balance) => balance > tolerance
    });
  }

  /**
   * Get users with zero balance (settled up)
   */
  async findSettledUsers() {
    const tolerance = 0.01;
    
    return await this.findBy({
      totalBalance: (balance) => Math.abs(balance) <= tolerance
    });
  }

  /**
   * Get balance summary statistics
   */
  async getBalanceSummary() {
    const users = await this.findAll();
    
    if (users.length === 0) {
      return {
        totalUsers: 0,
        totalAmountOwed: 0,
        totalAmountOwing: 0,
        netBalance: 0,
        usersOwing: 0,
        usersOwed: 0,
        usersSettled: 0,
      };
    }

    const tolerance = 0.01;
    let totalOwed = 0;
    let totalOwing = 0;
    let usersOwing = 0;
    let usersOwed = 0;
    let usersSettled = 0;

    users.forEach(user => {
      const balance = user.totalBalance;
      
      if (balance > tolerance) {
        totalOwed += balance;
        usersOwed++;
      } else if (balance < -tolerance) {
        totalOwing += Math.abs(balance);
        usersOwing++;
      } else {
        usersSettled++;
      }
    });

    return {
      totalUsers: users.length,
      totalAmountOwed: Math.round(totalOwed * 100) / 100,
      totalAmountOwing: Math.round(totalOwing * 100) / 100,
      netBalance: Math.round((totalOwed - totalOwing) * 100) / 100,
      usersOwing,
      usersOwed,
      usersSettled,
    };
  }

  /**
   * Search users by name (partial match)
   */
  async searchByName(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') return [];
    
    const normalizedSearch = searchTerm.trim().toLowerCase();
    
    return await this.findBy({
      name: (name) => name.toLowerCase().includes(normalizedSearch)
    });
  }

  /**
   * Get recently created users
   */
  async findRecentUsers(limit = 10) {
    const users = await this.findAll();
    
    return users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Get users sorted by balance (highest debt first)
   */
  async findUsersByBalance(order = 'desc') {
    const users = await this.findAll();
    
    return users.sort((a, b) => {
      return order === 'desc' 
        ? b.totalBalance - a.totalBalance
        : a.totalBalance - b.totalBalance;
    });
  }
}

module.exports = UserRepository;