class TestController {
    constructor(services) {
        this.userService = services.userService;
        this.eventService = services.eventService;
        this.costItemService = services.costItemService;
        this.paymentService = services.paymentService;
    }

    /**
     * Clear all application data for testing
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

            // Clear all data in reverse dependency order
            // 1. Clear cost items first (depend on events and users)
            const costItems = await this.costItemService.getAllCostItems();
            for (const costItem of costItems) {
                await this.costItemService.deleteCostItem(costItem.id);
            }

            // 2. Clear payments (depend on users and may reference events)
            const payments = await this.paymentService.getAllPayments();
            for (const payment of payments) {
                await this.paymentService.deletePayment(payment.id);
            }

            // 3. Clear events (depend on users)
            const events = await this.eventService.getAllEvents();
            for (const event of events) {
                await this.eventService.deleteEvent(event.id);
            }

            // 4. Clear users last (force delete for testing - bypass balance validation)
            const users = await this.userService.getAllUsers();
            console.log(`Starting user deletion: Found ${users.length} users to delete`);
            
            for (const user of users) {
                console.log(`Attempting to delete user: ${user.id} (${user.name})`);
                try {
                    await this.userService.deleteUser(user.id);
                    console.log(`Successfully deleted user via service: ${user.id}`);
                } catch (error) {
                    console.log(`Service deletion failed for user ${user.id}: ${error.message}`);
                    
                    // For test environment, force delete even with balance issues
                    // Use repository directly to bypass service validation
                    try {
                        const deleteResult = await this.userService.userRepo.delete(user.id);
                        console.log(`Force delete result for user ${user.id}:`, deleteResult ? 'SUCCESS' : 'FAILED');
                        
                        // Double check - verify the user is actually gone
                        const checkUser = await this.userService.userRepo.findById(user.id);
                        if (checkUser) {
                            console.error(`WARNING: User ${user.id} still exists after force delete attempt`);
                        } else {
                            console.log(`Confirmed: User ${user.id} successfully force deleted`);
                        }
                    } catch (repoError) {
                        console.error(`Force delete FAILED for user ${user.id}:`, repoError.message);
                    }
                }
            }
            
            console.log(`User deletion complete`);
            
            // Final fallback - if users still exist, directly manipulate the data file
            const remainingUsersCheck = await this.userService.getAllUsers();
            if (remainingUsersCheck.length > 0) {
                console.log(`WARNING: ${remainingUsersCheck.length} users still remain after deletion attempts`);
                console.log('Attempting nuclear option - direct file manipulation...');
                
                try {
                    // Clear the user repository cache and force a fresh load
                    this.userService.userRepo.clearCache();
                    
                    // Write empty array directly to file  
                    await this.userService.userRepo.saveData([]);
                    console.log('Direct file write successful - users.json cleared');
                    
                    // Verify it worked
                    const finalCheck = await this.userService.getAllUsers();
                    console.log(`Final verification: ${finalCheck.length} users remain`);
                } catch (fileError) {
                    console.error('Direct file manipulation failed:', fileError.message);
                }
            }

            // Verify all data was actually cleared
            const remainingUsers = await this.userService.getAllUsers();
            const remainingEvents = await this.eventService.getAllEvents();
            const remainingCostItems = await this.costItemService.getAllCostItems();
            const remainingPayments = await this.paymentService.getAllPayments();

            res.json({
                success: true,
                message: 'All application data cleared successfully',
                cleared: {
                    users: users.length,
                    events: events.length,
                    costItems: costItems.length,
                    payments: payments.length
                },
                remaining: {
                    users: remainingUsers.length,
                    events: remainingEvents.length,
                    costItems: remainingCostItems.length,
                    payments: remainingPayments.length
                },
                fullyCleared: remainingUsers.length === 0 && remainingEvents.length === 0 && 
                             remainingCostItems.length === 0 && remainingPayments.length === 0
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to clear application data',
                error: error.message
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
}

module.exports = TestController;
// Force restart 2