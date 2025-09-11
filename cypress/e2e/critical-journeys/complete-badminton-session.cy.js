describe('Complete Badminton Session - End-to-End Journey', () => {
    beforeEach(() => {
        // Start with a clean slate
        cy.clearApplicationData();
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
        cy.get('#user-name').type('Alice Johnson');
        cy.get('#user-email').type('alice@badminton.com');
        cy.get('#user-phone').type('+1234567890');
        cy.get('#add-user-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Create participant 1 (Bob)
        cy.get('#add-user-btn').click();
        cy.get('#user-name').type('Bob Smith');
        cy.get('#user-email').type('bob@badminton.com');
        cy.get('#user-phone').type('+1234567891');
        cy.get('#add-user-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
        // Create participant 2 (Charlie)
        cy.get('#add-user-btn').click();
        cy.get('#user-name').type('Charlie Brown');
        cy.get('#user-email').type('charlie@badminton.com');
        cy.get('#user-phone').type('+1234567892');
        cy.get('#add-user-save').click();
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-ok').click();
        
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
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Event created successfully');
        cy.get('#success-ok').click();
        
        // Verify event created and navigate to detail
        cy.get('.event-card').should('contain', 'Friday Evening Badminton');
        cy.get('.event-card').should('contain', 'Sports Center Court A');
        cy.get('.event-card').should('contain', '3 participants');
        cy.get('.event-card').first().click(); // Go to event detail
        
        // **STEP 3: Add Expenses**
        cy.log('💰 STEP 3: Adding expenses to the event');
        
        // Add first expense - Court rental (paid by Alice, split equally)
        cy.get('#add-expense-btn').click();
        cy.get('#expense-description').type('Court Rental - 2 hours');
        cy.get('#expense-amount').type('60');
        cy.get('#expense-paid-by').select('Alice Johnson'); // Alice pays
        cy.get('#expense-date').type('2025-12-25');
        cy.get('#add-expense-save').click();
        
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Expense added successfully');
        cy.get('#success-ok').click();
        
        // Add second expense - Shuttlecocks (paid by Bob, split equally)
        cy.get('#add-expense-btn').click();
        cy.get('#expense-description').type('Shuttlecocks - Premium grade');
        cy.get('#expense-amount').type('30');
        cy.get('#expense-paid-by').select('Bob Smith'); // Bob pays
        cy.get('#expense-date').type('2025-12-25');
        cy.get('#add-expense-save').click();
        
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Expense added successfully');
        cy.get('#success-ok').click();
        
        // Verify expenses appear in event
        cy.get('.expense-card').should('have.length', 2);
        cy.get('.expense-card').should('contain', 'Court Rental - 2 hours');
        cy.get('.expense-card').should('contain', '$60.00');
        cy.get('.expense-card').should('contain', 'Shuttlecocks - Premium grade');
        cy.get('.expense-card').should('contain', '$30.00');
        
        // Verify total expense calculation
        cy.get('#event-total-expenses').should('contain', '$90.00');
        cy.get('#event-average-per-person').should('contain', '$30.00');
        
        // **STEP 4: Check Balances**
        cy.log('📊 STEP 4: Verifying balance calculations');
        
        cy.visit('/payments');
        cy.wait(1000);
        
        // Verify individual balances
        // Alice: Paid $60, owes $30 (her share) = Credit $30
        // Bob: Paid $30, owes $30 (his share) = Even $0  
        // Charlie: Paid $0, owes $30 (his share) = Owes $30
        
        cy.get('.balance-card').should('contain', 'Alice Johnson');
        cy.get('.balance-card').should('contain', '+$30.00'); // Alice has credit
        
        cy.get('.balance-card').should('contain', 'Bob Smith');
        cy.get('.balance-card').should('contain', '$0.00'); // Bob is even
        
        cy.get('.balance-card').should('contain', 'Charlie Brown');  
        cy.get('.balance-card').should('contain', '-$30.00'); // Charlie owes money
        
        // **STEP 5: Settlement Process**
        cy.log('💸 STEP 5: Recording settlement payments');
        
        // Charlie should pay $30 to the group (settlement suggestion)
        cy.get('#settlement-suggestions').should('contain', 'Charlie Brown pays to the group');
        cy.get('#settlement-suggestions').should('contain', '$30.00');
        
        // Record Charlie's payment
        cy.get('.settlement-suggestion').contains('Charlie Brown').within(() => {
            cy.get('.record-payment-btn').click();
        });
        
        // Verify payment recorded
        cy.get('#success-modal').should('be.visible');
        cy.get('#success-message').should('contain', 'Payment recorded successfully');
        cy.get('#success-ok').click();
        
        // **STEP 6: Final Verification**
        cy.log('✅ STEP 6: Final verification - all balanced');
        
        // After payment, all balances should be settled
        cy.get('.balance-card').each(($card) => {
            // All users should show $0.00 balance or be marked as "Settled"
            cy.wrap($card).should('contain', '$0.00').or('contain', 'Settled');
        });
        
        // No more settlement suggestions should appear
        cy.get('#settlement-suggestions').should('contain', 'All balances are settled');
        
        // Verify transaction history
        cy.get('#payment-history').should('contain', 'Charlie Brown paid $30.00 to the group');
        
        // **STEP 7: Cross-verification via Event Detail**
        cy.log('🔍 STEP 7: Cross-verification via event detail');
        
        cy.visit('/events');
        cy.get('.event-card').first().click();
        
        // Event should show all participants as settled
        cy.get('#event-participants-list .participant-card').each(($participant) => {
            cy.wrap($participant).should('contain', 'Settled').or('contain', '$0.00');
        });
        
        cy.log('🎉 COMPLETE: Full badminton session workflow verified successfully!');
    });

    it('Edge case: Event with partial participants in expenses', () => {
        cy.log('🧪 EDGE CASE: Testing partial participant expense splitting');
        
        // Create users
        cy.visit('/users');
        cy.wait(1000);
        
        ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'David Wilson'].forEach(name => {
            cy.get('#add-user-btn').click();
            cy.get('#user-name').type(name);
            cy.get('#user-email').type(`${name.toLowerCase().replace(' ', '.')}@test.com`);
            cy.get('#add-user-save').click();
            cy.get('#success-ok').click();
        });
        
        // Create event with all 4 participants
        cy.visit('/events');
        cy.get('#add-event-btn').click();
        cy.get('#event-name').type('Mixed Doubles Tournament');
        cy.get('#event-date').type('2025-12-26');
        cy.get('#event-location').type('Tournament Hall');
        
        // Select all 4 participants
        cy.get('#participants-loading').should('not.be.visible');
        cy.get('.participant-checkbox').check();
        cy.get('#add-event-save').click();
        cy.get('#success-ok').click();
        
        // Go to event detail
        cy.get('.event-card').first().click();
        
        // Add expense where only 3 people participate (exclude David)
        cy.get('#add-expense-btn').click();
        cy.get('#expense-description').type('Tournament Entry Fee');
        cy.get('#expense-amount').type('90');
        cy.get('#expense-paid-by').select('Alice Johnson');
        
        // Custom split: Exclude David (0%), Equal split for Alice, Bob, Charlie (33.33% each)
        cy.get('#custom-split-toggle').check();
        cy.get('#split-participant-David-Wilson').clear().type('0'); // David excluded
        cy.get('#split-participant-Alice-Johnson').clear().type('33.33');
        cy.get('#split-participant-Bob-Smith').clear().type('33.33');  
        cy.get('#split-participant-Charlie-Brown').clear().type('33.34'); // Remaining percentage
        
        cy.get('#add-expense-save').click();
        cy.get('#success-ok').click();
        
        // Verify balances
        cy.visit('/payments');
        cy.wait(1000);
        
        // Alice: Paid $90, owes $30 (33.33% of $90) = Credit $60
        // Bob: Paid $0, owes $30 = Owes $30  
        // Charlie: Paid $0, owes $30 = Owes $30
        // David: Paid $0, owes $0 = Even $0
        
        cy.get('.balance-card').contains('Alice Johnson').should('contain', '+$60.00');
        cy.get('.balance-card').contains('Bob Smith').should('contain', '-$30.00');
        cy.get('.balance-card').contains('Charlie Brown').should('contain', '-$30.00');
        cy.get('.balance-card').contains('David Wilson').should('contain', '$0.00');
        
        cy.log('✅ EDGE CASE: Partial participant expense splitting verified!');
    });
});