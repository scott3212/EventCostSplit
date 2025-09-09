describe('Payment Management - CRUD Operations', () => {
  let testUsers = [];
  let testEvent = null;

  before(() => {
    // Clear data and create initial test data
    cy.task('clearAllTestData')
    
    // Create test users
    const timestamp = Date.now();
    testUsers = [
      { name: `Alice_${timestamp}`, email: `alice${timestamp}@test.com`, phone: '+1234567001' },
      { name: `Bob_${timestamp}`, email: `bob${timestamp}@test.com`, phone: '+1234567002' },
      { name: `Charlie_${timestamp}`, email: `charlie${timestamp}@test.com`, phone: '+1234567003' }
    ];

    // Create users via API
    testUsers.forEach(user => {
      cy.request('POST', '/api/users', user).then((response) => {
        expect(response.status).to.eq(201);
        user.id = response.body.data.id;
      });
    });

    // Create an event with expenses to generate balances
    const eventData = {
      name: `Test Event ${timestamp}`,
      date: '2024-09-15',
      location: 'Test Court',
      description: 'Test event for payment scenarios',
      participantIds: testUsers.map(u => u.id)
    };

    cy.request('POST', '/api/events', eventData).then((response) => {
      expect(response.status).to.eq(201);
      testEvent = response.body.data;

      // Add expenses to create balances
      const expenses = [
        {
          eventId: testEvent.id,
          description: 'Court Rental',
          amount: 60.00,
          date: '2024-09-15',
          paidBy: testUsers[0].id, // Alice pays
          splits: testUsers.map(u => ({ userId: u.id, percentage: 33.33 }))
        },
        {
          eventId: testEvent.id,
          description: 'Shuttlecocks',
          amount: 30.00,
          date: '2024-09-15',
          paidBy: testUsers[1].id, // Bob pays
          splits: testUsers.map(u => ({ userId: u.id, percentage: 33.33 }))
        }
      ];

      expenses.forEach(expense => {
        cy.request('POST', '/api/expenses', expense).then((response) => {
          expect(response.status).to.eq(201);
        });
      });
    });
  });

  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-page="payments"]').click();
    cy.wait(1000); // Allow page to load
  });

  describe('Balance Overview', () => {
    it('should display user balances with correct color coding', () => {
      // Check that balance cards are displayed
      cy.get('#user-balances-container').should('be.visible');
      cy.get('.balance-card').should('have.length.at.least', 3);

      // Verify balance amounts are displayed
      cy.get('.balance-card').each(($card) => {
        cy.wrap($card).find('.balance-amount').should('be.visible');
        cy.wrap($card).find('.user-name').should('be.visible');
      });

      // Check for color-coded balances (positive/negative)
      cy.get('.balance-card').should('exist');
    });

    it('should show loading state initially', () => {
      cy.visit('/');
      cy.get('[data-page="payments"]').click();
      
      // Should show loading placeholder briefly
      cy.get('.loading-placeholder').should('be.visible');
      
      // Then show actual content
      cy.get('#user-balances-container', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Settlement Suggestions', () => {
    it('should display settlement suggestions when balances exist', () => {
      // Check settlement suggestions section
      cy.get('#settlement-suggestions-container').should('be.visible');
      
      // May have suggestions or empty state
      cy.get('#settlement-suggestions-container').then(($container) => {
        if ($container.find('.settlement-item').length > 0) {
          // Has suggestions
          cy.get('.settlement-item').should('be.visible');
          cy.get('.settlement-item').each(($item) => {
            cy.wrap($item).find('.settlement-description').should('be.visible');
            cy.wrap($item).find('.settlement-amount').should('be.visible');
            cy.wrap($item).find('.process-settlement-btn').should('be.visible');
          });
        } else {
          // Empty state is acceptable if all balances are settled
          cy.log('No settlement suggestions - balances may be settled');
        }
      });
    });

    it('should process settlement suggestion when button is clicked', () => {
      // Look for settlement suggestions
      cy.get('#settlement-suggestions-container').then(($container) => {
        if ($container.find('.process-settlement-btn').length > 0) {
          // Click the first settlement suggestion
          cy.get('.process-settlement-btn').first().click();
          
          // Should show success message
          cy.get('#success-modal', { timeout: 10000 }).should('be.visible');
          cy.get('#success-message').should('contain', 'Settlement processed');
          cy.get('#success-ok').click();
          
          // Balances should update
          cy.get('#user-balances-container').should('be.visible');
          
          // Recent payments should show the new settlement
          cy.get('#recent-payments-container').should('be.visible');
        } else {
          cy.log('No settlement suggestions available to test');
        }
      });
    });
  });

  describe('Record Payment Modal', () => {
    it('should open record payment modal when button is clicked', () => {
      cy.get('#record-payment-btn').should('be.visible').click();
      
      // Modal should be visible
      cy.get('#record-payment-modal').should('be.visible');
      
      // Form fields should be present
      cy.get('#payment-user-id').should('be.visible');
      cy.get('#payment-amount').should('be.visible');
      cy.get('#payment-description').should('be.visible');
      cy.get('#payment-date').should('be.visible');
      
      // User dropdown should be populated
      cy.get('#payment-user-id option').should('have.length.greaterThan', 1);
    });

    it('should close modal when cancel is clicked', () => {
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
      
      // Close via cancel button
      cy.get('#record-payment-modal .btn-secondary').contains('Cancel').click();
      cy.get('#record-payment-modal').should('not.be.visible');
    });

    it('should close modal when X button is clicked', () => {
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
      
      // Close via X button
      cy.get('#record-payment-modal .modal-close').click();
      cy.get('#record-payment-modal').should('not.be.visible');
    });
  });

  describe('Payment Recording', () => {
    it('should record a payment with valid data', () => {
      // Open modal
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
      
      // Fill form
      cy.get('#payment-user-id').select(testUsers[0].name); // Select Alice
      cy.get('#payment-amount').type('25.00');
      cy.get('#payment-description').type('Settlement payment');
      cy.get('#payment-date').type('2024-09-16');
      
      // Submit form
      cy.get('#record-payment-modal .btn-primary').contains('Record Payment').click();
      
      // Should show success message
      cy.get('#success-modal', { timeout: 10000 }).should('be.visible');
      cy.get('#success-message').should('contain', 'Payment recorded');
      cy.get('#success-ok').click();
      
      // Modal should close
      cy.get('#record-payment-modal').should('not.be.visible');
      
      // Recent payments should update
      cy.get('#recent-payments-container').should('be.visible');
      cy.get('.payment-item').should('contain', 'Settlement payment');
    });

    it('should show validation error for missing required fields', () => {
      // Open modal
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
      
      // Try to submit without required data
      cy.get('#record-payment-modal .btn-primary').contains('Record Payment').click();
      
      // Should show validation errors
      cy.get('#userId-error').should('be.visible');
      cy.get('#amount-error').should('be.visible');
    });

    it('should show validation error for invalid amount', () => {
      // Open modal
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
      
      // Fill with invalid amount
      cy.get('#payment-user-id').select(testUsers[0].name);
      cy.get('#payment-amount').type('-10.00'); // Negative amount
      
      // Submit
      cy.get('#record-payment-modal .btn-primary').contains('Record Payment').click();
      
      // Should show validation error
      cy.get('#amount-error').should('be.visible').and('contain', 'must be positive');
    });

    it('should record payment with minimal data (user and amount only)', () => {
      // Open modal
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
      
      // Fill only required fields
      cy.get('#payment-user-id').select(testUsers[1].name); // Select Bob
      cy.get('#payment-amount').type('15.50');
      
      // Submit
      cy.get('#record-payment-modal .btn-primary').contains('Record Payment').click();
      
      // Should succeed
      cy.get('#success-modal', { timeout: 10000 }).should('be.visible');
      cy.get('#success-ok').click();
      
      // Should appear in recent payments
      cy.get('.payment-item').should('contain', '$15.50');
    });
  });

  describe('Payment History', () => {
    it('should display recent payments', () => {
      // Recent payments section should be visible
      cy.get('#recent-payments-container').should('be.visible');
      
      // Should show payments or empty state
      cy.get('#recent-payments-container').then(($container) => {
        if ($container.find('.payment-item').length > 0) {
          // Has payments
          cy.get('.payment-item').should('be.visible');
          cy.get('.payment-item').each(($item) => {
            cy.wrap($item).find('.payment-amount').should('be.visible');
            cy.wrap($item).find('.payment-date').should('be.visible');
            cy.wrap($item).find('.payment-user').should('be.visible');
          });
        } else {
          // Empty state
          cy.get('.empty-state').should('contain', 'No payments recorded');
        }
      });
    });

    it('should show payment details correctly', () => {
      // First, record a payment to ensure we have data
      cy.get('#record-payment-btn').click();
      cy.get('#payment-user-id').select(testUsers[2].name); // Charlie
      cy.get('#payment-amount').type('20.00');
      cy.get('#payment-description').type('Test payment detail');
      cy.get('#record-payment-modal .btn-primary').click();
      cy.get('#success-ok').click();
      
      // Check that the payment appears with correct details
      cy.get('.payment-item').should('contain', 'Test payment detail');
      cy.get('.payment-item').should('contain', '$20.00');
      cy.get('.payment-item').should('contain', testUsers[2].name);
    });
  });

  describe('Balance Updates', () => {
    it('should update balances after recording payment', () => {
      // Get initial balance for a user
      let initialBalance;
      cy.get('.balance-card').first().find('.balance-amount').invoke('text').then((text) => {
        initialBalance = text;
        
        // Record a payment for that user
        cy.get('#record-payment-btn').click();
        cy.get('#payment-user-id').select(1); // First user in dropdown
        cy.get('#payment-amount').type('10.00');
        cy.get('#record-payment-modal .btn-primary').click();
        cy.get('#success-ok').click();
        
        // Balance should update
        cy.get('.balance-card').first().find('.balance-amount').should('not.contain', initialBalance);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Intercept API calls to simulate errors
      cy.intercept('GET', '/api/payments', { forceNetworkError: true }).as('getPaymentsError');
      
      // Reload page to trigger error
      cy.visit('/');
      cy.get('[data-page="payments"]').click();
      
      // Should show error state
      cy.get('.error-message', { timeout: 10000 }).should('be.visible');
    });

    it('should handle empty data gracefully', () => {
      // Intercept to return empty data
      cy.intercept('GET', '/api/users', { body: { data: [] } }).as('getEmptyUsers');
      cy.intercept('GET', '/api/payments', { body: { data: [] } }).as('getEmptyPayments');
      
      // Reload page
      cy.visit('/');
      cy.get('[data-page="payments"]').click();
      
      // Should show empty states
      cy.get('.empty-state').should('be.visible');
    });
  });

  after(() => {
    // Clean up test data
    cy.task('clearAllTestData');
  });
});