const FileManager = require('../utils/fileManager');
const { v4: uuidv4 } = require('uuid');

/**
 * Base repository providing common CRUD operations for JSON file storage
 * All specific repositories extend this class
 */
class BaseRepository {
  constructor(filename) {
    this.filename = filename;
    this.fileManager = new FileManager();
    this.cache = null;
    this.cacheExpiry = null;
    this.cacheDuration = 5000; // 5 seconds cache
  }

  /**
   * Load data from file with caching
   */
  async loadData() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache && this.cacheExpiry && now < this.cacheExpiry) {
      return this.cache;
    }

    // Load fresh data from file
    this.cache = await this.fileManager.readFile(this.filename);
    this.cacheExpiry = now + this.cacheDuration;
    
    return this.cache;
  }

  /**
   * Save data to file and update cache
   */
  async saveData(data) {
    await this.fileManager.writeFile(this.filename, data);
    this.cache = data;
    this.cacheExpiry = Date.now() + this.cacheDuration;
  }

  /**
   * Clear cache (force reload on next access)
   */
  clearCache() {
    this.cache = null;
    this.cacheExpiry = null;
  }

  /**
   * Find all records
   */
  async findAll() {
    return await this.loadData();
  }

  /**
   * Find record by ID
   */
  async findById(id) {
    const data = await this.loadData();
    return data.find(item => item.id === id) || null;
  }

  /**
   * Find records matching criteria
   */
  async findBy(criteria) {
    const data = await this.loadData();
    
    return data.filter(item => {
      return Object.keys(criteria).every(key => {
        const value = criteria[key];
        if (typeof value === 'function') {
          return value(item[key]);
        }
        return item[key] === value;
      });
    });
  }

  /**
   * Find single record matching criteria
   */
  async findOneBy(criteria) {
    const results = await this.findBy(criteria);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create new record with auto-generated ID
   */
  async create(data) {
    const newRecord = {
      ...data,
      id: uuidv4(), // ID is set after data spread to ensure it's not overridden
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allData = await this.loadData();
    allData.push(newRecord);
    await this.saveData(allData);

    return newRecord;
  }

  /**
   * Update existing record by ID
   */
  async update(id, updates) {
    const allData = await this.loadData();
    const index = allData.findIndex(item => item.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedRecord = {
      ...allData[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    allData[index] = updatedRecord;
    await this.saveData(allData);

    return updatedRecord;
  }

  /**
   * Delete record by ID
   */
  async delete(id) {
    const allData = await this.loadData();
    const index = allData.findIndex(item => item.id === id);
    
    if (index === -1) {
      return false;
    }

    const deletedRecord = allData[index];
    allData.splice(index, 1);
    await this.saveData(allData);

    return deletedRecord;
  }

  /**
   * Check if record exists by ID
   */
  async exists(id) {
    const record = await this.findById(id);
    return record !== null;
  }

  /**
   * Count total records
   */
  async count() {
    const data = await this.loadData();
    return data.length;
  }

  /**
   * Count records matching criteria
   */
  async countBy(criteria) {
    const results = await this.findBy(criteria);
    return results.length;
  }

  /**
   * Get records with pagination
   */
  async paginate(page = 1, limit = 10) {
    const data = await this.loadData();
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);
    
    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: data.length,
        totalPages: Math.ceil(data.length / limit),
        hasNext: offset + limit < data.length,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Bulk create multiple records
   */
  async bulkCreate(records) {
    const newRecords = records.map(record => ({
      id: uuidv4(),
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const allData = await this.loadData();
    allData.push(...newRecords);
    await this.saveData(allData);

    return newRecords;
  }

  /**
   * Transaction-like operation (all succeed or all fail)
   */
  async transaction(operations) {
    const originalData = await this.loadData();
    
    try {
      for (const operation of operations) {
        await operation();
      }
    } catch (error) {
      // Restore original data on failure
      await this.saveData(originalData);
      throw error;
    }
  }
}

module.exports = BaseRepository;