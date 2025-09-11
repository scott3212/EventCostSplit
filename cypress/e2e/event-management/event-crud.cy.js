describe('Event Management - CRUD Operations', () => {
    beforeEach(() => {
        // Clear all data and visit the events page
        cy.clearApplicationData();
        cy.visit('/events');
        
        // Create some test users first (needed for events)
        cy.createUser({ name: 'Alice Johnson', email: 'alice@example.com' });
        cy.createUser({ name: 'Bob Smith', email: 'bob@example.com' });
        cy.createUser({ name: 'Charlie Brown', email: 'charlie@example.com' });
        
        // Navigate back to events page
        cy.visit('/events');
        cy.wait(1000); // Allow page to fully load
    });

    describe('Event List Display', () => {
        it('should display empty state when no events exist', () => {
            cy.get('#events-empty').should('be.visible');
            cy.get('#events-empty').should('contain', 'No events found');
            cy.get('#empty-state-add-event-btn').should('be.visible');
        });

        it('should display events list when events exist', () => {
            // Create a test event through API first
            cy.createEvent({
                name: 'Test Event',
                date: '2025-12-25',
                location: 'Test Location',
                participants: []
            }).then(() => {
                cy.visit('/events');
                cy.wait(1000);
                
                cy.get('#events-list').should('be.visible');
                cy.get('.event-card').should('have.length', 1);
                cy.get('.event-card').should('contain', 'Test Event');
                cy.get('.event-card').should('contain', 'Test Location');
            });
        });

        it('should show correct event count in summary', () => {
            // Create multiple test events
            cy.createEvent({
                name: 'Event 1',
                date: '2025-12-25',
                location: 'Location 1',
                participants: []
            });
            cy.createEvent({
                name: 'Event 2', 
                date: '2025-12-26',
                location: 'Location 2',
                participants: []
            }).then(() => {
                cy.visit('/events');
                cy.wait(1000);
                
                cy.get('#total-events-count').should('contain', '2');
                cy.get('.event-card').should('have.length', 2);
            });
        });
    });

    describe('Create Event', () => {
        it('should open create event modal when Add Event button is clicked', () => {
            cy.get('#add-event-btn').click();
            cy.get('#add-event-modal').should('be.visible');
            cy.get('#add-event-modal h3').should('contain', 'Create New Event');
        });

        it('should create event with valid data and participants', () => {
            cy.get('#add-event-btn').click();
            
            // Fill out the form
            cy.get('#event-name').type('Friday Badminton Session');
            cy.get('#event-date').type('2025-12-25');
            cy.get('#event-location').type('Sports Center Court 1');
            cy.get('#event-description').type('Weekly badminton session');
            
            // Wait for participants to load and select some
            cy.get('#participants-loading').should('not.be.visible');
            cy.get('.participant-checkbox').should('be.visible');
            cy.get('.participant-checkbox').first().check();
            cy.get('.participant-checkbox').eq(1).check();
            
            // Submit the form
            cy.get('#add-event-save').click();
            
            // Verify success
            cy.get('#success-modal').should('be.visible');
            cy.get('#success-message').should('contain', 'Event created successfully');
            
            // Close success modal and verify event appears in list
            cy.get('#success-ok').click();
            cy.get('.event-card').should('contain', 'Friday Badminton Session');
            cy.get('.event-card').should('contain', 'Sports Center Court 1');
            cy.get('.event-card').should('contain', '2 participants');
        });

        it('should validate required fields', () => {
            cy.get('#add-event-btn').click();
            
            // Try to submit without required fields
            cy.get('#add-event-save').click();
            
            // Check validation errors appear
            cy.get('#event-name-error').should('be.visible');
            cy.get('#event-date-error').should('be.visible'); 
            cy.get('#event-location-error').should('be.visible');
            cy.get('#participants-error').should('be.visible');
            
            // Modal should still be open
            cy.get('#add-event-modal').should('be.visible');
        });

        it('should validate participant selection requirement', () => {
            cy.get('#add-event-btn').click();
            
            // Fill required fields but don't select participants
            cy.get('#event-name').type('Test Event');
            cy.get('#event-date').type('2025-12-25');
            cy.get('#event-location').type('Test Location');
            
            // Wait for participants to load
            cy.get('#participants-loading').should('not.be.visible');
            cy.get('.participant-checkbox').should('be.visible');
            
            // Try to submit without selecting participants
            cy.get('#add-event-save').click();
            
            cy.get('#participants-error').should('be.visible');
            cy.get('#participants-error').should('contain', 'least one participant');
        });

        it('should cancel event creation', () => {
            cy.get('#add-event-btn').click();
            cy.get('#event-name').type('Test Event');
            
            cy.get('#add-event-cancel').click();
            cy.get('#add-event-modal').should('not.be.visible');
            
            // Form should be reset when reopened
            cy.get('#add-event-btn').click();
            cy.get('#event-name').should('have.value', '');
        });
    });

    describe('Edit Event', () => {
        beforeEach(() => {
            // Create a test event with participants for editing tests
            cy.createEvent({
                name: 'Original Event',
                date: '2025-12-25',
                location: 'Original Location',
                description: 'Original description',
                participants: [] // Will be populated with actual user IDs in the test
            });
        });

        it('should open edit modal with pre-populated data', () => {
            // Navigate to event detail first
            cy.get('.event-card').first().click();
            cy.get('#edit-event-btn').click();
            
            cy.get('#edit-event-modal').should('be.visible');
            cy.get('#edit-event-name').should('have.value', 'Original Event');
            cy.get('#edit-event-date').should('have.value', '2025-12-25');
            cy.get('#edit-event-location').should('have.value', 'Original Location');
            cy.get('#edit-event-description').should('have.value', 'Original description');
        });

        it('should successfully edit event details', () => {
            cy.get('.event-card').first().click();
            cy.get('#edit-event-btn').click();
            
            // Modify the form data
            cy.get('#edit-event-name').clear().type('Updated Event Name');
            cy.get('#edit-event-location').clear().type('Updated Location');
            cy.get('#edit-event-description').clear().type('Updated description');
            
            cy.get('#edit-event-save').click();
            
            // Verify success
            cy.get('#success-modal').should('be.visible');
            cy.get('#success-message').should('contain', 'Event updated successfully');
            
            // Verify changes are reflected
            cy.get('#success-ok').click();
            cy.get('#event-detail-name').should('contain', 'Updated Event Name');
            cy.get('#event-detail-location').should('contain', 'Updated Location');
        });

        it('should allow adding and removing participants', () => {
            cy.get('.event-card').first().click();
            cy.get('#edit-event-btn').click();
            
            // Wait for participants to load
            cy.wait(1000);
            
            // Add a participant
            cy.get('.available-participant').first().within(() => {
                cy.get('.add-participant-btn').click();
            });
            
            // Verify participant moved to current participants
            cy.get('#edit-current-participants').should('contain', 'Alice Johnson');
            
            // Remove the participant
            cy.get('.current-participant').first().within(() => {
                cy.get('.remove-participant-btn').click();
            });
            
            // Handle removal confirmation if it appears
            cy.get('body').then($body => {
                if ($body.find('#confirm-remove-participant-modal').is(':visible')) {
                    cy.get('#confirm-remove-participant-ok').click();
                }
            });
            
            cy.get('#edit-event-save').click();
            cy.get('#success-modal').should('be.visible');
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

    describe('Delete Event', () => {
        beforeEach(() => {
            cy.createEvent({
                name: 'Event To Delete',
                date: '2025-12-25',
                location: 'Delete Location',
                participants: []
            });
        });

        it('should show delete confirmation modal', () => {
            cy.get('.event-card').first().click();
            cy.get('#delete-event-btn').click();
            
            cy.get('#confirm-delete-event-modal').should('be.visible');
            cy.get('#delete-event-name').should('contain', 'Event To Delete');
        });

        it('should successfully delete event after confirmation', () => {
            cy.get('.event-card').first().click();
            cy.get('#delete-event-btn').click();
            
            cy.get('#confirm-delete-event-ok').click();
            
            // Should redirect to events list and show success
            cy.url().should('include', '/events');
            cy.get('#success-modal').should('be.visible');
            cy.get('#success-message').should('contain', 'deleted successfully');
            
            // Event should no longer appear in list
            cy.get('#success-ok').click();
            cy.get('.event-card').should('not.exist');
            cy.get('#events-empty').should('be.visible');
        });

        it('should cancel event deletion', () => {
            cy.get('.event-card').first().click();
            cy.get('#delete-event-btn').click();
            
            cy.get('#confirm-delete-event-cancel').click();
            cy.get('#confirm-delete-event-modal').should('not.be.visible');
            
            // Should remain on event detail page
            cy.get('#event-detail-name').should('contain', 'Event To Delete');
        });
    });

    describe('Event Navigation', () => {
        beforeEach(() => {
            cy.createEvent({
                name: 'Navigation Test Event',
                date: '2025-12-25',
                location: 'Navigation Location',
                participants: []
            });
        });

        it('should navigate to event detail when event card is clicked', () => {
            cy.get('.event-card').first().click();
            
            cy.url().should('include', '/events/');
            cy.get('#event-detail-name').should('contain', 'Navigation Test Event');
            cy.get('#event-detail-location').should('contain', 'Navigation Location');
        });

        it('should navigate back to events list from event detail', () => {
            cy.get('.event-card').first().click();
            cy.get('#event-detail-back').click();
            
            cy.url().should('eq', Cypress.config().baseUrl + '/events');
            cy.get('#events-list').should('be.visible');
        });

        it('should show loading states during data loading', () => {
            cy.get('#events-loading').should('exist');
            cy.get('#events-loading').should('not.be.visible');
            cy.get('#events-list').should('be.visible');
        });
    });

    describe('Expense Management', () => {
        beforeEach(() => {
            // Create an event with participants for expense testing
            cy.createEvent({
                name: 'Expense Test Event',
                date: '2025-12-25',
                location: 'Test Location',
                description: 'Event for testing expense management',
                participants: []
            }).then((eventId) => {
                // Navigate to the event detail page
                cy.visit(`/events/${eventId}`);
                cy.wait(1000);
            });
        });

        it('should add an expense successfully', () => {
            // Click add expense button
            cy.get('#add-expense-btn').click();
            cy.get('#add-expense-modal').should('be.visible');
            
            // Verify modal title is "Add Expense"
            cy.get('#add-expense-modal .modal-title').should('contain', 'Add Expense');
            cy.get('#add-expense-save').should('contain', 'Add Expense');
            
            // Fill out expense form
            cy.get('#expense-description').type('Court Rental');
            cy.get('#expense-amount').type('60.00');
            cy.get('#expense-date').type('2025-12-25');
            
            // Wait for participants to load and select payer
            cy.get('#participants-loading').should('not.be.visible');
            cy.get('#expense-paid-by').select(0); // Select first user
            
            // Save expense
            cy.get('#add-expense-save').click();
            
            // Verify success and modal closes
            cy.get('#success-modal').should('be.visible');
            cy.get('#success-message').should('contain', 'Court Rental');
            cy.get('#success-message').should('contain', 'added successfully');
            cy.get('#success-ok').click();
            
            // Verify expense appears in list
            cy.get('.expense-card').should('contain', 'Court Rental');
            cy.get('.expense-card').should('contain', '$60.00');
        });

        it('should edit an expense successfully with correct modal title and button text', () => {
            // First add an expense to edit
            cy.get('#add-expense-btn').click();
            cy.get('#expense-description').type('Original Expense');
            cy.get('#expense-amount').type('45.00');
            cy.get('#expense-date').type('2025-12-25');
            cy.get('#participants-loading').should('not.be.visible');
            cy.get('#expense-paid-by').select(0);
            cy.get('#add-expense-save').click();
            cy.get('#success-ok').click();
            
            // Now test editing the expense
            cy.get('.expense-card').should('contain', 'Original Expense');
            cy.get('.edit-expense-btn').first().click();
            
            // Verify modal opens with correct edit mode settings
            cy.get('#add-expense-modal').should('be.visible');
            cy.get('#add-expense-modal .modal-title').should('contain', 'Edit Expense');
            cy.get('#add-expense-save').should('contain', 'Update Expense');
            
            // Verify form is pre-populated with existing data
            cy.get('#expense-description').should('have.value', 'Original Expense');
            cy.get('#expense-amount').should('have.value', '45');
            cy.get('#expense-date').should('have.value', '2025-12-25');
            
            // Edit the expense
            cy.get('#expense-description').clear().type('Updated Expense');
            cy.get('#expense-amount').clear().type('55.00');
            
            // Save changes
            cy.get('#add-expense-save').click();
            
            // Verify success message shows updated expense name
            cy.get('#success-modal').should('be.visible');
            cy.get('#success-message').should('contain', 'Updated Expense');
            cy.get('#success-message').should('contain', 'updated successfully');
            cy.get('#success-ok').click();
            
            // Verify changes are reflected in the expense list
            cy.get('.expense-card').should('contain', 'Updated Expense');
            cy.get('.expense-card').should('contain', '$55.00');
            cy.get('.expense-card').should('not.contain', 'Original Expense');
        });

        it('should cancel expense editing without saving changes', () => {
            // Add an expense first
            cy.get('#add-expense-btn').click();
            cy.get('#expense-description').type('Test Expense');
            cy.get('#expense-amount').type('30.00');
            cy.get('#expense-date').type('2025-12-25');
            cy.get('#participants-loading').should('not.be.visible');
            cy.get('#expense-paid-by').select(0);
            cy.get('#add-expense-save').click();
            cy.get('#success-ok').click();
            
            // Edit but cancel
            cy.get('.edit-expense-btn').first().click();
            cy.get('#add-expense-modal .modal-title').should('contain', 'Edit Expense');
            
            // Make changes
            cy.get('#expense-description').clear().type('Should Not Save');
            
            // Cancel instead of saving
            cy.get('#add-expense-cancel').click();
            cy.get('#add-expense-modal').should('not.be.visible');
            
            // Verify original data is preserved
            cy.get('.expense-card').should('contain', 'Test Expense');
            cy.get('.expense-card').should('not.contain', 'Should Not Save');
        });
    });

    describe('Mobile Responsive', () => {
        beforeEach(() => {
            cy.viewport(375, 667); // iPhone SE size
        });

        it('should display events properly on mobile', () => {
            cy.createEvent({
                name: 'Mobile Test Event',
                date: '2025-12-25', 
                location: 'Mobile Location',
                participants: []
            }).then(() => {
                cy.visit('/events');
                cy.wait(1000);
                
                cy.get('.event-card').should('be.visible');
                cy.get('.event-card').should('contain', 'Mobile Test Event');
                
                // Check that buttons are touch-friendly (at least 44px)
                cy.get('#add-event-btn').should('have.css', 'min-height').and('match', /^([4-9]\d|\d{3,})px$/);
            });
        });

        it('should open modals properly on mobile', () => {
            cy.get('#add-event-btn').click();
            cy.get('#add-event-modal').should('be.visible');
            
            // Modal should fit mobile screen
            cy.get('#add-event-modal .modal-content').should('be.visible');
            cy.get('#event-name').should('be.visible');
        });
    });
});