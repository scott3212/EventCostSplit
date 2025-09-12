describe('Event Edit Handler Bug Fix - Minimal Test', () => {
    beforeEach(() => {
        cy.clearApplicationData();
        cy.createUser({ name: 'Test User', email: 'test@example.com' });
        cy.createEvent({
            name: 'Test Event',
            date: '2025-09-20',
            location: 'Test Location',
            description: 'Original description',
            participants: []
        });
        cy.visit('/events');
        cy.wait(1000);
    });

    it('should update event description from events list without JavaScript errors', () => {
        // Step 1: Click edit from events list
        cy.get('.event-card').first().within(() => {
            cy.get('.edit-event-btn').click();
        });
        
        // Step 2: Verify modal opens and update description
        cy.get('#edit-event-modal').should('be.visible');
        cy.get('#edit-event-description').clear().type('Updated description');
        
        // Step 3: Save (this was failing due to duplicate handlers in the bug report)
        cy.get('#edit-event-save').click();
        
        // Step 4: Verify success without errors
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
    });
});