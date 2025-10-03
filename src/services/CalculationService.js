const { ValidationError } = require('../utils/errors');

/**
 * Service for balance and cost calculations
 * Handles complex financial calculations across events
 */
class CalculationService {
  constructor(userRepository, eventRepository, costItemRepository, paymentRepository) {
    this.userRepo = userRepository;
    this.eventRepo = eventRepository;
    this.costItemRepo = costItemRepository;
    this.paymentRepo = paymentRepository;
  }

  /**
   * Calculate how much each user owes for a specific cost item
   */
  calculateCostItemBalances(costItem) {
    if (!costItem || !costItem.amount) {
      throw new ValidationError('Invalid cost item for balance calculation');
    }

    // Prefer shares over percentages for precision (shares take precedence when both exist)
    if (costItem.splitShares) {
      return this.calculateSharesBasedBalances(costItem);
    } else if (costItem.splitPercentage) {
      return this.calculatePercentageBasedBalances(costItem);
    } else {
      throw new ValidationError('Cost item must have either split shares or split percentage');
    }
  }

  /**
   * Calculate balances using shares-based method (precise, no rounding errors)
   */
  calculateSharesBasedBalances(costItem) {
    const balances = {};
    const totalShares = Object.values(costItem.splitShares).reduce((sum, shares) => sum + shares, 0);

    if (totalShares === 0) {
      throw new ValidationError('Total shares must be greater than 0');
    }

    // Calculate base amount per share (in cents to avoid floating point issues)
    const totalCents = Math.round(costItem.amount * 100);
    const centsPerShare = Math.floor(totalCents / totalShares);
    const remainder = totalCents - (centsPerShare * totalShares);

    const participants = Object.entries(costItem.splitShares).filter(([_, shares]) => shares > 0);

    // Group participants by share count to ensure equal shares get equal amounts
    const shareGroups = new Map();
    participants.forEach(([userId, shares]) => {
      if (!shareGroups.has(shares)) {
        shareGroups.set(shares, []);
      }
      shareGroups.get(shares).push(userId);
    });

    // Sort share groups by share count (descending) to prioritize larger shareholders for remainder
    const sortedShareGroups = Array.from(shareGroups.entries()).sort((a, b) => b[0] - a[0]);

    let remainderToDistribute = remainder;

    // Distribute amounts group by group
    sortedShareGroups.forEach(([shares, userIds]) => {
      const groupSize = userIds.length;
      const baseCents = centsPerShare * shares;

      // Calculate how many extra cents this group should get
      // Each person gets their fair share of the remainder based on their shares
      const groupTotalShares = shares * groupSize;
      const groupRemainderFloat = (remainder * groupTotalShares) / totalShares;
      const groupRemainderCents = Math.round(groupRemainderFloat);

      // Distribute group remainder evenly among group members
      const centsPerPersonInGroup = Math.floor(groupRemainderCents / groupSize);
      const extraForSome = groupRemainderCents % groupSize;

      userIds.forEach((userId, index) => {
        let userCents = baseCents + centsPerPersonInGroup;

        // First few people in group get one extra cent
        if (index < extraForSome) {
          userCents += 1;
        }

        balances[userId] = userCents / 100;
      });
    });

    return {
      costItemId: costItem.id,
      paidBy: costItem.paidBy,
      totalAmount: costItem.amount,
      balances,
      splitMode: 'shares'
    };
  }

  /**
   * Calculate balances using percentage-based method (legacy)
   */
  calculatePercentageBasedBalances(costItem) {
    if (!costItem.splitPercentage) {
      throw new ValidationError('Split percentage is required for percentage-based calculation');
    }

    const balances = {};
    const totalPercentage = Object.values(costItem.splitPercentage).reduce((sum, pct) => sum + pct, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new ValidationError('Split percentages must sum to 100%');
    }

    // Calculate how much each participant owes
    const participantEntries = Object.entries(costItem.splitPercentage).filter(([userId, percentage]) => percentage > 0);

    // Check if this is an equal split scenario that needs special handling
    const isEqualSplit = this.isEqualSplitScenario(costItem.splitPercentage);

    if (isEqualSplit) {
      // For equal splits, divide the amount directly to avoid rounding issues
      this.calculateEqualSplitBalances(costItem.amount, participantEntries, balances);
    } else {
      // For custom splits, use percentage-based calculation
      participantEntries.forEach(([userId, percentage]) => {
        const owedAmount = (costItem.amount * percentage) / 100;
        balances[userId] = Math.round(owedAmount * 100) / 100;
      });
    }

    return {
      costItemId: costItem.id,
      paidBy: costItem.paidBy,
      totalAmount: costItem.amount,
      balances,
      splitMode: 'percentage'
    };
  }

  /**
   * Detect if split percentages represent an equal split scenario
   */
  isEqualSplitScenario(splitPercentage) {
    const activePercentages = Object.values(splitPercentage).filter(p => p > 0);

    if (activePercentages.length === 0) return false;

    // Check if all active percentages are approximately equal
    // Allow for small differences due to rounding (e.g., 16.66, 16.66, 16.66, 16.66, 16.66, 16.70)
    const expectedPercentage = 100 / activePercentages.length;
    const tolerance = 0.1; // Allow 0.1% difference for rounding adjustments

    return activePercentages.every(percentage =>
      Math.abs(percentage - expectedPercentage) <= tolerance
    );
  }

  /**
   * Calculate equal split balances by dividing amount directly
   * This ensures truly equal amounts regardless of percentage rounding
   */
  calculateEqualSplitBalances(totalAmount, participantEntries, balances) {
    const participantCount = participantEntries.length;

    // Calculate base amount per person
    const baseAmount = Math.floor(totalAmount * 100) / (participantCount * 100); // Precise division
    let totalAssigned = 0;

    // Assign base amount to all participants except the last
    for (let i = 0; i < participantCount - 1; i++) {
      const [userId] = participantEntries[i];
      const amount = Math.round(baseAmount * 100) / 100;
      balances[userId] = amount;
      totalAssigned += amount;
    }

    // Last participant gets the remainder to ensure total equals original amount
    if (participantCount > 0) {
      const [lastUserId] = participantEntries[participantCount - 1];
      const remainingAmount = Math.round((totalAmount - totalAssigned) * 100) / 100;
      balances[lastUserId] = remainingAmount;
    }
  }

  /**
   * Calculate net balance for a specific event
   */
  async calculateEventBalance(eventId) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new ValidationError('Event not found');
    }

    const costItems = await this.costItemRepo.findByEvent(eventId);
    const payments = await this.paymentRepo.findByEvent(eventId);

    const userBalances = {};
    
    // Initialize balances for all participants
    event.participants.forEach(userId => {
      userBalances[userId] = { owes: 0, paid: 0, net: 0 };
    });

    // Process cost items
    costItems.forEach(costItem => {
      const itemBalances = this.calculateCostItemBalances(costItem);
      
      // Add to amounts owed by each participant
      Object.entries(itemBalances.balances).forEach(([userId, amount]) => {
        if (userBalances[userId]) {
          userBalances[userId].owes += amount;
        }
      });

      // Add to amounts paid by the payer
      if (userBalances[costItem.paidBy]) {
        userBalances[costItem.paidBy].paid += costItem.amount;
      }
    });

    // Process payments
    payments.forEach(payment => {
      if (userBalances[payment.userId]) {
        userBalances[payment.userId].paid += payment.amount;
      }
    });

    // Calculate net balances
    Object.keys(userBalances).forEach(userId => {
      const balance = userBalances[userId];
      balance.net = Math.round((balance.paid - balance.owes) * 100) / 100;
      balance.owes = Math.round(balance.owes * 100) / 100;
      balance.paid = Math.round(balance.paid * 100) / 100;
    });

    return {
      eventId,
      eventName: event.name,
      userBalances,
      totalCosts: Math.round(costItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100,
      totalPayments: Math.round(payments.reduce((sum, payment) => sum + payment.amount, 0) * 100) / 100
    };
  }

  /**
   * Calculate cross-event balance for a specific user
   */
  async calculateUserBalance(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    const events = await this.eventRepo.findByParticipant(userId);
    const allCostItems = await this.costItemRepo.findByParticipant(userId);
    const paidCostItems = await this.costItemRepo.findByPaidBy(userId);
    const allPayments = await this.paymentRepo.findByUser(userId);

    let totalOwes = 0;
    let totalPaid = 0;

    // Calculate amounts owed from cost items where user is participant
    allCostItems.forEach(costItem => {
      const itemBalances = this.calculateCostItemBalances(costItem);
      if (itemBalances.balances[userId]) {
        totalOwes += itemBalances.balances[userId];
      }
    });

    // Calculate amounts paid for cost items
    paidCostItems.forEach(costItem => {
      totalPaid += costItem.amount;
    });

    // Add direct payments
    allPayments.forEach(payment => {
      totalPaid += payment.amount;
    });

    const netBalance = Math.round((totalPaid - totalOwes) * 100) / 100;

    return {
      userId,
      userName: user.name,
      totalOwes: Math.round(totalOwes * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      netBalance,
      status: this.getBalanceStatus(netBalance),
      events: events.length,
      costItems: allCostItems.length,
      payments: allPayments.length
    };
  }

  /**
   * Calculate balances for all users across all events
   */
  async calculateAllUserBalances() {
    const users = await this.userRepo.findAll();
    const balances = [];

    for (const user of users) {
      const balance = await this.calculateUserBalance(user.id);
      balances.push(balance);
    }

    return balances.sort((a, b) => b.netBalance - a.netBalance);
  }

  /**
   * Calculate suggested settlements to balance everyone
   */
  async calculateSettlements() {
    const userBalances = await this.calculateAllUserBalances();
    
    // Separate users who owe money from those who are owed money
    const debtors = userBalances.filter(b => b.netBalance < -0.01);
    const creditors = userBalances.filter(b => b.netBalance > 0.01);
    
    const settlements = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      
      const debtAmount = Math.abs(debtor.netBalance);
      const creditAmount = creditor.netBalance;
      
      const settlementAmount = Math.min(debtAmount, creditAmount);
      
      settlements.push({
        from: {
          userId: debtor.userId,
          userName: debtor.userName
        },
        to: {
          userId: creditor.userId,
          userName: creditor.userName
        },
        amount: Math.round(settlementAmount * 100) / 100,
        description: `${debtor.userName} pays ${creditor.userName}`
      });
      
      // Update balances
      debtor.netBalance += settlementAmount;
      creditor.netBalance -= settlementAmount;
      
      // Move to next debtor/creditor if current one is settled
      if (Math.abs(debtor.netBalance) < 0.01) {
        debtorIndex++;
      }
      if (Math.abs(creditor.netBalance) < 0.01) {
        creditorIndex++;
      }
    }

    const totalDebt = Math.round(debtors.reduce((sum, d) => sum + Math.abs(d.netBalance), 0) * 100) / 100;
    const totalCredit = Math.round(creditors.reduce((sum, c) => sum + c.netBalance, 0) * 100) / 100;

    return {
      settlements,
      summary: {
        totalSettlements: settlements.length,
        totalDebt,
        totalCredit,
        balanced: Math.abs(totalDebt - totalCredit) < 0.01
      }
    };
  }

  /**
   * Validate cost item split percentages
   */
  validateSplitPercentages(splitPercentage) {
    if (!splitPercentage || typeof splitPercentage !== 'object') {
      throw new ValidationError('Split percentage must be an object');
    }

    const percentages = Object.values(splitPercentage);
    if (percentages.length === 0) {
      throw new ValidationError('At least one participant must have a non-zero split');
    }

    const totalPercentage = percentages.reduce((sum, pct) => {
      if (typeof pct !== 'number' || pct < 0 || pct > 100) {
        throw new ValidationError('Each split percentage must be between 0 and 100');
      }
      return sum + pct;
    }, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new ValidationError('Split percentages must sum to exactly 100%');
    }

    return true;
  }

  /**
   * Create equal split percentages for participants
   */
  createEqualSplit(participantIds) {
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      throw new ValidationError('Must provide at least one participant');
    }

    const percentage = 100 / participantIds.length;
    const splitPercentage = {};
    
    participantIds.forEach(userId => {
      splitPercentage[userId] = Math.round(percentage * 100) / 100;
    });

    // Adjust for rounding errors
    const totalPercentage = Object.values(splitPercentage).reduce((sum, pct) => sum + pct, 0);
    const diff = 100 - totalPercentage;
    
    if (Math.abs(diff) > 0.01) {
      const firstUserId = participantIds[0];
      splitPercentage[firstUserId] += Math.round(diff * 100) / 100;
    }

    return splitPercentage;
  }

  /**
   * Get balance status description
   */
  getBalanceStatus(balance) {
    const tolerance = 0.01;
    
    if (balance > tolerance) {
      return 'owed'; // User is owed money
    } else if (balance < -tolerance) {
      return 'owes'; // User owes money
    } else {
      return 'settled'; // User is balanced
    }
  }

  /**
   * Calculate statistics for an event
   */
  async getEventStatistics(eventId) {
    const eventBalance = await this.calculateEventBalance(eventId);
    const costItems = await this.costItemRepo.findByEvent(eventId);
    const payments = await this.paymentRepo.findByEvent(eventId);

    const userBalances = Object.values(eventBalance.userBalances);
    const totalParticipants = userBalances.length;
    const usersOwing = userBalances.filter(b => b.net < -0.01).length;
    const usersOwed = userBalances.filter(b => b.net > 0.01).length;
    const usersSettled = totalParticipants - usersOwing - usersOwed;

    return {
      eventId,
      totalCostItems: costItems.length,
      totalPayments: payments.length,
      totalAmount: eventBalance.totalCosts,
      totalPaymentsAmount: eventBalance.totalPayments,
      averageCostPerItem: costItems.length > 0 ? Math.round((eventBalance.totalCosts / costItems.length) * 100) / 100 : 0,
      averageOwedPerUser: totalParticipants > 0 ? Math.round((eventBalance.totalCosts / totalParticipants) * 100) / 100 : 0,
      participantStats: {
        total: totalParticipants,
        owing: usersOwing,
        owed: usersOwed,
        settled: usersSettled
      }
    };
  }
}

module.exports = CalculationService;