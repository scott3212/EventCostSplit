describe('Participant Count Update - Simple Test', () => {
    beforeEach(() => {
        cy.task('clearAllTestData');
        cy.visit('/');
        cy.wait(1000);
    });

    it('should update participant count when adding user to event from detail page', () => {
        // Step 1: Create 3 users quickly
        cy.log('Creating test users');
        
        // User 1
        cy.get('[data-page="users"]').click();
        cy.get('#add-user-btn').click();
        cy.get('#user-name').type('Test User 1');
        cy.get('#user-email').type('user1@test.com');
        cy.get('#add-user-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // User 2
        cy.get('#add-user-btn').click();
        cy.get('#user-name').type('Test User 2');
        cy.get('#user-email').type('user2@test.com');
        cy.get('#add-user-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // User 3
        cy.get('#add-user-btn').click();
        cy.get('#user-name').type('Test User 3');
        cy.get('#user-email').type('user3@test.com');
        cy.get('#add-user-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();

        // Step 2: Create event with 2 participants
        cy.log('Creating event with 2 participants');
        cy.get('[data-page="events"]').click();
        cy.get('#add-event-btn').click();
        
        cy.get('#event-name').type('Participant Count Test');
        cy.get('#event-date').type('2025-09-25');
        cy.get('#event-location').type('Test Venue');
        
        // Wait for participants to load and select first 2 users
        cy.get('.participant-checkbox').should('be.visible');
        cy.get('.participant-checkbox').should('have.length', 3);
        cy.get('.participant-checkbox').eq(0).check();
        cy.get('.participant-checkbox').eq(1).check();
        
        cy.get('#add-event-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Step 3: Verify initial participant count = 2
        cy.log('Verifying initial participant count is 2');
        cy.get('.event-card').should('exist');
        cy.get('.event-card .stat-value').first().should('contain', '2');

        // Step 4: Open event detail page
        cy.log('Opening event detail');
        cy.get('.event-card').click();
        cy.get('#event-detail-participant-count').should('contain', '2');

        // Step 5: Add third participant
        cy.log('Adding third participant');
        cy.get('#edit-event-btn').click();
        
        // Add the available user (should be User 3)
        cy.get('#edit-available-participants .btn-add').first().click();
        cy.wait(500);
        
        // Verify 3 participants now in current list
        cy.get('#edit-current-participants .participant-item').should('have.length', 3);
        
        // Save changes
        cy.get('#edit-event-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Step 6: Verify participant count = 3 in detail page
        cy.get('#event-detail-participant-count').should('contain', '3');

        // Step 7: Go back to events list
        cy.log('Going back to events list');
        cy.get('#event-detail-back').click();
        
        // Step 8: Verify participant count = 3 in events list
        cy.log('Verifying updated participant count is 3');
        cy.get('.event-card .stat-value').first().should('contain', '3');
        
        cy.log('✅ Test passed: Participant count updated correctly from 2 to 3');
    });
});