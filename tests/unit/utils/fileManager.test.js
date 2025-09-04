const fs = require('fs').promises;
const path = require('path');
const FileManager = require('../../../src/utils/fileManager');

describe('FileManager', () => {
  let fileManager;
  let testDataDir;

  beforeEach(() => {
    testDataDir = path.join(__dirname, '../../fixtures/temp-data');
    fileManager = new FileManager(testDataDir);
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testDataDir, { recursive: true });
    } catch (error) {
      // Directory doesn't exist, that's fine
    }
  });

  describe('constructor', () => {
    it('should create FileManager with default data directory', () => {
      const fm = new FileManager();
      expect(fm.dataDir).toContain('data');
    });

    it('should create FileManager with custom data directory', () => {
      expect(fileManager.dataDir).toContain('temp-data');
    });
  });

  describe('ensureDataDir', () => {
    it('should create data directory if it does not exist', async () => {
      await fileManager.ensureDataDir();
      
      const stats = await fs.stat(testDataDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      await fileManager.ensureDataDir();
      
      // Should not throw when called again
      await expect(fileManager.ensureDataDir()).resolves.not.toThrow();
    });
  });

  describe('readFile', () => {
    it('should return empty array for non-existent file', async () => {
      const data = await fileManager.readFile('nonexistent.json');
      expect(data).toEqual([]);
    });

    it('should read JSON data from existing file', async () => {
      const testData = [{ id: '1', name: 'Test' }];
      const fileName = 'test.json';
      
      // Create file first
      await fileManager.writeFile(fileName, testData);
      
      const data = await fileManager.readFile(fileName);
      expect(data).toEqual(testData);
    });

    it('should throw error for invalid JSON', async () => {
      const fileName = 'invalid.json';
      const filePath = fileManager.getFilePath(fileName);
      
      await fileManager.ensureDataDir();
      await fs.writeFile(filePath, 'invalid json content');
      
      await expect(fileManager.readFile(fileName))
        .rejects.toThrow('Invalid JSON in file invalid.json');
    });
  });

  describe('writeFile', () => {
    it('should write JSON data to file', async () => {
      const testData = [{ id: '1', name: 'Test User' }];
      const fileName = 'test-write.json';
      
      await fileManager.writeFile(fileName, testData);
      
      const filePath = fileManager.getFilePath(fileName);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const parsedData = JSON.parse(fileContent);
      
      expect(parsedData).toEqual(testData);
    });

    it('should create backup before writing', async () => {
      const fileName = 'test-backup.json';
      const originalData = [{ id: '1', name: 'Original' }];
      const newData = [{ id: '2', name: 'New' }];
      
      // Create original file
      await fileManager.writeFile(fileName, originalData);
      
      // Update file (should create backup)
      await fileManager.writeFile(fileName, newData);
      
      // Verify new data is written
      const data = await fileManager.readFile(fileName);
      expect(data).toEqual(newData);
    });

    it('should restore backup if write fails', async () => {
      const fileName = 'test-restore.json';
      const originalData = [{ id: '1', name: 'Original' }];
      
      // Create original file
      await fileManager.writeFile(fileName, originalData);
      
      // Mock fs.writeFile to fail
      const originalWriteFile = fs.writeFile;
      fs.writeFile = jest.fn().mockRejectedValue(new Error('Write failed'));
      
      try {
        // This should fail and restore backup
        await expect(fileManager.writeFile(fileName, [{ invalid: 'data' }]))
          .rejects.toThrow('Write failed');
        
        // Verify original data is restored
        const data = await fileManager.readFile(fileName);
        expect(data).toEqual(originalData);
      } finally {
        // Restore original fs.writeFile
        fs.writeFile = originalWriteFile;
      }
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const fileName = 'exists.json';
      await fileManager.writeFile(fileName, []);
      
      const exists = await fileManager.fileExists(fileName);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await fileManager.fileExists('nonexistent.json');
      expect(exists).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      const fileName = 'to-delete.json';
      await fileManager.writeFile(fileName, []);
      
      const deleted = await fileManager.deleteFile(fileName);
      expect(deleted).toBe(true);
      
      const exists = await fileManager.fileExists(fileName);
      expect(exists).toBe(false);
    });

    it('should return false for non-existent file', async () => {
      const deleted = await fileManager.deleteFile('nonexistent.json');
      expect(deleted).toBe(false);
    });
  });

  describe('getFileStats', () => {
    it('should return file stats for existing file', async () => {
      const fileName = 'stats.json';
      await fileManager.writeFile(fileName, []);
      
      const stats = await fileManager.getFileStats(fileName);
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('modified');
      expect(stats).toHaveProperty('created');
      expect(typeof stats.size).toBe('number');
      expect(stats.modified).toBeInstanceOf(Date);
      expect(stats.created).toBeInstanceOf(Date);
    });

    it('should return null for non-existent file', async () => {
      const stats = await fileManager.getFileStats('nonexistent.json');
      expect(stats).toBeNull();
    });
  });

  describe('getFilePath', () => {
    it('should return correct file path', () => {
      const fileName = 'test.json';
      const filePath = fileManager.getFilePath(fileName);
      
      expect(filePath).toContain('temp-data');
      expect(filePath).toContain('test.json');
      expect(path.isAbsolute(filePath)).toBe(true);
    });
  });
});