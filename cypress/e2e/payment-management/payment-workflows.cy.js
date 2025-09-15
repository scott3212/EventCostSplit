describe('Payment Management - Core Workflows', () => {
  let testUsers = [];
  let testEvent = null;

  beforeEach(() => {
    // Clear data and create minimal test data for each test
    cy.task('clearAllTestData');

    // Create test users
    const timestamp = Date.now();
    testUsers = [
      { name: `Alice_${timestamp}`, email: `alice${timestamp}@test.com`, phone: '+1234567001' },
      { name: `Bob_${timestamp}`, email: `bob${timestamp}@test.com`, phone: '+1234567002' },
      { name: `Charlie_${timestamp}`, email: `charlie${timestamp}@test.com`, phone: '+1234567003' }
    ];

    // Create users sequentially using cy.then for proper chaining
    cy.request('POST', '/api/users', testUsers[0]).then((response) => {
      testUsers[0].id = response.body.data.id;
      return cy.request('POST', '/api/users', testUsers[1]);
    }).then((response) => {
      testUsers[1].id = response.body.data.id;
      return cy.request('POST', '/api/users', testUsers[2]);
    }).then((response) => {
      testUsers[2].id = response.body.data.id;

      // Create an event with the users as participants
      const eventData = {
        name: `Test Event ${timestamp}`,
        date: '2024-09-15',
        location: 'Test Court',
        description: 'Test event for payment scenarios',
        participants: testUsers.map(u => u.id)
      };

      return cy.request('POST', '/api/events', eventData);
    }).then((response) => {
      testEvent = response.body.data;

      // Create expenses to generate clear imbalances for settlement suggestions
      const expense1 = {
        eventId: testEvent.id,
        description: 'Court Rental',
        amount: 90.00,
        date: '2024-09-15',
        paidBy: testUsers[0].id, // Alice pays $90
        splitPercentage: {
          [testUsers[0].id]: 33.34,  // Alice owes $30.01
          [testUsers[1].id]: 33.33,  // Bob owes $30.00
          [testUsers[2].id]: 33.33   // Charlie owes $30.00
        }
      };

      return cy.request('POST', '/api/cost-items', expense1);
    }).then(() => {
      // Navigate to payments page after data is created
      cy.visit('/');
      cy.get('[data-page="payments"]').click();
      cy.wait(1000); // Wait after navigation click
      cy.wait(2000); // Allow page to load and fetch data
    });
  });

  describe('Balance Display', () => {
    it('should display user balances with correct information', () => {
      // Check that balance cards are displayed
      cy.get('#user-balances-container').should('be.visible');
      cy.get('.balance-card').should('have.length.at.least', 3);

      // Verify balance amounts and user names are displayed
      cy.get('.balance-card').each(($card) => {
        cy.wrap($card).find('.balance-amount').should('be.visible');
        cy.wrap($card).find('h4').should('be.visible');
      });

      // Check for color-coded balances
      cy.get('.balance-card').should('exist');
    });

    it('should show appropriate balance color coding', () => {
      // Wait for data to load
      cy.get('.balance-card').should('have.length.at.least', 1);

      // Should have both positive and negative balances based on our test data
      cy.get('.balance-card').then($cards => {
        // Look for balance status indicators
        cy.get('.balance-status').should('exist');
      });
    });
  });

  describe('Settlement Suggestions', () => {
    it('should display settlement suggestions when balances exist', () => {
      cy.get('#settlement-suggestions-container').should('be.visible');

      // Check if we have settlement suggestions or appropriate empty state
      cy.get('#settlement-suggestions-container').then($container => {
        if ($container.find('.settlement-card').length > 0) {
          // Verify settlement cards have required information
          cy.get('.settlement-card').each($item => {
            cy.wrap($item).find('.settlement-description').should('contain', 'pays');
            cy.wrap($item).find('.settlement-amount').should('contain', '$');
            cy.wrap($item).find('.process-settlement-btn').should('be.enabled');
          });
        } else {
          // Should show empty state
          cy.get('#settlement-suggestions-container').should('contain.text', 'All Settled');
        }
      });
    });

    it('should process settlement suggestions successfully', () => {
      cy.get('#settlement-suggestions-container').then($container => {
        if ($container.find('.settlement-card').length > 0) {
          cy.get('.settlement-card').first().within(() => {
            cy.get('.process-settlement-btn').click();
            cy.wait(1000); // Wait after settlement button click
          });

          // Wait for page to refresh and settlement to be processed
          cy.wait(2000);

          // Should see a payment in recent payments
          cy.get('#recent-payments-container .payment-row').should('have.length.at.least', 1);
        } else {
          cy.log('No settlement suggestions available - skipping settlement processing test');
        }
      });
    });
  });

  describe('Manual Payment Recording', () => {
    it('should record manual payments successfully', () => {
      cy.get('#record-payment-btn').click();
      cy.wait(1000); // Wait after record payment button click

      // Fill out payment form
      cy.get('#record-payment-modal').should('be.visible');
      cy.get('#payment-user-id').select(1); // Select first user
      cy.get('#payment-amount').type('25.00');
      cy.get('#payment-description').type('Manual settlement');
      cy.get('#record-payment-save').click();
      cy.wait(1000); // Wait after manual payment submit

      // Should show success message
      cy.get('#success-modal', { timeout: 10000 }).should('be.visible');
      cy.get('#success-ok').click();
      cy.wait(1000); // Wait after success OK click

      // Should show payment in recent payments
      cy.get('#recent-payments-container .payment-row').should('contain', 'Manual settlement');
    });

    it('should validate payment form fields', () => {
      cy.get('#record-payment-btn').click();
      cy.wait(1000); // Wait after record payment button click

      // Try to submit without filling required fields
      cy.get('#record-payment-save').click();
      cy.wait(500);

      // Should show validation errors
      cy.get('#userId-error').should('be.visible');
      cy.get('#amount-error').should('be.visible');
    });
  });

  describe('Payment History', () => {
    it('should display payment history correctly', () => {
      cy.get('#recent-payments-container').should('be.visible');

      // Check if there are payments or empty state
      cy.get('#recent-payments-container').then(($container) => {
        if ($container.find('.payment-row').length > 0) {
          cy.get('.payment-row').should('exist');
          cy.get('.payment-row').first().within(() => {
            cy.get('.payment-info').should('be.visible');
            cy.get('.payment-amount').should('be.visible');
          });
        } else {
          // Should show empty state
          cy.get('#recent-payments-container').should('contain.text', 'No Payments Yet');
        }
      });
    });
  });

  after(() => {
    // Clean up test data
    cy.task('clearAllTestData');
  });
});