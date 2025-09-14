describe('Event Participant Count Update', () => {
    beforeEach(() => {
        // Clear test data
        cy.task('clearAllTestData');
        cy.visit('/');
        cy.wait(1000);
    });

    it('should update participant count when adding users to event from detail page', () => {
        // Step 1: Create 3 users first
        const users = [
            { name: 'Alice Johnson', email: 'alice@test.com' },
            { name: 'Bob Smith', email: 'bob@test.com' },
            { name: 'Charlie Brown', email: 'charlie@test.com' }
        ];

        users.forEach((user, index) => {
            cy.log(`Creating user ${index + 1}: ${user.name}`);
            
            // Navigate to users page and add user
            cy.get('[data-page="users"]').click();
            cy.get('#add-user-btn').click();
            cy.get('#user-name').type(user.name);
            cy.get('#user-email').type(user.email);
            cy.get('#add-user-save').click();
            
            // Wait for success modal and close it
            cy.get('#success-modal', { timeout: 10000 }).should('be.visible');
            cy.get('#success-ok').click();
            cy.wait(300);
        });

        // Step 2: Create event with first 2 users (Alice and Bob)
        cy.log('Creating event with 2 participants');
        cy.get('[data-page="events"]').click();
        cy.wait(500);
        cy.get('#add-event-btn').click();
        
        cy.get('#event-name').type('Test Participant Count Event');
        cy.get('#event-date').type('2025-09-20');
        cy.get('#event-location').type('Test Location');
        
        // Wait for participants to load and select first 2 users as participants
        cy.get('.participant-item', { timeout: 10000 }).should('have.length', 3);
        cy.get('.participant-item').eq(0).within(() => {
            cy.get('input[type="checkbox"]').check();
        });
        cy.get('.participant-item').eq(1).within(() => {
            cy.get('input[type="checkbox"]').check();
        });
        
        cy.get('#add-event-save').click();
        
        // Wait for success modal and close it
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Step 3: Verify initial participant count in events list (should be 2)
        cy.log('Verifying initial participant count is 2');
        cy.get('.event-card').should('have.length', 1);
        cy.get('.event-card').first().within(() => {
            cy.get('.stat-value').first().should('contain', '2');
        });

        // Step 4: Open event detail page
        cy.log('Opening event detail page');
        cy.get('.event-card').first().click();
        cy.wait(1000);
        
        // Verify we're on event detail page and participant count shows 2
        cy.get('#event-detail-participant-count').should('contain', '2');

        // Step 5: Edit event to add third user (Charlie)
        cy.log('Adding third participant via event detail edit');
        cy.get('#edit-event-btn').click();
        cy.wait(500);
        
        // Find and click Add button for Charlie (the third user)
        cy.get('#edit-available-participants').within(() => {
            cy.get('.participant-action-btn.btn-add').first().click();
        });
        
        // Wait for participant to be added to current participants
        cy.wait(500);
        
        // Verify Charlie appears in current participants
        cy.get('#edit-current-participants .participant-item').should('have.length', 3);
        
        // Save the event changes
        cy.get('#edit-event-save').click();
        
        // Wait for success modal and close it
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'updated successfully');
        cy.get('#success-ok').click();
        
        // Step 6: Verify participant count updated in event detail page (should be 3)
        cy.log('Verifying participant count is 3 in event detail');
        cy.get('#event-detail-participant-count').should('contain', '3');

        // Step 7: Go back to events list
        cy.log('Navigating back to events list');
        cy.get('#event-detail-back').click();
        cy.wait(1000);

        // Step 8: Verify participant count updated in events list (should be 3)
        cy.log('Verifying participant count is 3 in events list');
        cy.get('.event-card').should('have.length', 1);
        cy.get('.event-card').first().within(() => {
            cy.get('.stat-value').first().should('contain', '3');
        });
        
        // Additional verification: Click into event detail again to double-check
        cy.log('Double-checking by opening event detail again');
        cy.get('.event-card').first().click();
        cy.wait(1000);
        cy.get('#event-detail-participant-count').should('contain', '3');
        
        // Verify all 3 participants are actually shown in participants list
        cy.get('#event-participants-list .participant-card').should('have.length', 3);
    });

    it('should update participant count when removing users from event detail page', () => {
        // Step 1: Create 3 users
        const users = [
            { name: 'User One', email: 'user1@test.com' },
            { name: 'User Two', email: 'user2@test.com' },
            { name: 'User Three', email: 'user3@test.com' }
        ];

        users.forEach((user, index) => {
            cy.log(`Creating user ${index + 1}: ${user.name}`);
            cy.get('[data-page="users"]').click();
            cy.wait(500);
            cy.get('#add-user-btn').click();
            cy.get('#user-name').type(user.name);
            cy.get('#user-email').type(user.email);
            cy.get('#add-user-save').click();
            cy.get('#success-modal').should('be.visible');
            cy.get('#success-ok').click();
        });

        // Step 2: Create event with all 3 users
        cy.log('Creating event with 3 participants');
        cy.get('[data-page="events"]').click();
        cy.wait(500);
        cy.get('#add-event-btn').click();
        
        cy.get('#event-name').type('Test Remove Participant Event');
        cy.get('#event-date').type('2025-09-21');
        cy.get('#event-location').type('Test Location 2');
        
        // Wait for participants to load and select all 3 users
        cy.get('.participant-item', { timeout: 10000 }).should('have.length', 3);
        cy.get('.participant-item input[type="checkbox"]').check();
        
        cy.get('#add-event-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Step 3: Verify initial count is 3
        cy.get('.event-card').first().within(() => {
            cy.get('.stat-value').first().should('contain', '3');
        });

        // Step 4: Open event detail and remove one participant
        cy.log('Opening event detail to remove participant');
        cy.get('.event-card').first().click();
        cy.wait(1000);
        
        cy.get('#event-detail-participant-count').should('contain', '3');
        
        // Edit event to remove one user
        cy.get('#edit-event-btn').click();
        cy.wait(500);
        
        // Remove first participant
        cy.get('#edit-current-participants .participant-action-btn.btn-remove').first().click();
        
        // Confirm removal in modal
        cy.get('#confirm-remove-participant-modal').should('be.visible');
        cy.get('#confirm-remove-participant-ok').click();
        
        // Wait for participant to be removed
        cy.wait(500);
        cy.get('#edit-current-participants .participant-item').should('have.length', 2);
        
        // Save changes
        cy.get('#edit-event-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Step 5: Verify count is now 2 in event detail
        cy.get('#event-detail-participant-count').should('contain', '2');
        
        // Step 6: Go back to events list and verify count is 2
        cy.get('#event-detail-back').click();
        cy.wait(1000);
        
        cy.get('.event-card').first().within(() => {
            cy.get('.stat-value').first().should('contain', '2');
        });
    });
});