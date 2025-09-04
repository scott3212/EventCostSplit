const BaseRepository = require('../../../src/repositories/BaseRepository');
const FileManager = require('../../../src/utils/fileManager');
const { generateTestUUID } = require('../../helpers/mockData');

// Mock FileManager
jest.mock('../../../src/utils/fileManager');

describe('BaseRepository', () => {
  let repository;
  let mockFileManager;
  let testData;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock FileManager instance
    mockFileManager = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    };
    FileManager.mockImplementation(() => mockFileManager);
    
    // Create repository instance
    repository = new BaseRepository('test.json');
    
    // Test data
    testData = [
      { id: '1', name: 'Item 1', value: 10 },
      { id: '2', name: 'Item 2', value: 20 },
      { id: '3', name: 'Item 3', value: 30 },
    ];
  });

  describe('constructor', () => {
    it('should create repository with filename', () => {
      expect(repository.filename).toBe('test.json');
      expect(FileManager).toHaveBeenCalled();
    });
  });

  describe('loadData', () => {
    it('should load data from file', async () => {
      mockFileManager.readFile.mockResolvedValue(testData);
      
      const data = await repository.loadData();
      
      expect(mockFileManager.readFile).toHaveBeenCalledWith('test.json');
      expect(data).toEqual(testData);
    });

    it('should cache loaded data', async () => {
      mockFileManager.readFile.mockResolvedValue(testData);
      
      // Load data twice
      await repository.loadData();
      await repository.loadData();
      
      // File should only be read once due to caching
      expect(mockFileManager.readFile).toHaveBeenCalledTimes(1);
    });

    it('should reload data after cache expires', async () => {
      mockFileManager.readFile.mockResolvedValue(testData);
      
      // Load data
      await repository.loadData();
      
      // Manually expire cache
      repository.cacheExpiry = Date.now() - 1000;
      
      // Load again
      await repository.loadData();
      
      expect(mockFileManager.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveData', () => {
    it('should save data to file and update cache', async () => {
      mockFileManager.writeFile.mockResolvedValue();
      
      await repository.saveData(testData);
      
      expect(mockFileManager.writeFile).toHaveBeenCalledWith('test.json', testData);
      expect(repository.cache).toEqual(testData);
    });
  });

  describe('clearCache', () => {
    it('should clear cached data', async () => {
      mockFileManager.readFile.mockResolvedValue(testData);
      
      // Load and cache data
      await repository.loadData();
      expect(repository.cache).toEqual(testData);
      
      // Clear cache
      repository.clearCache();
      expect(repository.cache).toBeNull();
      expect(repository.cacheExpiry).toBeNull();
    });
  });

  describe('CRUD operations', () => {
    beforeEach(() => {
      mockFileManager.readFile.mockResolvedValue(testData);
      mockFileManager.writeFile.mockResolvedValue();
    });

    describe('findAll', () => {
      it('should return all records', async () => {
        const result = await repository.findAll();
        expect(result).toEqual(testData);
      });
    });

    describe('findById', () => {
      it('should return record by ID', async () => {
        const result = await repository.findById('2');
        expect(result).toEqual({ id: '2', name: 'Item 2', value: 20 });
      });

      it('should return null for non-existent ID', async () => {
        const result = await repository.findById('999');
        expect(result).toBeNull();
      });
    });

    describe('findBy', () => {
      it('should find records by criteria', async () => {
        const result = await repository.findBy({ value: 20 });
        expect(result).toEqual([{ id: '2', name: 'Item 2', value: 20 }]);
      });

      it('should find records with function criteria', async () => {
        const result = await repository.findBy({ 
          value: (val) => val > 15 
        });
        expect(result).toHaveLength(2);
        expect(result[0].value).toBe(20);
        expect(result[1].value).toBe(30);
      });

      it('should return empty array when no matches', async () => {
        const result = await repository.findBy({ name: 'Non-existent' });
        expect(result).toEqual([]);
      });
    });

    describe('findOneBy', () => {
      it('should return first matching record', async () => {
        const result = await repository.findOneBy({ 
          value: (val) => val > 15 
        });
        expect(result).toEqual({ id: '2', name: 'Item 2', value: 20 });
      });

      it('should return null when no matches', async () => {
        const result = await repository.findOneBy({ name: 'Non-existent' });
        expect(result).toBeNull();
      });
    });

    describe('create', () => {
      it('should create new record with auto-generated ID', async () => {
        const newData = { name: 'New Item', value: 40 };
        
        const result = await repository.create(newData);
        
        expect(result).toHaveProperty('id');
        expect(result.name).toBe('New Item');
        expect(result.value).toBe(40);
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
        
        expect(mockFileManager.writeFile).toHaveBeenCalled();
      });
    });

    describe('update', () => {
      it('should update existing record', async () => {
        const updates = { name: 'Updated Item', value: 25 };
        
        const result = await repository.update('2', updates);
        
        expect(result.id).toBe('2');
        expect(result.name).toBe('Updated Item');
        expect(result.value).toBe(25);
        expect(result).toHaveProperty('updatedAt');
        
        expect(mockFileManager.writeFile).toHaveBeenCalled();
      });

      it('should return null for non-existent ID', async () => {
        const result = await repository.update('999', { name: 'Updated' });
        expect(result).toBeNull();
      });
    });

    describe('delete', () => {
      it('should delete existing record', async () => {
        const result = await repository.delete('2');
        
        expect(result).toEqual({ id: '2', name: 'Item 2', value: 20 });
        expect(mockFileManager.writeFile).toHaveBeenCalled();
      });

      it('should return false for non-existent ID', async () => {
        const result = await repository.delete('999');
        expect(result).toBe(false);
      });
    });

    describe('exists', () => {
      it('should return true for existing record', async () => {
        const result = await repository.exists('2');
        expect(result).toBe(true);
      });

      it('should return false for non-existent record', async () => {
        const result = await repository.exists('999');
        expect(result).toBe(false);
      });
    });

    describe('count', () => {
      it('should return total record count', async () => {
        const result = await repository.count();
        expect(result).toBe(3);
      });
    });

    describe('countBy', () => {
      it('should count records matching criteria', async () => {
        const result = await repository.countBy({ 
          value: (val) => val > 15 
        });
        expect(result).toBe(2);
      });
    });

    describe('paginate', () => {
      it('should return paginated results', async () => {
        const result = await repository.paginate(1, 2);
        
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('1');
        expect(result.data[1].id).toBe('2');
        
        expect(result.pagination).toEqual({
          page: 1,
          limit: 2,
          total: 3,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        });
      });

      it('should return second page results', async () => {
        const result = await repository.paginate(2, 2);
        
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('3');
        
        expect(result.pagination).toEqual({
          page: 2,
          limit: 2,
          total: 3,
          totalPages: 2,
          hasNext: false,
          hasPrev: true,
        });
      });
    });

    describe('bulkCreate', () => {
      it('should create multiple records', async () => {
        const newRecords = [
          { name: 'Bulk 1', value: 100 },
          { name: 'Bulk 2', value: 200 },
        ];
        
        const result = await repository.bulkCreate(newRecords);
        
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('id');
        expect(result[0].name).toBe('Bulk 1');
        expect(result[1]).toHaveProperty('id');
        expect(result[1].name).toBe('Bulk 2');
        
        expect(mockFileManager.writeFile).toHaveBeenCalled();
      });
    });

    describe('transaction', () => {
      it('should execute all operations successfully', async () => {
        let operationCount = 0;
        const operations = [
          () => { operationCount++; },
          () => { operationCount++; },
          () => { operationCount++; },
        ];
        
        await repository.transaction(operations);
        
        expect(operationCount).toBe(3);
      });

      it('should restore original data if operation fails', async () => {
        const operations = [
          () => { /* success */ },
          () => { throw new Error('Operation failed'); },
          () => { /* would not execute */ },
        ];
        
        await expect(repository.transaction(operations))
          .rejects.toThrow('Operation failed');
        
        // Should restore original data
        expect(mockFileManager.writeFile).toHaveBeenCalledWith('test.json', testData);
      });
    });
  });
});