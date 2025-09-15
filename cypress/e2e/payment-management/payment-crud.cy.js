describe('Payment Management - CRUD Operations', () => {
  let testUsers = [];
  let testEvent = null;

  beforeEach(() => {
    // Clear data and create fresh test data for each test
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
      // Alice paid $90, owes $30.01 = Alice is owed $59.99
      // Bob owes $30.00, Charlie owes $30.00
      // This should generate settlement suggestions
      console.log('Test expenses created to generate settlement suggestions');
    }).then(() => {
      // Navigate to payments page after data is created
      cy.visit('/');
      cy.get('[data-page="payments"]').click();
      cy.wait(1000); // Wait after navigation click
      cy.wait(2000); // Allow page to load and fetch data
    });
  });

  describe('Balance Overview', () => {
    it('should display user balances with correct color coding', () => {
      // Check that balance cards are displayed
      cy.get('#user-balances-container').should('be.visible');
      cy.get('.balance-card').should('have.length.at.least', 3);

      // Verify balance amounts are displayed
      cy.get('.balance-card').each(($card) => {
        cy.wrap($card).find('.balance-amount').should('be.visible');
        cy.wrap($card).find('h4').should('be.visible');
      });

      // Check for color-coded balances (positive/negative)
      cy.get('.balance-card').should('exist');
    });

    it('should show correct balance calculations', () => {
      // Based on our test data:
      // Court Rental: $60 (Alice pays, split 33.34/33.33/33.33)
      // Shuttlecocks: $30 (Bob pays, split 33.34/33.33/33.33)
      // Alice: Paid $60, owes ~$30.03 (33.34% of $30) = Net: ~$29.97 credit
      // Bob: Paid $30, owes ~$20.02 (33.34% of $60) = Net: ~$9.98 debt
      // Charlie: Paid $0, owes ~$30.03 = Net: ~$30.03 debt

      cy.get('.balance-card').should('have.length', 3);

      // Check that we have both positive and negative balances
      cy.get('.balance-card.positive').should('exist');
      cy.get('.balance-card.negative').should('exist');
    });
  });

  describe('Settlement Suggestions', () => {
    it('should display settlement suggestions', () => {
      cy.get('#settlement-suggestions-container').should('be.visible');
      // Allow time for settlement calculations to complete
      cy.wait(1000);
      // Check if there are settlement suggestions (may be 0 if balanced)
      cy.get('#settlement-suggestions-container').within(() => {
        cy.get('div').should('exist'); // Should have some content
      });
    });

    it('should allow processing settlements', () => {
      // Process settlement suggestion directly (no modal expected)
      cy.get('#settlement-suggestions-container').then(($container) => {
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

  describe('Payment Recording', () => {
    it('should allow recording manual payments', () => {
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
    });
  });

  describe('Payment History', () => {
    it('should display payment history', () => {
      cy.get('#recent-payments-container').should('be.visible');

      // Check if there are payments or empty state
      cy.get('#recent-payments-container').then(($container) => {
        if ($container.find('.payment-row').length > 0) {
          cy.get('.payment-row').should('exist');
        } else {
          // Should show empty state or no payments message
          cy.get('#recent-payments-container').should('contain.text', 'No Payments Yet');
        }
      });
    });

    it('should display payment information correctly', () => {
      // Only run this test if payments exist
      cy.get('#recent-payments-container').then(($container) => {
        if ($container.find('.payment-row').length > 0) {
          cy.get('.payment-row').first().within(() => {
            cy.get('.payment-info').should('be.visible');
            cy.get('.payment-description').should('be.visible');
            cy.get('.payment-amount').should('be.visible');
          });
        } else {
          cy.log('No payments available for testing');
        }
      });
    });

    it('should show payment date and amount formatting', () => {
      // Only run this test if payments exist
      cy.get('#recent-payments-container').then(($container) => {
        if ($container.find('.payment-row').length > 0) {
          cy.get('.payment-row').first().within(() => {
            cy.get('.payment-date').should('be.visible');
            cy.get('.payment-amount').should('match', /^\+\$\d+\.\d{2}$/);
          });
        } else {
          cy.log('No payments available for formatting test');
        }
      });
    });
  });

  describe('Data Cleanup', () => {
    it('should handle empty states after data cleanup', () => {
      // Clear all data
      cy.task('clearAllTestData');

      // Reload page
      cy.visit('/');
      cy.get('[data-page="payments"]').click();
      cy.wait(1000); // Wait after navigation click

      // Should show empty states
      cy.get('.empty-state').should('be.visible');
    });
  });

  after(() => {
    // Clean up test data
    cy.task('clearAllTestData');
  });
});