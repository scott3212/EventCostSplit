const fs = require('fs').promises;
const path = require('path');

/**
 * File Manager utility for JSON file operations
 * Handles all file I/O operations with proper error handling
 */
class FileManager {
  constructor(dataDir = './data') {
    this.dataDir = path.resolve(dataDir);
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDir() {
    try {
      await fs.access(this.dataDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(this.dataDir, { recursive: true });
      } else {
        throw error;
      }
    }
  }

  /**
   * Get full file path for a data file
   */
  getFilePath(filename) {
    return path.join(this.dataDir, filename);
  }

  /**
   * Read JSON data from file
   * Returns empty array if file doesn't exist
   */
  async readFile(filename) {
    await this.ensureDataDir();
    const filePath = this.getFilePath(filename);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty array
        return [];
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in file ${filename}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Write JSON data to file with validation and atomic operations
   * Creates backup of existing file before writing
   */
  async writeFile(filename, data) {
    await this.ensureDataDir();
    const filePath = this.getFilePath(filename);
    const backupPath = `${filePath}.backup`;
    const tempPath = `${filePath}.tmp`;
    
    try {
      // Validate data before writing
      if (!Array.isArray(data)) {
        throw new Error(`Data for ${filename} must be an array, got ${typeof data}`);
      }

      // Create backup if file exists
      try {
        await fs.access(filePath);
        await fs.copyFile(filePath, backupPath);
      } catch (error) {
        // File doesn't exist yet, no backup needed
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Write to temporary file first (atomic operation)
      const jsonData = JSON.stringify(data, null, 2);
      
      // Validate JSON can be parsed back
      try {
        JSON.parse(jsonData);
      } catch (parseError) {
        throw new Error(`Generated JSON for ${filename} is invalid: ${parseError.message}`);
      }
      
      await fs.writeFile(tempPath, jsonData, 'utf8');
      
      // Verify the temporary file was written correctly
      const verifyData = await fs.readFile(tempPath, 'utf8');
      const parsedVerify = JSON.parse(verifyData);
      
      if (!Array.isArray(parsedVerify)) {
        throw new Error(`Written data validation failed for ${filename}: not an array`);
      }
      
      // Atomic move from temp to final location
      await fs.rename(tempPath, filePath);
      
      // Remove backup after successful write
      try {
        await fs.unlink(backupPath);
      } catch (error) {
        // Backup removal failed, but write succeeded
        // This is not critical, log and continue
      }
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        // Temp file cleanup failed, not critical
      }
      
      // Restore backup if write failed
      try {
        await fs.access(backupPath);
        await fs.copyFile(backupPath, filePath);
        await fs.unlink(backupPath);
      } catch (restoreError) {
        // Backup restore failed, original error is more important
      }
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filename) {
    const filePath = this.getFilePath(filename);
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filename) {
    const filePath = this.getFilePath(filename);
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false; // File didn't exist
      }
      throw error;
    }
  }

  /**
   * Get file stats (size, modified date, etc.)
   */
  async getFileStats(filename) {
    const filePath = this.getFilePath(filename);
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        modified: new Date(stats.mtime),
        created: new Date(stats.birthtime),
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
}

module.exports = FileManager;