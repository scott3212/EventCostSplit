describe('Event Management - Edit Handler Bug Fix', () => {
    beforeEach(() => {
        // Clear all data and setup test environment
        cy.clearApplicationData();
        
        // Create test users first (needed for events)
        cy.createUser({ name: 'Alice Johnson', email: 'alice@example.com' });
        cy.createUser({ name: 'Bob Smith', email: 'bob@example.com' });
        cy.createUser({ name: 'Charlie Brown', email: 'charlie@example.com' });
        
        // Create a test event for editing
        cy.createEvent({
            name: 'Test Event for Edit Bug',
            date: '2025-09-16',
            location: 'Test Location',
            description: 'Original description for testing handler bug',
            participants: []
        });
        
        // Navigate to events page
        cy.visit('/events');
        cy.wait(1000);
    });

    it('should successfully update event description from events list without handler conflicts', () => {
        // Step 1: Edit event from events list page
        cy.get('.event-card').first().within(() => {
            cy.get('.edit-event-btn').click();
        });
        
        // Verify edit modal opens
        cy.get('#edit-event-modal').should('be.visible');
        cy.get('#edit-event-description').should('have.value', 'Original description for testing handler bug');
        
        // Step 2: Update description
        const updatedDescription = 'Updated from events list - handler bug test';
        cy.get('#edit-event-description').clear().type(updatedDescription);
        
        // Step 3: Save changes (this was failing due to duplicate handlers)
        cy.get('#edit-event-save').click();
        
        // Step 4: Verify success without JavaScript errors
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'updated successfully');
        cy.get('#success-ok').click();
        
        // Step 5: Verify changes persisted
        cy.get('.event-card').first().should('contain', 'Test Event for Edit Bug');
        
        // Step 6: Navigate to event detail page
        cy.get('.event-card').first().click();
        cy.get('#event-detail-description').should('contain', 'Updated from events list');
        
        // Step 7: Edit from event detail page
        cy.get('#event-detail-edit-btn').click();
        
        // Verify modal opens with updated data
        cy.get('#edit-event-modal').should('be.visible');
        cy.get('#edit-event-description').should('have.value', updatedDescription);
        
        // Step 8: Make another update
        const finalDescription = 'Final update from event detail page';
        cy.get('#edit-event-description').clear().type(finalDescription);
        
        // Step 9: Save changes (should work without duplicate handler errors)
        cy.get('#edit-event-save').click();
        
        // Step 10: Verify final success
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'updated successfully');
        cy.get('#success-ok').click();
        
        // Step 11: Verify final state
        cy.get('#event-detail-description').should('contain', 'Final update from event detail page');
    });
    
    it('should handle page refresh and maintain edit functionality', () => {
        // Step 1: Refresh the events page
        cy.visit('/events');
        cy.wait(1000);
        
        // Step 2: Edit event after page refresh
        cy.get('.event-card').first().within(() => {
            cy.get('.edit-event-btn').click();
        });
        
        // Step 3: Update and save
        cy.get('#edit-event-modal').should('be.visible');
        cy.get('#edit-event-description').clear().type('Post-refresh update test');
        cy.get('#edit-event-save').click();
        
        // Step 4: Verify success
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Step 5: Verify update persisted
        cy.get('.event-card').first().click();
        cy.get('#event-detail-description').should('contain', 'Post-refresh update test');
    });
});