describe('Event Management - Edit from Events List', () => {
    beforeEach(() => {
        // Clear all data and visit the events page
        cy.clearApplicationData();
        cy.visit('/events');
        
        // Create some test users first (needed for events)
        cy.createUser({ name: 'Alice Johnson', email: 'alice@example.com' });
        cy.createUser({ name: 'Bob Smith', email: 'bob@example.com' });
        cy.createUser({ name: 'Charlie Brown', email: 'charlie@example.com' });
        
        // Create a test event with participants for editing tests
        cy.createEvent({
            name: 'Original Event',
            date: '2025-12-25',
            location: 'Original Location',
            description: 'Original description',
            participants: [] // Will be populated with actual user IDs in the test
        });
        
        // Navigate back to events page
        cy.visit('/events');
        cy.wait(1000); // Allow page to fully load
    });

    it('should edit event directly from events list page', () => {
        // Navigate to events list and edit from there (not from event detail page)
        cy.visit('/events');
        cy.wait(1000);
        
        // Click edit button directly from events list (not the event card itself)
        cy.get('.event-card').first().within(() => {
            cy.get('.edit-event-btn').click();
        });
        
        // Verify edit modal opens with pre-populated data
        cy.get('#edit-event-modal').should('be.visible');
        cy.get('#edit-event-name').should('have.value', 'Original Event');
        cy.get('#edit-event-date').should('have.value', '2025-12-25');
        cy.get('#edit-event-location').should('have.value', 'Original Location');
        cy.get('#edit-event-description').should('have.value', 'Original description');
        
        // Modify the event details
        cy.get('#edit-event-name').clear().type('Updated from Events List');
        cy.get('#edit-event-location').clear().type('New Location via List');
        cy.get('#edit-event-description').clear().type('Edited directly from events list page');
        
        // Save changes
        cy.get('#edit-event-save').click();
        
        // Verify success message appears
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Event "Updated from Events List" updated successfully');
        
        // Close success modal
        cy.get('#success-ok').click();
        
        // Verify changes are reflected in the events list
        cy.get('.event-card').first().should('contain', 'Updated from Events List');
        cy.get('.event-card').first().should('contain', 'New Location via List');
        
        // Verify the changes persist by navigating to event detail
        cy.get('.event-card').first().click();
        cy.get('#event-detail-name').should('contain', 'Updated from Events List');
        cy.get('#event-detail-location').should('contain', 'New Location via List');
        cy.get('#event-detail-description').should('contain', 'Edited directly from events list page');
    });

    it('should validate form when editing from events list', () => {
        cy.visit('/events');
        cy.wait(1000);
        
        // Open edit modal from events list
        cy.get('.event-card').first().within(() => {
            cy.get('.edit-event-btn').click();
        });
        
        // Clear required fields to test validation
        cy.get('#edit-event-name').clear();
        cy.get('#edit-event-location').clear();
        
        // Try to save
        cy.get('#edit-event-save').click();
        
        // Check validation errors appear
        cy.get('#edit-event-name-error').should('be.visible');
        cy.get('#edit-event-name-error').should('contain', 'Event name is required');
        cy.get('#edit-event-location-error').should('be.visible');
        cy.get('#edit-event-location-error').should('contain', 'Location is required');
        
        // Modal should still be open
        cy.get('#edit-event-modal').should('be.visible');
    });

    it('should cancel edit from events list', () => {
        cy.visit('/events');
        cy.wait(1000);
        
        // Open edit modal and make changes
        cy.get('.event-card').first().within(() => {
            cy.get('.edit-event-btn').click();
        });
        
        cy.get('#edit-event-name').clear().type('Should Not Save');
        
        // Cancel the edit
        cy.get('#edit-event-cancel').click();
        
        // Modal should close
        cy.get('#edit-event-modal').should('not.be.visible');
        
        // Changes should not be saved
        cy.get('.event-card').first().should('contain', 'Original Event');
        cy.get('.event-card').first().should('not.contain', 'Should Not Save');
    });
});