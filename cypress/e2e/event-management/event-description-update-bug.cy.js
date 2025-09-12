describe('Event Management - Description Update Bug Fix', () => {
    beforeEach(() => {
        // Clear all data and setup test environment
        cy.clearApplicationData();
        
        // Create test users first (needed for events)
        cy.createUser({ name: 'Alice Johnson', email: 'alice@example.com' });
        cy.createUser({ name: 'Bob Smith', email: 'bob@example.com' });
        cy.createUser({ name: 'Charlie Brown', email: 'charlie@example.com' });
        cy.createUser({ name: 'David Wilson', email: 'david@example.com' });
        cy.createUser({ name: 'Eve Davis', email: 'eve@example.com' });
        cy.createUser({ name: 'Frank Miller', email: 'frank@example.com' });
    });

    it('should handle event description updates from both list and detail pages without conflicts', () => {
        // Step 1: Create an event with all mandatory fields
        cy.visit('/events');
        cy.wait(500);
        
        cy.get('#add-event-btn').click();
        cy.get('#add-event-modal').should('be.visible');
        
        // Fill in all mandatory fields
        cy.get('#event-name').type('Sep 16 8-10 pm');
        cy.get('#event-date').type('2025-09-16');
        cy.get('#event-location').type('Badminton Court A');
        cy.get('#event-description').type('8-9点：18号场\n9-10点：11号场');
        
        // Wait for participants to load before selecting them
        cy.get('#participants-loading').should('not.be.visible');
        cy.get('.participant-checkbox').should('be.visible');
        
        // Select some participants (similar to the bug report with 6 users)
        cy.get('.participant-checkbox').first().check();
        cy.get('.participant-checkbox').eq(1).check();
        cy.get('.participant-checkbox').eq(2).check();
        cy.get('.participant-checkbox').eq(3).check();
        cy.get('.participant-checkbox').eq(4).check();
        cy.get('.participant-checkbox').eq(5).check();
        
        // Create the event
        cy.get('#add-event-save').click();
        
        // Wait for success message
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Step 2: Refresh the event list page (localhost:3000/events)
        cy.visit('/events');
        cy.wait(500); // Allow page to fully load after refresh
        
        // Verify event exists after refresh
        cy.get('.event-card').should('contain', 'Sep 16 8-10 pm');
        
        // Step 3: Click edit event pencil icon from event list page
        cy.get('.event-card').contains('Sep 16 8-10 pm').parent().within(() => {
            cy.get('.edit-event-btn').click();
        });
        
        // Verify edit modal opens with correct data
        cy.get('#edit-event-modal').should('be.visible');
        cy.get('#edit-event-name').should('have.value', 'Sep 16 8-10 pm');
        cy.get('#edit-event-description').should('have.value', '8-9点：18号场\n9-10点：11号场');
        
        // Step 4: Update description
        const updatedDescriptionFromList = '8-9点：18号场 (Updated from list)\n9-10点：11号场 (List edit)';
        cy.get('#edit-event-description').clear().type(updatedDescriptionFromList);
        
        // Step 5: Click Update Event Button
        cy.get('#edit-event-save').click();
        
        // Verify success without errors (this was failing in the bug report)
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Event "Sep 16 8-10 pm" updated successfully');
        cy.get('#success-ok').click();
        
        // Verify the description was updated in the events list
        cy.get('.event-card').contains('Sep 16 8-10 pm').should('be.visible');
        
        // Step 6: Then go into the event (open event details page)
        cy.get('.event-card').contains('Sep 16 8-10 pm').click();
        
        // Verify we're on the event detail page
        cy.get('#event-detail-page').should('be.visible');
        cy.get('#event-detail-name').should('contain', 'Sep 16 8-10 pm');
        cy.get('#event-detail-description').should('contain', 'Updated from list');
        
        // Step 7: Click edit event pencil icon from event details page
        cy.get('#event-detail-edit-btn').click();
        
        // Verify edit modal opens with the updated data
        cy.get('#edit-event-modal').should('be.visible');
        cy.get('#edit-event-name').should('have.value', 'Sep 16 8-10 pm');
        cy.get('#edit-event-description').should('have.value', updatedDescriptionFromList);
        
        // Step 8: Update description again
        const updatedDescriptionFromDetail = '8-9点：18号场 (Updated from detail)\n9-10点：11号场 (Detail edit)';
        cy.get('#edit-event-description').clear().type(updatedDescriptionFromDetail);
        
        // Step 9: Click Update Event Button
        cy.get('#edit-event-save').click();
        
        // Verify success without errors (this should work without duplicate handler conflicts)
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Event "Sep 16 8-10 pm" updated successfully');
        cy.get('#success-ok').click();
        
        // Verify the description was updated in the event detail view
        cy.get('#event-detail-description').should('contain', 'Updated from detail');
        
        // Step 10: Navigate back to events list and verify persistence
        cy.get('[data-page="events"]').click();
        cy.wait(500);
        
        // Verify the final description persists in the events list
        cy.get('.event-card').contains('Sep 16 8-10 pm').should('be.visible');
        
        // Final verification: Open event detail again to confirm final state
        cy.get('.event-card').contains('Sep 16 8-10 pm').click();
        cy.get('#event-detail-description').should('contain', 'Updated from detail');
        
        // Step 11: Tear down - Delete the test event
        cy.get('#event-detail-delete-btn').click();
        cy.get('#delete-confirmation-modal').should('be.visible');
        cy.get('#delete-confirm-btn').click();
        
        // Verify deletion success
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Verify we're back on events page and event is gone
        cy.url().should('include', '/events');
        cy.get('.event-card').should('not.contain', 'Sep 16 8-10 pm');
    });

    it('should handle rapid sequential edits without handler conflicts', () => {
        // Create a test event
        cy.visit('/events');
        cy.wait(500);
        
        cy.get('#add-event-btn').click();
        cy.get('#add-event-modal').should('be.visible');
        
        cy.get('#event-name').type('Rapid Edit Test Event');
        cy.get('#event-date').type('2025-09-17');
        cy.get('#event-location').type('Test Location');
        cy.get('#event-description').type('Initial description');
        
        // Wait for participants to load before selecting them
        cy.get('#participants-loading').should('not.be.visible');
        cy.get('.participant-checkbox').should('be.visible');
        
        // Select some participants
        cy.get('.participant-checkbox').first().check();
        cy.get('.participant-checkbox').eq(1).check();
        
        cy.get('#add-event-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Rapid sequence: Edit from list -> Edit from detail -> Edit from list again
        
        // Edit 1: From events list
        cy.get('.event-card').contains('Rapid Edit Test Event').parent().within(() => {
            cy.get('.edit-event-btn').click();
        });
        
        cy.get('#edit-event-modal').should('be.visible');
        cy.get('#edit-event-description').clear().type('Edit 1 from list');
        cy.get('#edit-event-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Edit 2: From event detail
        cy.get('.event-card').contains('Rapid Edit Test Event').click();
        cy.get('#event-detail-edit-btn').click();
        
        cy.get('#edit-event-modal').should('be.visible');
        cy.get('#edit-event-description').clear().type('Edit 2 from detail');
        cy.get('#edit-event-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Edit 3: Back to events list and edit again
        cy.get('[data-page="events"]').click();
        cy.wait(500);
        
        cy.get('.event-card').contains('Rapid Edit Test Event').parent().within(() => {
            cy.get('.edit-event-btn').click();
        });
        
        cy.get('#edit-event-modal').should('be.visible');
        cy.get('#edit-event-description').clear().type('Edit 3 from list again');
        cy.get('#edit-event-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Verify final state
        cy.get('.event-card').contains('Rapid Edit Test Event').click();
        cy.get('#event-detail-description').should('contain', 'Edit 3 from list again');
        
        // Cleanup
        cy.get('#event-detail-delete-btn').click();
        cy.get('#delete-confirmation-modal').should('be.visible');
        cy.get('#delete-confirm-btn').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
    });

    it('should not show duplicate event handler errors in console', () => {
        // This test specifically checks for the JavaScript errors mentioned in the bug report
        let consoleErrors = [];
        
        // Capture console errors
        cy.window().then((win) => {
            cy.stub(win.console, 'error').callsFake((message) => {
                consoleErrors.push(message);
            });
        });
        
        // Create and test event editing workflow
        cy.visit('/events');
        cy.wait(500);
        
        // Create event
        cy.get('#add-event-btn').click();
        cy.get('#event-name').type('Console Error Test');
        cy.get('#event-date').type('2025-09-18');
        cy.get('#event-location').type('Test Location');
        cy.get('#event-description').type('Test description');
        
        // Wait for participants to load before selecting them
        cy.get('#participants-loading').should('not.be.visible');
        cy.get('.participant-checkbox').should('be.visible');
        
        cy.get('.participant-checkbox').first().check();
        cy.get('#add-event-save').click();
        cy.get('#success-ok').click();
        
        // Edit from events list
        cy.get('.event-card').contains('Console Error Test').parent().within(() => {
            cy.get('.edit-event-btn').click();
        });
        cy.get('#edit-event-description').clear().type('Updated description');
        cy.get('#edit-event-save').click();
        cy.get('#success-ok').click();
        
        // Edit from event detail  
        cy.get('.event-card').contains('Console Error Test').click();
        cy.get('#event-detail-edit-btn').click();
        cy.get('#edit-event-description').clear().type('Final description');
        cy.get('#edit-event-save').click();
        cy.get('#success-ok').click();
        
        // Check that no handler conflict errors occurred
        cy.then(() => {
            const handlerErrors = consoleErrors.filter(error => 
                typeof error === 'string' && 
                (error.includes('handleEditEvent') || 
                 error.includes('Failed to update event') ||
                 error.includes('handleEditEvent called but no event is currently being edited'))
            );
            
            expect(handlerErrors).to.have.length(0, 
                `Expected no event handler errors, but found: ${handlerErrors.join(', ')}`);
        });
        
        // Cleanup
        cy.get('#event-detail-delete-btn').click();
        cy.get('#delete-confirm-btn').click();
        cy.get('#success-ok').click();
    });
});