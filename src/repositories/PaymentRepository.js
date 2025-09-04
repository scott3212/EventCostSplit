const BaseRepository = require('./BaseRepository');
const { DATA_FILES } = require('../config/constants');

/**
 * Payment repository for payment-specific data operations
 * Extends BaseRepository with payment-specific methods
 */
class PaymentRepository extends BaseRepository {
  constructor() {
    super(DATA_FILES.PAYMENTS);
  }

  /**
   * Find payments by user ID
   */
  async findByUser(userId) {
    if (!userId) return [];
    
    return await this.findBy({ userId });
  }

  /**
   * Find payments related to specific event
   */
  async findByEvent(eventId) {
    if (!eventId) return [];
    
    return await this.findBy({ relatedEventId: eventId });
  }

  /**
   * Find payments by date range
   */
  async findByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return await this.findBy({
      date: (paymentDate) => {
        const date = new Date(paymentDate);
        return date >= start && date <= end;
      }
    });
  }

  /**
   * Find payments by amount range
   */
  async findByAmountRange(minAmount, maxAmount) {
    return await this.findBy({
      amount: (amount) => amount >= minAmount && amount <= maxAmount
    });
  }

  /**
   * Find large payments above threshold
   */
  async findLargePayments(threshold = 50) {
    return await this.findBy({
      amount: (amount) => amount >= threshold
    });
  }

  /**
   * Find recent payments (within specified days)
   */
  async findRecentPayments(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await this.findBy({
      date: (paymentDate) => new Date(paymentDate) >= cutoffDate
    });
  }

  /**
   * Find payments for today
   */
  async findTodayPayments() {
    const today = new Date().toDateString();
    
    return await this.findBy({
      date: (paymentDate) => new Date(paymentDate).toDateString() === today
    });
  }

  /**
   * Find payments linked to events (have relatedEventId)
   */
  async findEventLinkedPayments() {
    return await this.findBy({
      relatedEventId: (eventId) => eventId !== null && eventId !== undefined
    });
  }

  /**
   * Find general payments (not linked to events)
   */
  async findGeneralPayments() {
    return await this.findBy({
      relatedEventId: (eventId) => eventId === null || eventId === undefined
    });
  }

  /**
   * Get total amount paid by user
   */
  async getTotalPaidByUser(userId) {
    const payments = await this.findByUser(userId);
    return payments.reduce((total, payment) => total + payment.amount, 0);
  }

  /**
   * Get total amount paid for an event
   */
  async getTotalForEvent(eventId) {
    const payments = await this.findByEvent(eventId);
    return payments.reduce((total, payment) => total + payment.amount, 0);
  }

  /**
   * Get payment statistics for a user
   */
  async getUserPaymentStatistics(userId) {
    const payments = await this.findByUser(userId);
    
    if (payments.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        largestPayment: 0,
        smallestPayment: 0,
        lastPaymentDate: null,
        firstPaymentDate: null,
      };
    }

    const amounts = payments.map(p => p.amount);
    const dates = payments.map(p => new Date(p.date));
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);

    return {
      totalPayments: payments.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      averageAmount: Math.round((totalAmount / payments.length) * 100) / 100,
      largestPayment: Math.max(...amounts),
      smallestPayment: Math.min(...amounts),
      lastPaymentDate: new Date(Math.max(...dates)).toISOString(),
      firstPaymentDate: new Date(Math.min(...dates)).toISOString(),
    };
  }

  /**
   * Get overall payment statistics
   */
  async getPaymentStatistics() {
    const payments = await this.findAll();
    
    if (payments.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        largestPayment: 0,
        smallestPayment: 0,
        uniqueUsers: 0,
        eventLinkedPayments: 0,
        generalPayments: 0,
        recentPayments: 0,
      };
    }

    const amounts = payments.map(p => p.amount);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const uniqueUsers = new Set(payments.map(p => p.userId)).size;
    const eventLinked = payments.filter(p => p.relatedEventId).length;
    const recent = await this.findRecentPayments(7);

    return {
      totalPayments: payments.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      averageAmount: Math.round((totalAmount / payments.length) * 100) / 100,
      largestPayment: Math.max(...amounts),
      smallestPayment: Math.min(...amounts),
      uniqueUsers,
      eventLinkedPayments: eventLinked,
      generalPayments: payments.length - eventLinked,
      recentPayments: recent.length,
    };
  }

  /**
   * Get payments sorted by date
   */
  async findPaymentsByDate(order = 'desc') {
    const payments = await this.findAll();
    
    return payments.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }

  /**
   * Get payments sorted by amount
   */
  async findPaymentsByAmount(order = 'desc') {
    const payments = await this.findAll();
    
    return payments.sort((a, b) => {
      return order === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    });
  }

  /**
   * Search payments by description (partial match)
   */
  async searchByDescription(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') return [];
    
    const normalizedSearch = searchTerm.trim().toLowerCase();
    
    return await this.findBy({
      description: (desc) => desc && desc.toLowerCase().includes(normalizedSearch)
    });
  }

  /**
   * Get payments by month
   */
  async findPaymentsByMonth(year, month) {
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed
    const endDate = new Date(year, month, 0); // Last day of the month
    
    return await this.findByDateRange(startDate, endDate);
  }

  /**
   * Get monthly payment summary
   */
  async getMonthlyPaymentSummary(year, month) {
    const payments = await this.findPaymentsByMonth(year, month);
    
    if (payments.length === 0) {
      return {
        month: `${year}-${String(month).padStart(2, '0')}`,
        totalPayments: 0,
        totalAmount: 0,
        uniqueUsers: 0,
        dailyBreakdown: {},
      };
    }

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const uniqueUsers = new Set(payments.map(p => p.userId)).size;
    const dailyBreakdown = {};

    payments.forEach(payment => {
      const day = new Date(payment.date).getDate();
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = { count: 0, amount: 0 };
      }
      dailyBreakdown[day].count++;
      dailyBreakdown[day].amount += payment.amount;
    });

    // Round amounts in daily breakdown
    Object.keys(dailyBreakdown).forEach(day => {
      dailyBreakdown[day].amount = Math.round(dailyBreakdown[day].amount * 100) / 100;
    });

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      totalPayments: payments.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      uniqueUsers,
      dailyBreakdown,
    };
  }

  /**
   * Find users who made payments recently
   */
  async findActiveUsers(days = 30) {
    const recentPayments = await this.findRecentPayments(days);
    const userIds = [...new Set(recentPayments.map(p => p.userId))];
    
    return userIds.map(userId => {
      const userPayments = recentPayments.filter(p => p.userId === userId);
      const totalAmount = userPayments.reduce((sum, p) => sum + p.amount, 0);
      
      return {
        userId,
        paymentCount: userPayments.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
        lastPaymentDate: userPayments
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0].date,
      };
    }).sort((a, b) => new Date(b.lastPaymentDate) - new Date(a.lastPaymentDate));
  }

  /**
   * Get payment frequency analysis
   */
  async getPaymentFrequencyAnalysis() {
    const payments = await this.findPaymentsByDate('asc');
    
    if (payments.length < 2) {
      return {
        averageDaysBetweenPayments: 0,
        mostActiveDay: null,
        mostActiveMonth: null,
        paymentTrend: 'insufficient-data',
      };
    }

    // Calculate days between payments
    const daysBetween = [];
    for (let i = 1; i < payments.length; i++) {
      const prevDate = new Date(payments[i - 1].date);
      const currDate = new Date(payments[i].date);
      const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
      daysBetween.push(diffDays);
    }

    const avgDaysBetween = daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;

    // Find most active day of week
    const dayOfWeekCounts = {};
    const monthCounts = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.date);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    const mostActiveDay = Object.entries(dayOfWeekCounts)
      .reduce((max, [day, count]) => count > max.count ? { day, count } : max, { day: null, count: 0 }).day;

    const mostActiveMonth = Object.entries(monthCounts)
      .reduce((max, [month, count]) => count > max.count ? { month, count } : max, { month: null, count: 0 }).month;

    return {
      averageDaysBetweenPayments: Math.round(avgDaysBetween * 10) / 10,
      mostActiveDay,
      mostActiveMonth,
      paymentTrend: payments.length > 10 ? 'active' : 'moderate',
    };
  }
}

module.exports = PaymentRepository;