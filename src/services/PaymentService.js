const Payment = require('../models/Payment');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { validatePaymentData, validatePaymentUpdate } = require('../utils/validators');

/**
 * Service for payment-related business logic
 * Handles payment CRUD operations, balance tracking, and settlement processing
 */
class PaymentService {
  constructor(paymentRepository, userRepository, eventRepository, calculationService) {
    this.paymentRepo = paymentRepository;
    this.userRepo = userRepository;
    this.eventRepo = eventRepository;
    this.calculationService = calculationService;
  }

  /**
   * Create a new payment
   */
  async createPayment(paymentData) {
    // Validate input data
    const validation = validatePaymentData(paymentData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Validate user exists
    const user = await this.userRepo.findById(paymentData.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate event exists if relatedEventId is provided
    if (paymentData.relatedEventId) {
      const event = await this.eventRepo.findById(paymentData.relatedEventId);
      if (!event) {
        throw new NotFoundError('Related event not found');
      }

      // Check if user is participant in the event
      if (!event.participants.includes(paymentData.userId)) {
        throw new ValidationError('User must be a participant in the related event');
      }
    }

    // Create payment model
    const payment = new Payment(paymentData);
    
    // Save to repository
    const createdPayment = await this.paymentRepo.create(payment.toJSON());

    // Update user balance
    await this.userRepo.adjustBalance(paymentData.userId, paymentData.amount);

    return createdPayment;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId) {
    if (!paymentId) {
      throw new ValidationError('Payment ID is required');
    }

    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }

  /**
   * Get all payments
   */
  async getAllPayments() {
    return await this.paymentRepo.findAll();
  }

  /**
   * Update payment
   */
  async updatePayment(paymentId, updateData) {
    if (!paymentId) {
      throw new ValidationError('Payment ID is required');
    }

    // Validate update data
    const validation = validatePaymentUpdate(updateData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Check if payment exists
    const existingPayment = await this.paymentRepo.findById(paymentId);
    if (!existingPayment) {
      throw new NotFoundError('Payment not found');
    }

    // If amount is being updated, adjust user balance
    if (updateData.amount && updateData.amount !== existingPayment.amount) {
      const difference = updateData.amount - existingPayment.amount;
      await this.userRepo.adjustBalance(existingPayment.userId, difference);
    }

    // Validate event if being updated
    if (updateData.relatedEventId) {
      const event = await this.eventRepo.findById(updateData.relatedEventId);
      if (!event) {
        throw new NotFoundError('Related event not found');
      }

      if (!event.participants.includes(existingPayment.userId)) {
        throw new ValidationError('User must be a participant in the related event');
      }
    }

    // Update payment
    return await this.paymentRepo.update(paymentId, updateData);
  }

  /**
   * Delete payment
   */
  async deletePayment(paymentId) {
    if (!paymentId) {
      throw new ValidationError('Payment ID is required');
    }

    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Reverse the balance adjustment
    await this.userRepo.adjustBalance(payment.userId, -payment.amount);

    return await this.paymentRepo.delete(paymentId);
  }

  /**
   * Get payments for a specific user
   */
  async getPaymentsForUser(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Check if user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.paymentRepo.findByUser(userId);
  }

  /**
   * Get payments for a specific event
   */
  async getPaymentsForEvent(eventId) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    // Check if event exists
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return await this.paymentRepo.findByEvent(eventId);
  }

  /**
   * Get payments by date range
   */
  async getPaymentsByDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new ValidationError('Start date and end date are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid date format');
    }

    if (start > end) {
      throw new ValidationError('Start date must be before end date');
    }

    return await this.paymentRepo.findByDateRange(startDate, endDate);
  }

  /**
   * Get payments by amount range
   */
  async getPaymentsByAmountRange(minAmount, maxAmount) {
    if (minAmount == null || maxAmount == null) {
      throw new ValidationError('Minimum and maximum amounts are required');
    }

    if (minAmount < 0 || maxAmount < 0) {
      throw new ValidationError('Amounts must be non-negative');
    }

    if (minAmount > maxAmount) {
      throw new ValidationError('Minimum amount must be less than or equal to maximum amount');
    }

    return await this.paymentRepo.findByAmountRange(minAmount, maxAmount);
  }

  /**
   * Get large payments above threshold
   */
  async getLargePayments(threshold = 50) {
    if (threshold < 0) {
      throw new ValidationError('Threshold must be non-negative');
    }

    return await this.paymentRepo.findLargePayments(threshold);
  }

  /**
   * Get recent payments
   */
  async getRecentPayments(days = 7) {
    if (days < 1) {
      throw new ValidationError('Days must be at least 1');
    }

    return await this.paymentRepo.findRecentPayments(days);
  }

  /**
   * Get today's payments
   */
  async getTodayPayments() {
    return await this.paymentRepo.findTodayPayments();
  }

  /**
   * Get event-linked payments
   */
  async getEventLinkedPayments() {
    return await this.paymentRepo.findEventLinkedPayments();
  }

  /**
   * Get general payments (not linked to events)
   */
  async getGeneralPayments() {
    return await this.paymentRepo.findGeneralPayments();
  }

  /**
   * Get total amount paid by user
   */
  async getTotalPaidByUser(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.paymentRepo.getTotalPaidByUser(userId);
  }

  /**
   * Get total amount paid for event
   */
  async getTotalForEvent(eventId) {
    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return await this.paymentRepo.getTotalForEvent(eventId);
  }

  /**
   * Get user payment statistics
   */
  async getUserPaymentStatistics(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await this.paymentRepo.getUserPaymentStatistics(userId);
  }

  /**
   * Get overall payment statistics
   */
  async getPaymentStatistics() {
    return await this.paymentRepo.getPaymentStatistics();
  }

  /**
   * Get payments sorted by date
   */
  async getPaymentsByDate(order = 'desc') {
    if (!['asc', 'desc'].includes(order)) {
      throw new ValidationError('Order must be "asc" or "desc"');
    }

    return await this.paymentRepo.findPaymentsByDate(order);
  }

  /**
   * Get payments sorted by amount
   */
  async getPaymentsByAmount(order = 'desc') {
    if (!['asc', 'desc'].includes(order)) {
      throw new ValidationError('Order must be "asc" or "desc"');
    }

    return await this.paymentRepo.findPaymentsByAmount(order);
  }

  /**
   * Search payments by description
   */
  async searchPayments(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }

    return await this.paymentRepo.searchByDescription(searchTerm);
  }

  /**
   * Get payments by month
   */
  async getPaymentsByMonth(year, month) {
    if (!year || !month || year < 2000 || year > 3000 || month < 1 || month > 12) {
      throw new ValidationError('Valid year and month (1-12) are required');
    }

    return await this.paymentRepo.findPaymentsByMonth(year, month);
  }

  /**
   * Get monthly payment summary
   */
  async getMonthlyPaymentSummary(year, month) {
    if (!year || !month || year < 2000 || year > 3000 || month < 1 || month > 12) {
      throw new ValidationError('Valid year and month (1-12) are required');
    }

    return await this.paymentRepo.getMonthlyPaymentSummary(year, month);
  }

  /**
   * Find active users (who made payments recently)
   */
  async findActiveUsers(days = 30) {
    if (days < 1) {
      throw new ValidationError('Days must be at least 1');
    }

    return await this.paymentRepo.findActiveUsers(days);
  }

  /**
   * Get payment frequency analysis
   */
  async getPaymentFrequencyAnalysis() {
    return await this.paymentRepo.getPaymentFrequencyAnalysis();
  }

  /**
   * Process settlement between users
   */
  async processSettlement(fromUserId, toUserId, amount, description = 'Settlement payment') {
    if (!fromUserId || !toUserId) {
      throw new ValidationError('From and to user IDs are required');
    }

    if (amount <= 0) {
      throw new ValidationError('Settlement amount must be positive');
    }

    if (fromUserId === toUserId) {
      throw new ValidationError('Cannot settle with yourself');
    }

    // Validate users exist
    const fromUser = await this.userRepo.findById(fromUserId);
    const toUser = await this.userRepo.findById(toUserId);

    if (!fromUser) {
      throw new NotFoundError('From user not found');
    }

    if (!toUser) {
      throw new NotFoundError('To user not found');
    }

    // Create payment record for the settlement
    const paymentData = {
      userId: fromUserId,
      amount: amount,
      description: `${description} to ${toUser.name}`,
      date: new Date().toISOString()
    };

    return await this.createPayment(paymentData);
  }

  /**
   * Get settlement suggestions from calculation service
   */
  async getSettlementSuggestions() {
    return await this.calculationService.calculateSettlements();
  }

  /**
   * Validate payment data without creating
   */
  validatePaymentData(paymentData) {
    return validatePaymentData(paymentData);
  }

  /**
   * Get payment with enriched data (user details, event details, etc.)
   */
  async getPaymentDetails(paymentId) {
    if (!paymentId) {
      throw new ValidationError('Payment ID is required');
    }

    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Get user details
    const user = await this.userRepo.findById(payment.userId);

    // Get event details if payment is linked to an event
    let event = null;
    if (payment.relatedEventId) {
      event = await this.eventRepo.findById(payment.relatedEventId);
    }

    return {
      payment,
      user,
      event
    };
  }

  /**
   * Get comprehensive payment analytics
   */
  async getPaymentAnalytics() {
    const overallStats = await this.getPaymentStatistics();
    const frequencyAnalysis = await this.getPaymentFrequencyAnalysis();
    const recentPayments = await this.getRecentPayments(7);
    const largePayments = await this.getLargePayments(100);
    const eventLinked = await this.getEventLinkedPayments();
    const general = await this.getGeneralPayments();
    const activeUsers = await this.findActiveUsers(30);

    return {
      overallStatistics: overallStats,
      frequencyAnalysis,
      recentActivity: {
        recentPayments: recentPayments.length,
        largePayments: largePayments.length,
        activeUsers: activeUsers.length
      },
      paymentTypes: {
        eventLinked: eventLinked.length,
        general: general.length,
        eventLinkedPercentage: overallStats.totalPayments > 0 
          ? Math.round((eventLinked.length / overallStats.totalPayments) * 100) 
          : 0
      },
      topActiveUsers: activeUsers.slice(0, 5),
      recentLargePayments: largePayments.slice(0, 5)
    };
  }

  /**
   * Bulk create payments (for imports or batch operations)
   */
  async bulkCreatePayments(paymentsData) {
    if (!Array.isArray(paymentsData) || paymentsData.length === 0) {
      throw new ValidationError('Payments data must be a non-empty array');
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < paymentsData.length; i++) {
      try {
        const payment = await this.createPayment(paymentsData[i]);
        results.push(payment);
      } catch (error) {
        errors.push({
          index: i,
          data: paymentsData[i],
          error: error.message
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: paymentsData.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }
}

module.exports = PaymentService;