const { ValidationError, NotFoundError } = require('../utils/errors');

class PaymentController {
  constructor(paymentService) {
    this.paymentService = paymentService;
  }

  async createPayment(req, res) {
    try {
      const paymentData = req.body;
      const payment = await this.paymentService.createPayment(paymentData);
      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment created successfully'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create payment'
        });
      }
    }
  }

  async getAllPayments(req, res) {
    try {
      const payments = await this.paymentService.getAllPayments();
      res.status(200).json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payments'
      });
    }
  }

  async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      const payment = await this.paymentService.getPaymentById(id);
      res.status(200).json({
        success: true,
        data: payment
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
          error: 'Failed to retrieve payment'
        });
      }
    }
  }

  async updatePayment(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const payment = await this.paymentService.updatePayment(id, updateData);
      res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment updated successfully'
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
          error: 'Failed to update payment'
        });
      }
    }
  }

  async deletePayment(req, res) {
    try {
      const { id } = req.params;
      await this.paymentService.deletePayment(id);
      res.status(200).json({
        success: true,
        message: 'Payment deleted successfully'
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
          error: 'Failed to delete payment'
        });
      }
    }
  }

  async getPaymentsForUser(req, res) {
    try {
      const { userId } = req.params;
      const payments = await this.paymentService.getPaymentsForUser(userId);
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
          error: 'Failed to retrieve payments for user'
        });
      }
    }
  }

  async getPaymentsForEvent(req, res) {
    try {
      const { eventId } = req.params;
      const payments = await this.paymentService.getPaymentsForEvent(eventId);
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
          error: 'Failed to retrieve payments for event'
        });
      }
    }
  }

  async getPaymentsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Start date and end date are required'
        });
      }

      const payments = await this.paymentService.getPaymentsByDateRange(startDate, endDate);
      res.status(200).json({
        success: true,
        data: payments,
        count: payments.length
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
          error: 'Failed to retrieve payments by date range'
        });
      }
    }
  }

  async getPaymentsByAmountRange(req, res) {
    try {
      const { minAmount, maxAmount } = req.query;
      if (minAmount == null || maxAmount == null) {
        return res.status(400).json({
          success: false,
          error: 'Minimum and maximum amounts are required'
        });
      }

      const minAmountNum = parseFloat(minAmount);
      const maxAmountNum = parseFloat(maxAmount);

      if (isNaN(minAmountNum) || isNaN(maxAmountNum)) {
        return res.status(400).json({
          success: false,
          error: 'Amounts must be valid numbers'
        });
      }

      const payments = await this.paymentService.getPaymentsByAmountRange(minAmountNum, maxAmountNum);
      res.status(200).json({
        success: true,
        data: payments,
        count: payments.length
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
          error: 'Failed to retrieve payments by amount range'
        });
      }
    }
  }

  async getLargePayments(req, res) {
    try {
      const { threshold } = req.query;
      const thresholdNum = threshold ? parseFloat(threshold) : undefined;
      const payments = await this.paymentService.getLargePayments(thresholdNum);
      res.status(200).json({
        success: true,
        data: payments,
        count: payments.length
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
          error: 'Failed to retrieve large payments'
        });
      }
    }
  }

  async getRecentPayments(req, res) {
    try {
      const { days } = req.query;
      const daysNum = days ? parseInt(days) : undefined;
      const payments = await this.paymentService.getRecentPayments(daysNum);
      res.status(200).json({
        success: true,
        data: payments,
        count: payments.length
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
          error: 'Failed to retrieve recent payments'
        });
      }
    }
  }

  async getTotalPaidByUser(req, res) {
    try {
      const { userId } = req.params;
      const total = await this.paymentService.getTotalPaidByUser(userId);
      res.status(200).json({
        success: true,
        data: { total }
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
          error: 'Failed to retrieve total paid by user'
        });
      }
    }
  }

  async getTotalForEvent(req, res) {
    try {
      const { eventId } = req.params;
      const total = await this.paymentService.getTotalForEvent(eventId);
      res.status(200).json({
        success: true,
        data: { total }
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
          error: 'Failed to retrieve total for event'
        });
      }
    }
  }

  async searchPayments(req, res) {
    try {
      const { searchTerm } = req.query;
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          error: 'Search term is required'
        });
      }

      const payments = await this.paymentService.searchPayments(searchTerm);
      res.status(200).json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to search payments'
      });
    }
  }

  async processSettlement(req, res) {
    try {
      const { fromUserId, toUserId, amount, description } = req.body;

      if (!fromUserId || !toUserId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'From user ID, to user ID, and amount are required'
        });
      }

      const payment = await this.paymentService.processSettlement(fromUserId, toUserId, amount, description);
      res.status(201).json({
        success: true,
        data: payment,
        message: 'Settlement processed successfully'
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
          error: 'Failed to process settlement'
        });
      }
    }
  }

  async getSettlementSuggestions(req, res) {
    try {
      const suggestions = await this.paymentService.getSettlementSuggestions();
      res.status(200).json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve settlement suggestions'
      });
    }
  }

  async getPaymentStatistics(req, res) {
    try {
      const statistics = await this.paymentService.getPaymentStatistics();
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment statistics'
      });
    }
  }

  async getUserPaymentStatistics(req, res) {
    try {
      const { userId } = req.params;
      const statistics = await this.paymentService.getUserPaymentStatistics(userId);
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
          error: 'Failed to retrieve user payment statistics'
        });
      }
    }
  }

  async getPaymentDetails(req, res) {
    try {
      const { id } = req.params;
      const details = await this.paymentService.getPaymentDetails(id);
      res.status(200).json({
        success: true,
        data: details
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
          error: 'Failed to retrieve payment details'
        });
      }
    }
  }

  async getPaymentAnalytics(req, res) {
    try {
      const analytics = await this.paymentService.getPaymentAnalytics();
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment analytics'
      });
    }
  }

  async bulkCreatePayments(req, res) {
    try {
      const { payments } = req.body;

      if (!Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Payments array is required'
        });
      }

      const result = await this.paymentService.bulkCreatePayments(payments);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Bulk payment creation completed'
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
          error: 'Failed to create payments in bulk'
        });
      }
    }
  }

  async validatePaymentData(req, res) {
    try {
      const paymentData = req.body;
      const validation = this.paymentService.validatePaymentData(paymentData);
      res.status(200).json({
        success: true,
        data: validation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to validate payment data'
      });
    }
  }
}

module.exports = PaymentController;