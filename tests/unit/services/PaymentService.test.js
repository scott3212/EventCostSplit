const PaymentService = require('../../../src/services/PaymentService');
const Payment = require('../../../src/models/Payment');
const { ValidationError, NotFoundError } = require('../../../src/utils/errors');

describe('PaymentService', () => {
  let paymentService;
  let mockPaymentRepo;
  let mockUserRepo;
  let mockEventRepo;
  let mockCalculationService;

  beforeEach(() => {
    mockPaymentRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUser: jest.fn(),
      findByEvent: jest.fn(),
      findByDateRange: jest.fn(),
      findByAmountRange: jest.fn(),
      findLargePayments: jest.fn(),
      findRecentPayments: jest.fn(),
      findTodayPayments: jest.fn(),
      findEventLinkedPayments: jest.fn(),
      findGeneralPayments: jest.fn(),
      getTotalPaidByUser: jest.fn(),
      getTotalForEvent: jest.fn(),
      getUserPaymentStatistics: jest.fn(),
      getPaymentStatistics: jest.fn(),
      findPaymentsByDate: jest.fn(),
      findPaymentsByAmount: jest.fn(),
      searchByDescription: jest.fn(),
      findPaymentsByMonth: jest.fn(),
      getMonthlyPaymentSummary: jest.fn(),
      findActiveUsers: jest.fn(),
      getPaymentFrequencyAnalysis: jest.fn(),
    };

    mockUserRepo = {
      findById: jest.fn(),
      adjustBalance: jest.fn(),
    };

    mockEventRepo = {
      findById: jest.fn(),
    };

    mockCalculationService = {
      calculateSettlements: jest.fn(),
    };

    paymentService = new PaymentService(
      mockPaymentRepo,
      mockUserRepo,
      mockEventRepo,
      mockCalculationService
    );
  });

  describe('createPayment', () => {
    const validPaymentData = {
      userId: '12345678-1234-1234-1234-123456789012',
      amount: 25.50,
      description: 'Settlement payment',
      date: '2024-09-14'
    };

    const mockUser = {
      id: '12345678-1234-1234-1234-123456789012',
      name: 'John Doe'
    };

    it('should create a payment with valid data', async () => {
      const createdPayment = { id: 'payment1', ...validPaymentData };
      
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockPaymentRepo.create.mockResolvedValue(createdPayment);
      mockUserRepo.adjustBalance.mockResolvedValue(mockUser);

      const result = await paymentService.createPayment(validPaymentData);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(validPaymentData.userId);
      expect(mockPaymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: '12345678-1234-1234-1234-123456789012',
        amount: 25.50,
        description: 'Settlement payment'
      }));
      expect(mockUserRepo.adjustBalance).toHaveBeenCalledWith(validPaymentData.userId, validPaymentData.amount);
      expect(result).toEqual(createdPayment);
    });

    it('should create payment with related event', async () => {
      const paymentWithEvent = {
        ...validPaymentData,
        relatedEventId: '12345678-1234-1234-1234-123456789013'
      };
      const mockEvent = {
        id: '12345678-1234-1234-1234-123456789013',
        name: 'Test Event',
        participants: ['12345678-1234-1234-1234-123456789012']
      };

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockPaymentRepo.create.mockResolvedValue({ id: 'payment1', ...paymentWithEvent });
      mockUserRepo.adjustBalance.mockResolvedValue(mockUser);

      const result = await paymentService.createPayment(paymentWithEvent);

      expect(mockEventRepo.findById).toHaveBeenCalledWith(paymentWithEvent.relatedEventId);
      expect(result.relatedEventId).toBe(paymentWithEvent.relatedEventId);
    });

    it('should throw error for invalid payment data', async () => {
      const invalidPaymentData = { amount: -10 };

      await expect(paymentService.createPayment(invalidPaymentData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(paymentService.createPayment(validPaymentData))
        .rejects.toThrow('User not found');
    });

    it('should throw error if related event not found', async () => {
      const paymentWithEvent = {
        ...validPaymentData,
        relatedEventId: '12345678-1234-1234-1234-123456789013'
      };

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(paymentService.createPayment(paymentWithEvent))
        .rejects.toThrow('Related event not found');
    });

    it('should throw error if user not participant in related event', async () => {
      const paymentWithEvent = {
        ...validPaymentData,
        relatedEventId: '12345678-1234-1234-1234-123456789013'
      };
      const mockEvent = {
        id: '12345678-1234-1234-1234-123456789013',
        participants: ['99999999-9999-9999-9999-999999999999'] // different user
      };

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockEventRepo.findById.mockResolvedValue(mockEvent);

      await expect(paymentService.createPayment(paymentWithEvent))
        .rejects.toThrow('User must be a participant in the related event');
    });
  });

  describe('getPaymentById', () => {
    it('should return payment if found', async () => {
      const payment = { id: 'payment1', amount: 25.50 };
      mockPaymentRepo.findById.mockResolvedValue(payment);

      const result = await paymentService.getPaymentById('payment1');

      expect(result).toEqual(payment);
      expect(mockPaymentRepo.findById).toHaveBeenCalledWith('payment1');
    });

    it('should throw NotFoundError if payment does not exist', async () => {
      mockPaymentRepo.findById.mockResolvedValue(null);

      await expect(paymentService.getPaymentById('invalid'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if no ID provided', async () => {
      await expect(paymentService.getPaymentById(''))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updatePayment', () => {
    const existingPayment = {
      id: 'payment1',
      userId: '12345678-1234-1234-1234-123456789012',
      amount: 25.50,
      description: 'Old description'
    };

    it('should update payment with valid data', async () => {
      const updateData = { description: 'Updated description' };
      const updatedPayment = { ...existingPayment, ...updateData };

      mockPaymentRepo.findById.mockResolvedValue(existingPayment);
      mockPaymentRepo.update.mockResolvedValue(updatedPayment);

      const result = await paymentService.updatePayment('payment1', updateData);

      expect(mockPaymentRepo.update).toHaveBeenCalledWith('payment1', updateData);
      expect(result).toEqual(updatedPayment);
    });

    it('should adjust balance when amount is updated', async () => {
      const updateData = { amount: 50.00 };
      const updatedPayment = { ...existingPayment, ...updateData };

      mockPaymentRepo.findById.mockResolvedValue(existingPayment);
      mockPaymentRepo.update.mockResolvedValue(updatedPayment);
      mockUserRepo.adjustBalance.mockResolvedValue({});

      await paymentService.updatePayment('payment1', updateData);

      // Difference: 50.00 - 25.50 = 24.50
      expect(mockUserRepo.adjustBalance).toHaveBeenCalledWith(existingPayment.userId, 24.50);
    });

    it('should throw error if payment not found', async () => {
      mockPaymentRepo.findById.mockResolvedValue(null);

      await expect(paymentService.updatePayment('invalid', { description: 'Test' }))
        .rejects.toThrow(NotFoundError);
    });

    it('should validate related event when updating', async () => {
      const updateData = { relatedEventId: '12345678-1234-1234-1234-123456789013' };
      const mockEvent = {
        id: '12345678-1234-1234-1234-123456789013',
        participants: ['12345678-1234-1234-1234-123456789012']
      };

      mockPaymentRepo.findById.mockResolvedValue(existingPayment);
      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockPaymentRepo.update.mockResolvedValue({ ...existingPayment, ...updateData });

      await paymentService.updatePayment('payment1', updateData);

      expect(mockEventRepo.findById).toHaveBeenCalledWith(updateData.relatedEventId);
    });
  });

  describe('deletePayment', () => {
    it('should delete payment and reverse balance adjustment', async () => {
      const payment = {
        id: 'payment1',
        userId: '12345678-1234-1234-1234-123456789012',
        amount: 25.50
      };

      mockPaymentRepo.findById.mockResolvedValue(payment);
      mockUserRepo.adjustBalance.mockResolvedValue({});
      mockPaymentRepo.delete.mockResolvedValue(true);

      const result = await paymentService.deletePayment('payment1');

      expect(mockUserRepo.adjustBalance).toHaveBeenCalledWith(payment.userId, -payment.amount);
      expect(mockPaymentRepo.delete).toHaveBeenCalledWith('payment1');
      expect(result).toBe(true);
    });

    it('should throw error if payment not found', async () => {
      mockPaymentRepo.findById.mockResolvedValue(null);

      await expect(paymentService.deletePayment('invalid'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getPaymentsForUser', () => {
    it('should return payments for valid user', async () => {
      const user = { id: 'user1', name: 'John Doe' };
      const payments = [{ id: 'payment1' }, { id: 'payment2' }];

      mockUserRepo.findById.mockResolvedValue(user);
      mockPaymentRepo.findByUser.mockResolvedValue(payments);

      const result = await paymentService.getPaymentsForUser('user1');

      expect(result).toEqual(payments);
      expect(mockPaymentRepo.findByUser).toHaveBeenCalledWith('user1');
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(paymentService.getPaymentsForUser('invalid'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getPaymentsByDateRange', () => {
    it('should return payments in date range', async () => {
      const payments = [{ id: 'payment1' }, { id: 'payment2' }];

      mockPaymentRepo.findByDateRange.mockResolvedValue(payments);

      const result = await paymentService.getPaymentsByDateRange('2024-09-01', '2024-09-30');

      expect(result).toEqual(payments);
      expect(mockPaymentRepo.findByDateRange).toHaveBeenCalledWith('2024-09-01', '2024-09-30');
    });

    it('should throw error for invalid date range', async () => {
      await expect(paymentService.getPaymentsByDateRange('2024-09-30', '2024-09-01'))
        .rejects.toThrow('Start date must be before end date');
    });

    it('should throw error for missing dates', async () => {
      await expect(paymentService.getPaymentsByDateRange('', '2024-09-30'))
        .rejects.toThrow('Start date and end date are required');
    });
  });

  describe('getPaymentsByAmountRange', () => {
    it('should return payments in amount range', async () => {
      const payments = [{ id: 'payment1', amount: 25 }];

      mockPaymentRepo.findByAmountRange.mockResolvedValue(payments);

      const result = await paymentService.getPaymentsByAmountRange(20, 30);

      expect(result).toEqual(payments);
      expect(mockPaymentRepo.findByAmountRange).toHaveBeenCalledWith(20, 30);
    });

    it('should throw error for negative amounts', async () => {
      await expect(paymentService.getPaymentsByAmountRange(-10, 30))
        .rejects.toThrow('Amounts must be non-negative');
    });

    it('should throw error when min > max', async () => {
      await expect(paymentService.getPaymentsByAmountRange(50, 30))
        .rejects.toThrow('Minimum amount must be less than or equal to maximum amount');
    });
  });

  describe('processSettlement', () => {
    const fromUserId = '12345678-1234-1234-1234-123456789012';
    const toUserId = '12345678-1234-1234-1234-123456789013';
    const fromUser = { id: fromUserId, name: 'John' };
    const toUser = { id: toUserId, name: 'Jane' };

    it('should process settlement between users', async () => {
      const createdPayment = {
        id: 'payment1',
        userId: fromUserId,
        amount: 25.50,
        description: 'Settlement payment to Jane'
      };

      // Set up mocks for processSettlement's user lookups
      mockUserRepo.findById.mockResolvedValueOnce(fromUser);
      mockUserRepo.findById.mockResolvedValueOnce(toUser);
      
      // Set up mocks for createPayment's user lookup (called within processSettlement)
      mockUserRepo.findById.mockResolvedValueOnce(fromUser);
      
      mockPaymentRepo.create.mockResolvedValue(createdPayment);
      mockUserRepo.adjustBalance.mockResolvedValue({});

      const result = await paymentService.processSettlement(fromUserId, toUserId, 25.50);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(fromUserId);
      expect(mockUserRepo.findById).toHaveBeenCalledWith(toUserId);
      expect(mockPaymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: fromUserId,
        amount: 25.50,
        description: 'Settlement payment to Jane'
      }));
      expect(result).toEqual(createdPayment);
    });

    it('should throw error for negative amount', async () => {
      await expect(paymentService.processSettlement(fromUserId, toUserId, -10))
        .rejects.toThrow('Settlement amount must be positive');
    });

    it('should throw error for same user settlement', async () => {
      await expect(paymentService.processSettlement(fromUserId, fromUserId, 25))
        .rejects.toThrow('Cannot settle with yourself');
    });

    it('should throw error if from user not found', async () => {
      mockUserRepo.findById.mockResolvedValueOnce(null);

      await expect(paymentService.processSettlement('12345678-1234-1234-1234-123456789099', toUserId, 25))
        .rejects.toThrow('From user not found');
    });

    it('should throw error if to user not found', async () => {
      mockUserRepo.findById.mockResolvedValueOnce(fromUser);
      mockUserRepo.findById.mockResolvedValueOnce(null);

      await expect(paymentService.processSettlement(fromUserId, '12345678-1234-1234-1234-123456789099', 25))
        .rejects.toThrow('To user not found');
    });
  });

  describe('getPaymentDetails', () => {
    it('should return payment with user and event details', async () => {
      const payment = {
        id: 'payment1',
        userId: 'user1',
        relatedEventId: 'event1',
        amount: 25.50
      };
      const user = { id: 'user1', name: 'John' };
      const event = { id: 'event1', name: 'Test Event' };

      mockPaymentRepo.findById.mockResolvedValue(payment);
      mockUserRepo.findById.mockResolvedValue(user);
      mockEventRepo.findById.mockResolvedValue(event);

      const result = await paymentService.getPaymentDetails('payment1');

      expect(result).toEqual({
        payment,
        user,
        event
      });
    });

    it('should return payment with user details only (no event)', async () => {
      const payment = {
        id: 'payment1',
        userId: 'user1',
        amount: 25.50
      };
      const user = { id: 'user1', name: 'John' };

      mockPaymentRepo.findById.mockResolvedValue(payment);
      mockUserRepo.findById.mockResolvedValue(user);

      const result = await paymentService.getPaymentDetails('payment1');

      expect(result).toEqual({
        payment,
        user,
        event: null
      });
    });
  });

  describe('bulkCreatePayments', () => {
    it('should process bulk payments successfully', async () => {
      const paymentsData = [
        { userId: 'user1', amount: 25, date: '2024-09-14' },
        { userId: 'user2', amount: 30, date: '2024-09-14' }
      ];

      // Mock successful creations
      paymentService.createPayment = jest.fn()
        .mockResolvedValueOnce({ id: 'payment1', ...paymentsData[0] })
        .mockResolvedValueOnce({ id: 'payment2', ...paymentsData[1] });

      const result = await paymentService.bulkCreatePayments(paymentsData);

      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle partial failures', async () => {
      const paymentsData = [
        { userId: 'user1', amount: 25, date: '2024-09-14' },
        { userId: 'invalid', amount: 30, date: '2024-09-14' }
      ];

      paymentService.createPayment = jest.fn()
        .mockResolvedValueOnce({ id: 'payment1', ...paymentsData[0] })
        .mockRejectedValueOnce(new Error('User not found'));

      const result = await paymentService.bulkCreatePayments(paymentsData);

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe('User not found');
    });

    it('should throw error for empty array', async () => {
      await expect(paymentService.bulkCreatePayments([]))
        .rejects.toThrow('Payments data must be a non-empty array');
    });
  });

  describe('getPaymentAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      const overallStats = { totalPayments: 10, totalAmount: 250 };
      const frequencyAnalysis = { averageDaysBetweenPayments: 5 };
      const recentPayments = [{ id: 'payment1' }];
      const eventLinked = [{ id: 'payment1' }];
      const general = [{ id: 'payment2' }];
      const activeUsers = [{ userId: 'user1', paymentCount: 5 }];

      mockPaymentRepo.getPaymentStatistics.mockResolvedValue(overallStats);
      mockPaymentRepo.getPaymentFrequencyAnalysis.mockResolvedValue(frequencyAnalysis);
      mockPaymentRepo.findRecentPayments.mockResolvedValue(recentPayments);
      mockPaymentRepo.findLargePayments.mockResolvedValue([]);
      mockPaymentRepo.findEventLinkedPayments.mockResolvedValue(eventLinked);
      mockPaymentRepo.findGeneralPayments.mockResolvedValue(general);
      mockPaymentRepo.findActiveUsers.mockResolvedValue(activeUsers);

      const result = await paymentService.getPaymentAnalytics();

      expect(result).toEqual({
        overallStatistics: overallStats,
        frequencyAnalysis,
        recentActivity: {
          recentPayments: 1,
          largePayments: 0,
          activeUsers: 1
        },
        paymentTypes: {
          eventLinked: 1,
          general: 1,
          eventLinkedPercentage: 10
        },
        topActiveUsers: activeUsers,
        recentLargePayments: []
      });
    });
  });
});