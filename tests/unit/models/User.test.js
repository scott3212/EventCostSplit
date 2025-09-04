const User = require('../../../src/models/User');
const { ValidationError } = require('../../../src/utils/validators');
const { createValidUserData, INVALID_DATA } = require('../../helpers/mockData');

describe('User Model', () => {
  describe('constructor', () => {
    it('should create user with valid data', () => {
      const userData = createValidUserData();
      const user = new User(userData);
      
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.phone).toBe(userData.phone);
      expect(user.totalBalance).toBe(0);
    });

    it('should handle optional email and phone', () => {
      const userData = createValidUserData({ email: null, phone: null });
      const user = new User(userData);
      
      expect(user.email).toBeNull();
      expect(user.phone).toBeNull();
    });

    it('should sanitize string inputs', () => {
      const userData = createValidUserData({
        name: '  Test User  ',
        email: '  test@example.com  ',
        phone: '  +1-555-0123  ',
      });
      
      const user = new User(userData);
      
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.phone).toBe('+1-555-0123');
    });

    it('should throw ValidationError for missing name', () => {
      expect(() => new User(INVALID_DATA.user.emptyName))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for short name', () => {
      expect(() => new User(INVALID_DATA.user.shortName))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for long name', () => {
      expect(() => new User(INVALID_DATA.user.longName))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid email', () => {
      expect(() => new User(INVALID_DATA.user.invalidEmail))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid phone', () => {
      expect(() => new User(INVALID_DATA.user.invalidPhone))
        .toThrow(ValidationError);
    });
  });

  describe('toJSON', () => {
    it('should return user data for API responses', () => {
      const userData = createValidUserData();
      const user = new User(userData);
      const json = user.toJSON();
      
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('email');
      expect(json).toHaveProperty('phone');
      expect(json).toHaveProperty('totalBalance');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });

  describe('getDisplayName', () => {
    it('should return user name', () => {
      const userData = createValidUserData({ name: 'John Doe' });
      const user = new User(userData);
      
      expect(user.getDisplayName()).toBe('John Doe');
    });
  });

  describe('balance methods', () => {
    it('should identify when user owes money', () => {
      const userData = createValidUserData({ totalBalance: -25.50 });
      const user = new User(userData);
      
      expect(user.oweseMoney()).toBe(true);
      expect(user.isOwedMoney()).toBe(false);
    });

    it('should identify when user is owed money', () => {
      const userData = createValidUserData({ totalBalance: 15.75 });
      const user = new User(userData);
      
      expect(user.oweseMoney()).toBe(false);
      expect(user.isOwedMoney()).toBe(true);
    });

    it('should identify when user is settled', () => {
      const userData = createValidUserData({ totalBalance: 0 });
      const user = new User(userData);
      
      expect(user.oweseMoney()).toBe(false);
      expect(user.isOwedMoney()).toBe(false);
    });
  });

  describe('getBalanceStatus', () => {
    it('should return "owes" status for negative balance', () => {
      const userData = createValidUserData({ totalBalance: -25.50 });
      const user = new User(userData);
      const status = user.getBalanceStatus();
      
      expect(status.status).toBe('owes');
      expect(status.message).toContain('Owes $25.50');
      expect(status.color).toBe('red');
    });

    it('should return "owed" status for positive balance', () => {
      const userData = createValidUserData({ totalBalance: 15.75 });
      const user = new User(userData);
      const status = user.getBalanceStatus();
      
      expect(status.status).toBe('owed');
      expect(status.message).toContain('Owed $15.75');
      expect(status.color).toBe('green');
    });

    it('should return "settled" status for zero balance', () => {
      const userData = createValidUserData({ totalBalance: 0 });
      const user = new User(userData);
      const status = user.getBalanceStatus();
      
      expect(status.status).toBe('settled');
      expect(status.message).toContain('All settled up!');
      expect(status.color).toBe('gray');
    });

    it('should handle very small balances as settled', () => {
      const userData = createValidUserData({ totalBalance: 0.005 });
      const user = new User(userData);
      const status = user.getBalanceStatus();
      
      expect(status.status).toBe('settled');
    });
  });

  describe('static methods', () => {
    describe('fromFormData', () => {
      it('should create user from form data', () => {
        const formData = {
          name: 'Form User',
          email: 'form@example.com',
          phone: '+1-555-9999',
        };
        
        const user = User.fromFormData(formData);
        
        expect(user.name).toBe('Form User');
        expect(user.email).toBe('form@example.com');
        expect(user.phone).toBe('+1-555-9999');
        expect(user.totalBalance).toBe(0);
      });

      it('should handle optional fields in form data', () => {
        const formData = { name: 'Form User' };
        const user = User.fromFormData(formData);
        
        expect(user.name).toBe('Form User');
        expect(user.email).toBeNull();
        expect(user.phone).toBeNull();
      });
    });

    describe('validateUpdate', () => {
      it('should validate and return allowed update fields', () => {
        const updateData = {
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '+1-555-1111',
          totalBalance: 999, // Should be ignored
          invalidField: 'ignored',
        };
        
        const validatedUpdates = User.validateUpdate(updateData);
        
        expect(validatedUpdates).toHaveProperty('name');
        expect(validatedUpdates).toHaveProperty('email');
        expect(validatedUpdates).toHaveProperty('phone');
        expect(validatedUpdates).not.toHaveProperty('totalBalance');
        expect(validatedUpdates).not.toHaveProperty('invalidField');
      });

      it('should throw error when no valid fields to update', () => {
        const updateData = { invalidField: 'value' };
        
        expect(() => User.validateUpdate(updateData))
          .toThrow('No valid fields to update');
      });

      it('should validate update data', () => {
        const updateData = { 
          name: '', // Invalid name
          email: 'valid@example.com' 
        }; 
        
        expect(() => User.validateUpdate(updateData))
          .toThrow(ValidationError);
      });
    });

    describe('isNameUnique', () => {
      const existingUsers = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' },
        { id: '3', name: 'Bob Johnson' },
      ];

      it('should return true for unique name', () => {
        const isUnique = User.isNameUnique('Alice Wilson', existingUsers);
        expect(isUnique).toBe(true);
      });

      it('should return false for duplicate name', () => {
        const isUnique = User.isNameUnique('John Doe', existingUsers);
        expect(isUnique).toBe(false);
      });

      it('should be case insensitive', () => {
        const isUnique = User.isNameUnique('john doe', existingUsers);
        expect(isUnique).toBe(false);
      });

      it('should exclude specific user ID when checking', () => {
        const isUnique = User.isNameUnique('John Doe', existingUsers, '1');
        expect(isUnique).toBe(true);
      });

      it('should handle whitespace in names', () => {
        const isUnique = User.isNameUnique('  John Doe  ', existingUsers);
        expect(isUnique).toBe(false);
      });
    });
  });
});