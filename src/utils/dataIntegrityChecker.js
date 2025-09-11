const fs = require('fs').promises;
const path = require('path');

/**
 * Data Integrity Checker - Utility for validating and fixing JSON data files
 * Ensures all data files are in proper format for stable testing
 */
class DataIntegrityChecker {
    constructor(dataDir = './data') {
        this.dataDir = path.resolve(dataDir);
        this.requiredFiles = [
            'users.json',
            'events.json', 
            'cost_items.json',
            'payments.json'
        ];
    }

    /**
     * Check and fix all data files
     */
    async validateAndFix() {
        const results = {
            checked: 0,
            fixed: 0,
            errors: [],
            status: 'success'
        };

        try {
            // Ensure data directory exists
            await this.ensureDataDir();

            // Check each required file
            for (const filename of this.requiredFiles) {
                results.checked++;
                
                try {
                    const fixed = await this.validateAndFixFile(filename);
                    if (fixed) {
                        results.fixed++;
                        console.log(`Fixed data integrity issue in ${filename}`);
                    }
                } catch (error) {
                    results.errors.push(`${filename}: ${error.message}`);
                    console.error(`Failed to fix ${filename}:`, error.message);
                }
            }

            if (results.errors.length > 0) {
                results.status = 'partial_success';
            }

        } catch (error) {
            results.status = 'failed';
            results.errors.push(`Directory check failed: ${error.message}`);
        }

        return results;
    }

    /**
     * Validate and fix a single JSON file
     */
    async validateAndFixFile(filename) {
        const filePath = path.join(this.dataDir, filename);
        let fixed = false;

        try {
            // Check if file exists
            await fs.access(filePath);
            
            // Read and validate content
            const content = await fs.readFile(filePath, 'utf8');
            
            // Check for common issues
            if (content.trim() === '') {
                // Empty file - write empty array
                await this.writeValidJson(filePath, []);
                fixed = true;
            } else if (content.trim() === '[]') {
                // Already valid empty array - no fix needed
                return false;
            } else {
                // Try to parse JSON
                try {
                    const data = JSON.parse(content);
                    
                    // Ensure it's an array
                    if (!Array.isArray(data)) {
                        await this.writeValidJson(filePath, []);
                        fixed = true;
                    } else {
                        // Validate and reformat if needed
                        const formatted = JSON.stringify(data, null, 2);
                        if (formatted !== content.trim()) {
                            await this.writeValidJson(filePath, data);
                            fixed = true;
                        }
                    }
                } catch (parseError) {
                    // Invalid JSON - reset to empty array
                    console.log(`JSON parse error in ${filename}, resetting to empty array`);
                    await this.writeValidJson(filePath, []);
                    fixed = true;
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist - create empty array
                await this.writeValidJson(filePath, []);
                fixed = true;
            } else {
                throw error;
            }
        }

        return fixed;
    }

    /**
     * Write valid JSON to file with proper formatting
     */
    async writeValidJson(filePath, data) {
        const validJson = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, validJson, 'utf8');
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
     * Get current status of all data files
     */
    async getStatus() {
        const status = {
            directory: this.dataDir,
            files: {},
            overallHealth: 'unknown'
        };

        let healthyFiles = 0;

        for (const filename of this.requiredFiles) {
            const filePath = path.join(this.dataDir, filename);
            
            try {
                await fs.access(filePath);
                const content = await fs.readFile(filePath, 'utf8');
                
                try {
                    const data = JSON.parse(content);
                    status.files[filename] = {
                        exists: true,
                        valid: true,
                        isArray: Array.isArray(data),
                        recordCount: Array.isArray(data) ? data.length : 'N/A',
                        size: content.length
                    };
                    
                    if (Array.isArray(data)) {
                        healthyFiles++;
                    }
                } catch (parseError) {
                    status.files[filename] = {
                        exists: true,
                        valid: false,
                        error: parseError.message,
                        size: content.length
                    };
                }
            } catch (error) {
                status.files[filename] = {
                    exists: false,
                    error: error.message
                };
            }
        }

        // Determine overall health
        if (healthyFiles === this.requiredFiles.length) {
            status.overallHealth = 'healthy';
        } else if (healthyFiles > 0) {
            status.overallHealth = 'partial';
        } else {
            status.overallHealth = 'unhealthy';
        }

        return status;
    }

    /**
     * Force reset all files to empty arrays
     */
    async resetAllFiles() {
        await this.ensureDataDir();
        
        const results = {
            reset: [],
            errors: []
        };

        for (const filename of this.requiredFiles) {
            try {
                const filePath = path.join(this.dataDir, filename);
                await this.writeValidJson(filePath, []);
                results.reset.push(filename);
            } catch (error) {
                results.errors.push(`${filename}: ${error.message}`);
            }
        }

        return results;
    }
}

module.exports = DataIntegrityChecker;