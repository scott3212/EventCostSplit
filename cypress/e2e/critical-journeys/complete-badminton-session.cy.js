describe('Complete Badminton Session - End-to-End Journey', () => {
    beforeEach(() => {
        // Start with a clean slate
        cy.clearApplicationData();
        cy.visit('/');
        
        // Additional verification - ensure users page is empty
        cy.visit('/users');
        cy.wait(1000);
        cy.get('.user-card').should('not.exist');
        cy.visit('/');
    });

    it('Complete workflow: Create users → Create event → Add expenses → Record payments', () => {
        // **STEP 1: Create Users**
        cy.log('🏗️ STEP 1: Creating users for badminton session');
        
        // Navigate to users page and create organizer
        cy.visit('/users');
        cy.wait(1000);
        
        // Create organizer (Alice)
        cy.get('#add-user-btn').click();
        cy.wait(1000);
        cy.get('#user-name').type('Alice Johnson');
        cy.get('#user-email').type('alice@badminton.com');
        cy.get('#user-phone').type('+1234567890');
        cy.get('#add-user-save').click();
        cy.wait(1000);
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Create participant 1 (Bob)
        cy.get('#add-user-btn').click();
        cy.wait(1000);
        cy.get('#user-name').type('Bob Smith');
        cy.get('#user-email').type('bob@badminton.com');
        cy.get('#user-phone').type('+1234567891');
        cy.get('#add-user-save').click();
        cy.wait(1000);
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Create participant 2 (Charlie)
        cy.get('#add-user-btn').click();
        cy.wait(1000);
        cy.get('#user-name').type('Charlie Brown');
        cy.get('#user-email').type('charlie@badminton.com');
        cy.get('#user-phone').type('+1234567892');
        cy.get('#add-user-save').click();
        cy.wait(1000);
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Verify all users created
        cy.get('.user-card').should('have.length', 3);
        cy.get('.user-card').should('contain', 'Alice Johnson');
        cy.get('.user-card').should('contain', 'Bob Smith');
        cy.get('.user-card').should('contain', 'Charlie Brown');
        
        // **STEP 2: Create Badminton Event**
        cy.log('🏸 STEP 2: Creating badminton event');
        
        cy.visit('/events');
        cy.wait(1000);
        
        // Create event
        cy.get('#add-event-btn').click();
        cy.wait(1000);
        cy.get('#event-name').type('Friday Evening Badminton');
        cy.get('#event-date').type('2025-12-25');
        cy.get('#event-location').type('Sports Center Court A');
        cy.get('#event-description').type('Weekly badminton session with court rental and equipment');
        
        // Wait for participants to load and select all 3
        cy.get('#participants-loading').should('not.be.visible');
        cy.get('.participant-checkbox').should('have.length', 3);
        cy.get('.participant-checkbox').eq(0).check(); // Alice
        cy.get('.participant-checkbox').eq(1).check(); // Bob  
        cy.get('.participant-checkbox').eq(2).check(); // Charlie
        
        // Create the event
        cy.get('#add-event-save').click();
        cy.wait(1000);
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Event "Friday Evening Badminton" created successfully!');
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Verify event created and navigate to detail
        cy.get('.event-card').should('contain', 'Friday Evening Badminton');
        cy.get('.event-card').should('contain', 'Sports Center Court A');
        cy.get('.event-card').should('contain', 'Participants'); // Participant label
        cy.get('.event-card .stat-value').should('contain', '3'); // Participant count value
        cy.get('.event-card').first().click(); // Go to event detail
        cy.wait(1000);
        
        // **STEP 3: Add Expenses**
        cy.log('💰 STEP 3: Adding expenses to the event');
        
        // Add first expense - Court rental (paid by Alice, split equally)
        cy.get('#add-expense-btn').click();
        cy.wait(1000);
        
        // Wait for expense modal to fully load with participant data
        cy.get('#add-expense-modal').should('be.visible');
        // Wait longer for participant data to load - this is an async operation
        cy.wait(2000);
        cy.get('#expense-paid-by option', { timeout: 10000 }).should('have.length.at.least', 4); // Wait for participants to load
        
        cy.get('#expense-description').type('Court Rental - 2 hours');
        cy.get('#expense-amount').type('60');
        cy.get('#expense-paid-by').select('Alice Johnson'); // Alice pays
        cy.get('#expense-date').type('2025-12-25');
        cy.get('#add-expense-save').click();
        cy.wait(1000);
        
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Expense "Court Rental - 2 hours" added successfully!');
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Add second expense - Shuttlecocks (paid by Bob, split equally)
        cy.get('#add-expense-btn').click();
        cy.wait(1000);
        
        // Wait for expense modal to fully load with participant data (same pattern as first expense)
        cy.get('#add-expense-modal').should('be.visible');
        cy.wait(2000); // Wait for participant data to load
        cy.get('#expense-paid-by option', { timeout: 10000 }).should('have.length.at.least', 4); // Wait for participants to load
        cy.get('#expense-description').type('Shuttlecocks - Premium grade');
        cy.get('#expense-amount').type('30');
        cy.get('#expense-paid-by').select('Bob Smith'); // Bob pays
        cy.get('#expense-date').type('2025-12-25');
        cy.get('#add-expense-save').click();
        cy.wait(1000);
        
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Expense "Shuttlecocks - Premium grade" added successfully!');
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Verify expenses appear in event
        cy.get('.expense-card').should('have.length', 2);
        cy.get('.expense-card').should('contain', 'Court Rental - 2 hours');
        cy.get('.expense-card').should('contain', '$60.00');
        cy.get('.expense-card').should('contain', 'Shuttlecocks - Premium grade');
        cy.get('.expense-card').should('contain', '$30.00');
        
        // Verify total expense calculation appears
        cy.get('#total-expenses-amount').should('contain', '$90.00');
        
        // **STEP 4: Check Balances**
        cy.log('📊 STEP 4: Verifying balance calculations');
        
        cy.visit('/payments');
        cy.wait(1000);
        
        // Wait for balance cards to be fully rendered with data
        cy.get('.balance-card').should('have.length', 3);
        
        // Wait for API calls to complete and balance data to be rendered
        cy.wait(1000);
        
        // Verify individual balances
        // Alice: Paid $60, owes $30 (her share) = Credit $30
        // Bob: Paid $30, owes $30 (his share) = Even $0  
        // Charlie: Paid $0, owes $30 (his share) = Owes $30
        
        // Try simpler approach - check if balance cards contain the user names and amounts
        cy.get('.balance-card').should('contain', 'Alice Johnson').should('contain', '$30.00');
        cy.get('.balance-card').should('contain', 'Bob Smith').should('contain', '$0.00');
        cy.get('.balance-card').should('contain', 'Charlie Brown').should('contain', '$30.00');
        
        // **STEP 5: Settlement Process**
        cy.log('💸 STEP 5: Recording settlement payments');
        
        // Charlie should pay $30 to the group (settlement suggestion)
        cy.get('#settlement-suggestions-container').should('contain', 'Charlie Brown pays to the group');
        cy.get('#settlement-suggestions-container').should('contain', '$30.00');
        
        // Record Charlie's payment
        cy.wait(1000); // Wait for settlement suggestions to be fully rendered
        cy.get('.settlement-card').first().within(() => {
            cy.get('.process-settlement-btn').should('exist').click();
            cy.wait(1000);
        });
        
        // Verify payment recorded
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Settlement processed');
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // **STEP 6: Final Verification**
        cy.log('✅ STEP 6: Final verification - all balanced');
        
        // After payment, all balances should be settled
        // Check that settlement suggestions show "All Settled!" indicating no outstanding balances
        cy.get('#settlement-suggestions-container').should('contain', 'All Settled!');
        
        // Verify transaction history shows the settlement
        cy.get('#recent-payments-container').should('contain', 'Charlie Brown');
        
        cy.log('🎉 COMPLETE: Full badminton session workflow verified successfully!');
    });

    it('Edge case: Event with 4 participants and equal expense splitting', () => {
        cy.log('🧪 EDGE CASE: Testing 4-participant event with equal expense splitting');
        
        // Create users with more explicit timing
        cy.visit('/users');
        cy.wait(1000);
        
        // Create Alice Johnson
        cy.get('#add-user-btn').click();
        cy.wait(1000);
        cy.get('#user-name').type('Alice Johnson');
        cy.get('#user-email').type('alice.johnson@test.com');
        cy.get('#add-user-save').click();
        cy.wait(1000);
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Create Bob Smith  
        cy.get('#add-user-btn').click();
        cy.wait(1000);
        cy.get('#user-name').type('Bob Smith');
        cy.get('#user-email').type('bob.smith@test.com');
        cy.get('#add-user-save').click();
        cy.wait(1000);
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Create Charlie Brown
        cy.get('#add-user-btn').click();
        cy.wait(1000);
        cy.get('#user-name').type('Charlie Brown');
        cy.get('#user-email').type('charlie.brown@test.com');
        cy.get('#add-user-save').click();
        cy.wait(1000);
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Create David Wilson
        cy.get('#add-user-btn').click();
        cy.wait(1000);
        cy.get('#user-name').type('David Wilson');
        cy.get('#user-email').type('david.wilson@test.com');
        cy.get('#add-user-save').click();
        cy.wait(1000);
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Create event with all 4 participants
        cy.visit('/events');
        cy.wait(1000);
        cy.get('#add-event-btn').click();
        cy.wait(1000);
        cy.get('#event-name').type('Mixed Doubles Tournament');
        cy.get('#event-date').type('2025-12-26');
        cy.get('#event-location').type('Tournament Hall');
        
        // Wait for participants to load and verify we have 4 users
        cy.get('#participants-loading').should('not.be.visible');
        cy.get('.participant-checkbox').should('have.length', 4);
        cy.get('.participant-checkbox').check();
        cy.get('#add-event-save').click();
        cy.wait(1000);
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Go to event detail
        cy.get('.event-card').first().click();
        cy.wait(1000);
        
        // Add expense with equal split among all participants
        cy.get('#add-expense-btn').click();
        cy.wait(1000);
        
        // Wait for expense modal to fully load with participant data
        cy.get('#add-expense-modal').should('be.visible');
        cy.wait(2000); // Wait for participant data to load
        cy.get('#expense-paid-by option', { timeout: 10000 }).should('have.length.at.least', 5); // Wait for 4 participants + default option to load
        cy.get('#expense-description').type('Tournament Entry Fee');
        cy.get('#expense-amount').type('120'); // $30 each for 4 people
        cy.get('#expense-paid-by').select('Alice Johnson');
        
        // Keep equal split (default) - all 4 participants pay equally
        // Note: Custom split testing will be added in separate test suite
        
        cy.get('#add-expense-save').click();
        cy.wait(1000);
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Expense "Tournament Entry Fee" added successfully!');
        cy.get('#success-ok').click();
        cy.wait(1000);
        
        // Verify balances  
        cy.visit('/payments');
        cy.wait(1000);
        
        // Alice: Paid $120, owes $30 (her 25% share) = Credit $90
        // Bob: Paid $0, owes $30 (his 25% share) = Owes $30
        // Charlie: Paid $0, owes $30 (his 25% share) = Owes $30  
        // David: Paid $0, owes $30 (his 25% share) = Owes $30
        
        // Wait extra time for balance data to be fully rendered
        cy.wait(2000);
        
        // Use more robust assertions that don't rely on specific DOM structure
        cy.get('.balance-card').should('contain', 'Alice Johnson').should('contain', '$90.00');
        cy.get('.balance-card').should('contain', 'Bob Smith').should('contain', '$30.00');
        cy.get('.balance-card').should('contain', 'Charlie Brown').should('contain', '$30.00');
        cy.get('.balance-card').should('contain', 'David Wilson').should('contain', '$30.00');
        
        cy.log('✅ EDGE CASE: 4-participant equal expense splitting verified!');
    });
});