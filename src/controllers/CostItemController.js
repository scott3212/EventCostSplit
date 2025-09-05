const { ValidationError, NotFoundError } = require('../utils/errors');

class CostItemController {
  constructor(costItemService) {
    this.costItemService = costItemService;
  }

  async createCostItem(req, res) {
    try {
      const costItemData = req.body;
      const costItem = await this.costItemService.createCostItem(costItemData);
      res.status(201).json({
        success: true,
        data: costItem,
        message: 'Cost item created successfully'
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
          error: 'Failed to create cost item'
        });
      }
    }
  }

  async getAllCostItems(req, res) {
    try {
      const costItems = await this.costItemService.getAllCostItems();
      res.status(200).json({
        success: true,
        data: costItems,
        count: costItems.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cost items'
      });
    }
  }

  async getCostItemById(req, res) {
    try {
      const { id } = req.params;
      const costItem = await this.costItemService.getCostItemById(id);
      res.status(200).json({
        success: true,
        data: costItem
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
          error: 'Failed to retrieve cost item'
        });
      }
    }
  }

  async updateCostItem(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const costItem = await this.costItemService.updateCostItem(id, updateData);
      res.status(200).json({
        success: true,
        data: costItem,
        message: 'Cost item updated successfully'
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
          error: 'Failed to update cost item'
        });
      }
    }
  }

  async deleteCostItem(req, res) {
    try {
      const { id } = req.params;
      await this.costItemService.deleteCostItem(id);
      res.status(200).json({
        success: true,
        message: 'Cost item deleted successfully'
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
          error: 'Failed to delete cost item'
        });
      }
    }
  }

  async getCostItemsForEvent(req, res) {
    try {
      const { eventId } = req.params;
      const costItems = await this.costItemService.getCostItemsForEvent(eventId);
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
          error: 'Failed to retrieve cost items for event'
        });
      }
    }
  }

  async getCostItemsPaidByUser(req, res) {
    try {
      const { userId } = req.params;
      const costItems = await this.costItemService.getCostItemsPaidByUser(userId);
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
          error: 'Failed to retrieve cost items paid by user'
        });
      }
    }
  }

  async getCostItemsForParticipant(req, res) {
    try {
      const { userId } = req.params;
      const costItems = await this.costItemService.getCostItemsForParticipant(userId);
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
          error: 'Failed to retrieve cost items for participant'
        });
      }
    }
  }

  async getCostItemWithBalance(req, res) {
    try {
      const { id } = req.params;
      const costItemWithBalance = await this.costItemService.getCostItemWithBalance(id);
      res.status(200).json({
        success: true,
        data: costItemWithBalance
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
          error: 'Failed to retrieve cost item with balance'
        });
      }
    }
  }

  async searchCostItems(req, res) {
    try {
      const { searchTerm } = req.query;
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          error: 'Search term is required'
        });
      }

      const costItems = await this.costItemService.searchCostItems(searchTerm);
      res.status(200).json({
        success: true,
        data: costItems,
        count: costItems.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to search cost items'
      });
    }
  }

  async getCostItemsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Start date and end date are required'
        });
      }

      const costItems = await this.costItemService.getCostItemsByDateRange(startDate, endDate);
      res.status(200).json({
        success: true,
        data: costItems,
        count: costItems.length
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
          error: 'Failed to retrieve cost items by date range'
        });
      }
    }
  }

  async getCostItemsByAmountRange(req, res) {
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

      const costItems = await this.costItemService.getCostItemsByAmountRange(minAmountNum, maxAmountNum);
      res.status(200).json({
        success: true,
        data: costItems,
        count: costItems.length
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
          error: 'Failed to retrieve cost items by amount range'
        });
      }
    }
  }

  async getExpensiveCostItems(req, res) {
    try {
      const { threshold } = req.query;
      const thresholdNum = threshold ? parseFloat(threshold) : undefined;
      const costItems = await this.costItemService.getExpensiveCostItems(thresholdNum);
      res.status(200).json({
        success: true,
        data: costItems,
        count: costItems.length
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
          error: 'Failed to retrieve expensive cost items'
        });
      }
    }
  }

  async getEqualSplitItems(req, res) {
    try {
      const costItems = await this.costItemService.getEqualSplitItems();
      res.status(200).json({
        success: true,
        data: costItems,
        count: costItems.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve equal split cost items'
      });
    }
  }

  async getCustomSplitItems(req, res) {
    try {
      const costItems = await this.costItemService.getCustomSplitItems();
      res.status(200).json({
        success: true,
        data: costItems,
        count: costItems.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve custom split cost items'
      });
    }
  }

  async updateSplitPercentage(req, res) {
    try {
      const { id } = req.params;
      const { splitPercentage } = req.body;

      if (!splitPercentage || typeof splitPercentage !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Split percentage data is required'
        });
      }

      const costItem = await this.costItemService.updateSplitPercentage(id, splitPercentage);
      res.status(200).json({
        success: true,
        data: costItem,
        message: 'Split percentage updated successfully'
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
          error: 'Failed to update split percentage'
        });
      }
    }
  }

  async createEqualSplit(req, res) {
    try {
      const { eventId } = req.params;
      const { excludeUsers = [] } = req.body;

      const splitPercentage = await this.costItemService.createEqualSplit(eventId, excludeUsers);
      res.status(200).json({
        success: true,
        data: { splitPercentage },
        message: 'Equal split created successfully'
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
          error: 'Failed to create equal split'
        });
      }
    }
  }

  async getEventCostStatistics(req, res) {
    try {
      const { eventId } = req.params;
      const statistics = await this.costItemService.getEventCostStatistics(eventId);
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
          error: 'Failed to retrieve event cost statistics'
        });
      }
    }
  }

  async getCostItemDetails(req, res) {
    try {
      const { id } = req.params;
      const details = await this.costItemService.getCostItemDetails(id);
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
          error: 'Failed to retrieve cost item details'
        });
      }
    }
  }

  async getCostItemAnalytics(req, res) {
    try {
      const analytics = await this.costItemService.getCostItemAnalytics();
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cost item analytics'
      });
    }
  }

  async validateCostItemData(req, res) {
    try {
      const costItemData = req.body;
      const validation = this.costItemService.validateCostItemData(costItemData);
      res.status(200).json({
        success: true,
        data: validation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to validate cost item data'
      });
    }
  }
}

module.exports = CostItemController;