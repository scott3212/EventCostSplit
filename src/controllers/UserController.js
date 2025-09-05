const { ValidationError, NotFoundError } = require('../utils/errors');

class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  async createUser(req, res) {
    try {
      const userData = req.body;
      const user = await this.userService.createUser(userData);
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create user'
        });
      }
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users'
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve user'
        });
      }
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user = await this.userService.updateUser(id, updateData);
      res.status(200).json({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update user'
        });
      }
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete user'
        });
      }
    }
  }

  async getUserBalance(req, res) {
    try {
      const { id } = req.params;
      const balance = await this.userService.getUserBalance(id);
      res.status(200).json({
        success: true,
        data: { balance }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve user balance'
        });
      }
    }
  }

  async updateUserBalance(req, res) {
    try {
      const { id } = req.params;
      const { balance } = req.body;
      
      if (typeof balance !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Balance must be a number'
        });
      }

      const user = await this.userService.updateUserBalance(id, balance);
      res.status(200).json({
        success: true,
        data: user,
        message: 'User balance updated successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update user balance'
        });
      }
    }
  }

  async adjustUserBalance(req, res) {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      
      if (typeof amount !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a number'
        });
      }

      const user = await this.userService.adjustUserBalance(id, amount);
      res.status(200).json({
        success: true,
        data: user,
        message: 'User balance adjusted successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to adjust user balance'
        });
      }
    }
  }

  async getUserEvents(req, res) {
    try {
      const { id } = req.params;
      const events = await this.userService.getUserEvents(id);
      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve user events'
        });
      }
    }
  }

  async getUserPayments(req, res) {
    try {
      const { id } = req.params;
      const payments = await this.userService.getUserPayments(id);
      res.status(200).json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve user payments'
        });
      }
    }
  }

  async getUserCostItems(req, res) {
    try {
      const { id } = req.params;
      const costItems = await this.userService.getUserCostItems(id);
      res.status(200).json({
        success: true,
        data: costItems,
        count: costItems.length
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve user cost items'
        });
      }
    }
  }

  async getUserStatistics(req, res) {
    try {
      const { id } = req.params;
      const statistics = await this.userService.getUserStatistics(id);
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve user statistics'
        });
      }
    }
  }

  async getUserBalanceBreakdown(req, res) {
    try {
      const { id } = req.params;
      const breakdown = await this.userService.getUserBalanceBreakdown(id);
      res.status(200).json({
        success: true,
        data: breakdown
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve user balance breakdown'
        });
      }
    }
  }

  async findUsersByName(req, res) {
    try {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name parameter is required'
        });
      }

      const users = await this.userService.findUsersByName(name);
      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to search users by name'
      });
    }
  }

  async findUsersByEmail(req, res) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email parameter is required'
        });
      }

      const users = await this.userService.findUsersByEmail(email);
      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to search users by email'
      });
    }
  }

  async getActiveUsers(req, res) {
    try {
      const { days } = req.query;
      const daysNum = days ? parseInt(days) : undefined;
      const users = await this.userService.getActiveUsers(daysNum);
      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve active users'
        });
      }
    }
  }

  async getUsersWithDebt(req, res) {
    try {
      const users = await this.userService.getUsersWithDebt();
      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users with debt'
      });
    }
  }

  async getUsersWithCredit(req, res) {
    try {
      const users = await this.userService.getUsersWithCredit();
      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users with credit'
      });
    }
  }

  async validateUserData(req, res) {
    try {
      const userData = req.body;
      const validation = this.userService.validateUserData(userData);
      res.status(200).json({
        success: true,
        data: validation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to validate user data'
      });
    }
  }
}

module.exports = UserController;