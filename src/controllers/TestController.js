class TestController {
    constructor(services) {
        this.userService = services.userService;
        this.eventService = services.eventService;
        this.costItemService = services.costItemService;
        this.paymentService = services.paymentService;
    }

    /**
     * Clear all application data for testing with robust file handling
     * WARNING: This endpoint should only be available in test/development environments
     */
    async clearAllData(req, res) {
        try {
            // Only allow in non-production environments
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({
                    success: false,
                    message: 'Data clearing is not allowed in production'
                });
            }

            console.log('Starting robust data clearing process...');

            // Step 0: Check and fix data integrity before clearing
            const DataIntegrityChecker = require('../utils/dataIntegrityChecker');
            const integrityChecker = new DataIntegrityChecker();
            
            console.log('Checking data integrity before clearing...');
            const integrityStatus = await integrityChecker.getStatus();
            console.log('Data integrity status:', integrityStatus.overallHealth);
            
            if (integrityStatus.overallHealth !== 'healthy') {
                console.log('Data integrity issues found, fixing...');
                const fixResult = await integrityChecker.validateAndFix();
                console.log(`Data integrity fix result: ${fixResult.status}, fixed ${fixResult.fixed} files`);
            }

            // Step 1: Clear all repository caches first to prevent stale data
            console.log('Clearing all repository caches...');
            this.userService.userRepo.clearCache();
            this.eventService.eventRepo.clearCache();
            this.costItemService.costItemRepo.clearCache();
            this.paymentService.paymentRepo.clearCache();

            // Step 2: Get current counts for reporting
            const initialUsers = await this.userService.getAllUsers();
            const initialEvents = await this.eventService.getAllEvents();
            const initialCostItems = await this.costItemService.getAllCostItems();
            const initialPayments = await this.paymentService.getAllPayments();

            console.log(`Initial counts - Users: ${initialUsers.length}, Events: ${initialEvents.length}, CostItems: ${initialCostItems.length}, Payments: ${initialPayments.length}`);

            // Step 3: Use atomic file operations to directly clear all data files
            // This bypasses any business logic that might prevent deletion and ensures immediate effect
            console.log('Performing atomic file clearing...');
            
            try {
                // Clear all files atomically with proper JSON formatting
                await Promise.all([
                    this.costItemService.costItemRepo.saveData([]),
                    this.paymentService.paymentRepo.saveData([]),
                    this.eventService.eventRepo.saveData([]),
                    this.userService.userRepo.saveData([])
                ]);
                console.log('Atomic file clearing completed successfully');
            } catch (atomicError) {
                console.error('Atomic file clearing failed:', atomicError.message);
                throw new Error(`Atomic file clearing failed: ${atomicError.message}`);
            }

            // Step 4: Clear caches again after file operations
            console.log('Clearing caches after file operations...');
            this.userService.userRepo.clearCache();
            this.eventService.eventRepo.clearCache();
            this.costItemService.costItemRepo.clearCache();
            this.paymentService.paymentRepo.clearCache();

            // Step 5: Add small delay to ensure file system consistency
            await new Promise(resolve => setTimeout(resolve, 100));

            // Step 6: Verify complete clearing with fresh data load
            console.log('Verifying data clearing...');
            const finalUsers = await this.userService.getAllUsers();
            const finalEvents = await this.eventService.getAllEvents();
            const finalCostItems = await this.costItemService.getAllCostItems();
            const finalPayments = await this.paymentService.getAllPayments();

            const totalRemaining = finalUsers.length + finalEvents.length + finalCostItems.length + finalPayments.length;
            const fullyCleared = totalRemaining === 0;

            console.log(`Final verification - Users: ${finalUsers.length}, Events: ${finalEvents.length}, CostItems: ${finalCostItems.length}, Payments: ${finalPayments.length}`);
            console.log(`Data clearing ${fullyCleared ? 'SUCCESSFUL' : 'INCOMPLETE'}`);

            // Step 7: If clearing incomplete, attempt emergency file system reset
            if (!fullyCleared) {
                console.log('Data clearing incomplete, attempting emergency reset...');
                
                try {
                    // Force write empty arrays with explicit file paths
                    const FileManager = require('../utils/fileManager');
                    const fileManager = new FileManager();
                    
                    await Promise.all([
                        fileManager.writeFile('users.json', []),
                        fileManager.writeFile('events.json', []),
                        fileManager.writeFile('cost_items.json', []),
                        fileManager.writeFile('payments.json', [])
                    ]);
                    
                    // Clear all caches one final time
                    this.userService.userRepo.clearCache();
                    this.eventService.eventRepo.clearCache();
                    this.costItemService.costItemRepo.clearCache();
                    this.paymentService.paymentRepo.clearCache();
                    
                    console.log('Emergency reset completed');
                } catch (emergencyError) {
                    console.error('Emergency reset failed:', emergencyError.message);
                }
            }

            res.json({
                success: true,
                message: fullyCleared ? 'All application data cleared successfully' : 'Data clearing completed with some remaining items',
                method: 'atomic_file_operations',
                cleared: {
                    users: initialUsers.length,
                    events: initialEvents.length,
                    costItems: initialCostItems.length,
                    payments: initialPayments.length
                },
                remaining: {
                    users: finalUsers.length,
                    events: finalEvents.length,
                    costItems: finalCostItems.length,
                    payments: finalPayments.length
                },
                fullyCleared: fullyCleared,
                processingTimeMs: Date.now() - (req.startTime || Date.now())
            });

        } catch (error) {
            console.error('Data clearing failed with error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to clear application data',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Get application statistics for testing
     */
    async getTestStats(req, res) {
        try {
            const users = await this.userService.getAllUsers();
            const events = await this.eventService.getAllEvents();
            const costItems = await this.costItemService.getAllCostItems();
            const payments = await this.paymentService.getAllPayments();

            res.json({
                success: true,
                data: {
                    users: users.length,
                    events: events.length,
                    costItems: costItems.length,
                    payments: payments.length,
                    totalData: users.length + events.length + costItems.length + payments.length
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get test statistics',
                error: error.message
            });
        }
    }

    /**
     * Health check for test environment
     */
    async healthCheck(req, res) {
        res.json({
            success: true,
            message: 'Test endpoints are available',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Check and fix data integrity issues
     */
    async checkDataIntegrity(req, res) {
        try {
            const DataIntegrityChecker = require('../utils/dataIntegrityChecker');
            const integrityChecker = new DataIntegrityChecker();

            const status = await integrityChecker.getStatus();
            const autoFix = req.query.fix === 'true';

            let fixResult = null;
            if (autoFix && status.overallHealth !== 'healthy') {
                fixResult = await integrityChecker.validateAndFix();
            }

            res.json({
                success: true,
                message: 'Data integrity check completed',
                status: status,
                autoFix: autoFix,
                fixResult: fixResult,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Data integrity check failed',
                error: error.message
            });
        }
    }

    /**
     * Force update expense data bypassing validation (for testing only)
     * WARNING: This endpoint should only be available in test/development environments
     */
    async forceUpdateExpense(req, res) {
        try {
            // Only allow in non-production environments
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({
                    success: false,
                    message: 'Force update is not allowed in production'
                });
            }

            const { expenseId, expenseData } = req.body;

            if (!expenseId || !expenseData) {
                return res.status(400).json({
                    success: false,
                    message: 'expenseId and expenseData are required'
                });
            }

            // Directly update the expense data in the repository bypassing all validation
            const costItems = await this.costItemService.getAllCostItems();
            const expenseIndex = costItems.findIndex(item => item.id === expenseId);

            if (expenseIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Expense not found'
                });
            }

            // Force update the expense with provided data
            costItems[expenseIndex] = {
                ...costItems[expenseIndex],
                ...expenseData,
                id: expenseId, // Ensure ID is preserved
                updatedAt: new Date().toISOString()
            };

            // Save directly to repository bypassing validation
            await this.costItemService.costItemRepo.saveData(costItems);

            res.json({
                success: true,
                message: 'Expense force-updated successfully (test mode)',
                data: costItems[expenseIndex]
            });

        } catch (error) {
            console.error('Force update expense failed:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to force update expense',
                error: error.message
            });
        }
    }
}

module.exports = TestController;