const ExpenseTemplateService = require('../../../src/services/ExpenseTemplateService');
const ExpenseTemplate = require('../../../src/models/ExpenseTemplate');
const { ValidationError, NotFoundError } = require('../../../src/utils/errors');

describe('ExpenseTemplateService', () => {
  let templateService;
  let mockTemplateRepo;
  let mockUserRepo;

  beforeEach(() => {
    mockTemplateRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      nameExists: jest.fn(),
      findByCategory: jest.fn(),
      getQuickAddTemplates: jest.fn(),
      reorder: jest.fn(),
    };

    mockUserRepo = {
      findById: jest.fn(),
    };

    templateService = new ExpenseTemplateService(mockTemplateRepo, mockUserRepo);
  });

  describe('createTemplate', () => {
    const validTemplateData = {
      name: 'Court Rental',
      defaultAmount: 65,
      category: null,
      defaultPaidBy: null,
      order: 1,
    };

    it('should create a template with valid data', async () => {
      const createdTemplate = new ExpenseTemplate({ id: 'template1', ...validTemplateData });

      mockTemplateRepo.nameExists.mockResolvedValue(false);
      mockTemplateRepo.create.mockResolvedValue(createdTemplate);

      const result = await templateService.createTemplate(validTemplateData);

      expect(mockTemplateRepo.create).toHaveBeenCalled();
      expect(result).toEqual(createdTemplate);
    });

    it('should validate default payer exists if provided', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const templateData = {
        ...validTemplateData,
        defaultPaidBy: userId,
      };

      mockUserRepo.findById.mockResolvedValue({ id: userId, name: 'John' });
      mockTemplateRepo.nameExists.mockResolvedValue(false);
      mockTemplateRepo.create.mockResolvedValue(new ExpenseTemplate(templateData));

      await templateService.createTemplate(templateData);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw error if default payer does not exist', async () => {
      const templateData = {
        ...validTemplateData,
        defaultPaidBy: 'nonexistent',
      };

      mockUserRepo.findById.mockResolvedValue(null);

      await expect(templateService.createTemplate(templateData))
        .rejects.toThrow('User with ID nonexistent does not exist');
    });

    it('should throw error for invalid template data', async () => {
      const invalidData = { name: '', defaultAmount: -10 };

      await expect(templateService.createTemplate(invalidData))
        .rejects.toThrow('Template validation failed');
    });
  });

  describe('getTemplateById', () => {
    it('should return template by ID', async () => {
      const template = new ExpenseTemplate({
        id: 'template1',
        name: 'Court Rental',
        defaultAmount: 65,
      });

      mockTemplateRepo.findById.mockResolvedValue(template);

      const result = await templateService.getTemplateById('template1');

      expect(mockTemplateRepo.findById).toHaveBeenCalledWith('template1');
      expect(result).toEqual(template);
    });

    it('should throw error if template not found', async () => {
      mockTemplateRepo.findById.mockResolvedValue(null);

      await expect(templateService.getTemplateById('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw error if template ID not provided', async () => {
      await expect(templateService.getTemplateById(null))
        .rejects.toThrow('Template ID is required');
    });
  });

  describe('getAllTemplates', () => {
    it('should return all templates ordered by order field', async () => {
      const templates = [
        new ExpenseTemplate({ id: 't1', name: 'Court', defaultAmount: 65, order: 1 }),
        new ExpenseTemplate({ id: 't2', name: 'Shuttle', defaultAmount: 20, order: 2 }),
      ];

      mockTemplateRepo.findAll.mockResolvedValue(templates);

      const result = await templateService.getAllTemplates();

      expect(mockTemplateRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(templates);
    });

    it('should return empty array if no templates exist', async () => {
      mockTemplateRepo.findAll.mockResolvedValue([]);

      const result = await templateService.getAllTemplates();

      expect(result).toEqual([]);
    });
  });

  describe('getQuickAddTemplates', () => {
    it('should return limited number of templates', async () => {
      const templates = [
        new ExpenseTemplate({ id: 't1', name: 'Court', defaultAmount: 65, order: 1 }),
        new ExpenseTemplate({ id: 't2', name: 'Shuttle', defaultAmount: 20, order: 2 }),
      ];

      mockTemplateRepo.getQuickAddTemplates.mockResolvedValue(templates);

      const result = await templateService.getQuickAddTemplates(6);

      expect(mockTemplateRepo.getQuickAddTemplates).toHaveBeenCalledWith(6);
      expect(result).toEqual(templates);
    });
  });

  describe('updateTemplate', () => {
    const existingTemplate = new ExpenseTemplate({
      id: 'template1',
      name: 'Court Rental',
      defaultAmount: 65,
      order: 1,
    });

    it('should update template with valid data', async () => {
      const updateData = { defaultAmount: 70 };
      const updatedTemplate = new ExpenseTemplate({ ...existingTemplate, ...updateData });

      mockTemplateRepo.findById.mockResolvedValue(existingTemplate);
      mockTemplateRepo.update.mockResolvedValue(updatedTemplate);

      const result = await templateService.updateTemplate('template1', updateData);

      expect(mockTemplateRepo.update).toHaveBeenCalledWith('template1', updateData);
      expect(result.defaultAmount).toBe(70);
    });

    it('should validate default payer exists when updating', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { defaultPaidBy: userId };

      mockTemplateRepo.findById.mockResolvedValue(existingTemplate);
      mockUserRepo.findById.mockResolvedValue({ id: userId, name: 'John' });
      mockTemplateRepo.update.mockResolvedValue(new ExpenseTemplate({ ...existingTemplate, ...updateData }));

      await templateService.updateTemplate('template1', updateData);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw error if template not found', async () => {
      mockTemplateRepo.findById.mockResolvedValue(null);

      await expect(templateService.updateTemplate('nonexistent', { name: 'New Name' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete existing template', async () => {
      const template = new ExpenseTemplate({
        id: 'template1',
        name: 'Court Rental',
        defaultAmount: 65,
      });

      mockTemplateRepo.findById.mockResolvedValue(template);
      mockTemplateRepo.delete.mockResolvedValue(template);

      const result = await templateService.deleteTemplate('template1');

      expect(mockTemplateRepo.delete).toHaveBeenCalledWith('template1');
      expect(result).toEqual(template);
    });

    it('should throw error if template not found', async () => {
      mockTemplateRepo.findById.mockResolvedValue(null);

      await expect(templateService.deleteTemplate('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('templateToExpenseData', () => {
    const template = new ExpenseTemplate({
      id: 'template1',
      name: 'Court Rental',
      defaultAmount: 65,
      defaultPaidBy: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
    });

    const eventParticipants = ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174000', '323e4567-e89b-12d3-a456-426614174000'];

    it('should convert template to expense data with equal shares', async () => {
      mockTemplateRepo.findById.mockResolvedValue(template);

      const result = await templateService.templateToExpenseData(
        'template1',
        'event1',
        eventParticipants
      );

      expect(result.description).toBe('Court Rental');
      expect(result.amount).toBe(65);
      expect(result.paidBy).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.splitShares).toEqual({
        '123e4567-e89b-12d3-a456-426614174000': 1,
        '223e4567-e89b-12d3-a456-426614174000': 1,
        '323e4567-e89b-12d3-a456-426614174000': 1,
      });
      expect(result.splitMode).toBe('shares');
    });

    it('should clear default payer if not in event participants', async () => {
      const externalUserId = '999e4567-e89b-12d3-a456-426614174000';
      const templateWithExternalPayer = new ExpenseTemplate({
        ...template,
        defaultPaidBy: externalUserId, // Not in event participants
      });

      mockTemplateRepo.findById.mockResolvedValue(templateWithExternalPayer);

      const result = await templateService.templateToExpenseData(
        'template1',
        'event1',
        eventParticipants
      );

      expect(result.paidBy).toBe(''); // Cleared because user not in participants
    });

    it('should throw error if template ID not provided', async () => {
      await expect(templateService.templateToExpenseData(null, 'event1', []))
        .rejects.toThrow('Template ID is required');
    });

    it('should throw error if event ID not provided', async () => {
      await expect(templateService.templateToExpenseData('template1', null, []))
        .rejects.toThrow('Event ID is required');
    });
  });

  describe('reorderTemplates', () => {
    it('should reorder templates with valid updates', async () => {
      const orderUpdates = [
        { id: 't1', order: 2 },
        { id: 't2', order: 1 },
      ];

      mockTemplateRepo.exists.mockResolvedValue(true);
      mockTemplateRepo.reorder.mockResolvedValue([]);

      await templateService.reorderTemplates(orderUpdates);

      expect(mockTemplateRepo.reorder).toHaveBeenCalledWith(orderUpdates);
    });

    it('should throw error if order updates is not an array', async () => {
      await expect(templateService.reorderTemplates(null))
        .rejects.toThrow('Order updates must be a non-empty array');
    });

    it('should throw error if template does not exist', async () => {
      const orderUpdates = [{ id: 'nonexistent', order: 1 }];

      mockTemplateRepo.exists.mockResolvedValue(false);

      await expect(templateService.reorderTemplates(orderUpdates))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getTemplateStats', () => {
    it('should return template statistics', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const templates = [
        new ExpenseTemplate({ id: 't1', name: 'Court', defaultAmount: 65, defaultPaidBy: userId, category: null }),
        new ExpenseTemplate({ id: 't2', name: 'Shuttle', defaultAmount: 20, defaultPaidBy: null, category: 'Equipment' }),
      ];

      mockTemplateRepo.findAll.mockResolvedValue(templates);

      const stats = await templateService.getTemplateStats();

      expect(stats.total).toBe(2);
      expect(stats.withDefaultPayer).toBe(1);
      expect(stats.withoutDefaultPayer).toBe(1);
      expect(stats.categorized).toBe(1);
      expect(stats.uncategorized).toBe(1);
    });
  });
});
