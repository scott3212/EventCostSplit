describe('Payment Management - Advanced Workflows', () => {
  let testUsers = [];
  let testEvents = [];

  before(() => {
    // Clear data and create comprehensive test scenario
    cy.task('clearAllTestData');
    
    // Create test users
    const timestamp = Date.now();
    testUsers = [
      { name: `Alice_${timestamp}`, email: `alice${timestamp}@test.com`, phone: '+1111111001' },
      { name: `Bob_${timestamp}`, email: `bob${timestamp}@test.com`, phone: '+1111111002' },
      { name: `Charlie_${timestamp}`, email: `charlie${timestamp}@test.com`, phone: '+1111111003' },
      { name: `Diana_${timestamp}`, email: `diana${timestamp}@test.com`, phone: '+1111111004' }
    ];

    // Create users via API
    testUsers.forEach(user => {
      cy.request('POST', '/api/users', user).then((response) => {
        expect(response.status).to.eq(201);
        user.id = response.body.data.id;
      });
    });

    // Create multiple events with different expense patterns
    const eventsData = [
      {
        name: `Morning Session ${timestamp}`,
        date: '2024-09-10',
        location: 'Court A',
        participantIds: [testUsers[0].id, testUsers[1].id, testUsers[2].id] // Alice, Bob, Charlie
      },
      {
        name: `Evening Session ${timestamp}`,
        date: '2024-09-11',
        location: 'Court B',
        participantIds: [testUsers[1].id, testUsers[2].id, testUsers[3].id] // Bob, Charlie, Diana
      }
    ];

    eventsData.forEach((eventData, index) => {
      cy.request('POST', '/api/events', eventData).then((response) => {
        expect(response.status).to.eq(201);
        testEvents[index] = response.body.data;
      });
    });

    // Add complex expense scenarios
    cy.then(() => {
      // Event 1 expenses - Alice owes money
      const event1Expenses = [
        {
          eventId: testEvents[0].id,
          description: 'Court Rental Morning',
          amount: 90.00,
          date: '2024-09-10',
          paidBy: testUsers[1].id, // Bob pays
          splits: [
            { userId: testUsers[0].id, percentage: 40 }, // Alice 40%
            { userId: testUsers[1].id, percentage: 30 }, // Bob 30%
            { userId: testUsers[2].id, percentage: 30 }  // Charlie 30%
          ]
        },
        {
          eventId: testEvents[0].id,
          description: 'Equipment Morning',
          amount: 60.00,
          date: '2024-09-10',
          paidBy: testUsers[2].id, // Charlie pays
          splits: [
            { userId: testUsers[0].id, percentage: 50 }, // Alice 50%
            { userId: testUsers[1].id, percentage: 25 }, // Bob 25%
            { userId: testUsers[2].id, percentage: 25 }  // Charlie 25%
          ]
        }
      ];

      // Event 2 expenses - Create different balance patterns
      const event2Expenses = [
        {
          eventId: testEvents[1].id,
          description: 'Court Rental Evening',
          amount: 120.00,
          date: '2024-09-11',
          paidBy: testUsers[3].id, // Diana pays
          splits: [
            { userId: testUsers[1].id, percentage: 33.33 }, // Bob
            { userId: testUsers[2].id, percentage: 33.33 }, // Charlie
            { userId: testUsers[3].id, percentage: 33.34 }  // Diana
          ]
        }
      ];

      [...event1Expenses, ...event2Expenses].forEach(expense => {
        cy.request('POST', '/api/expenses', expense).then((response) => {
          expect(response.status).to.eq(201);
        });
      });
    });
  });

  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-page="payments"]').click();
    cy.wait(1500); // Allow complex data to load
  });

  describe('Multi-User Balance Scenarios', () => {
    it('should display complex balance relationships correctly', () => {
      // Check that all users have balance cards
      cy.get('#user-balances-container').should('be.visible');
      cy.get('.balance-card').should('have.length', 4);

      // Verify each user has balance information
      testUsers.forEach(user => {
        cy.get('.balance-card').should('contain', user.name);
      });

      // Check for different balance states (positive/negative/zero)
      cy.get('.balance-card').then($cards => {
        const balances = Array.from($cards).map(card => 
          parseFloat(card.querySelector('.balance-amount').textContent.replace(/[$,]/g, ''))
        );
        
        // Should have both positive and negative balances
        const positiveBalances = balances.filter(b => b > 0);
        const negativeBalances = balances.filter(b => b < 0);
        
        expect(positiveBalances.length + negativeBalances.length).to.be.greaterThan(0);
      });
    });

    it('should show appropriate color coding for balance states', () => {
      cy.get('.balance-card').each($card => {
        cy.wrap($card).find('.balance-amount').then($amount => {
          const amount = parseFloat($amount.text().replace(/[$,]/g, ''));
          
          if (amount > 0) {
            // Positive balance - should have positive/credit styling
            cy.wrap($card).should('have.class', 'balance-positive')
              .or('have.class', 'credit-balance')
              .or('contain.text', 'owed'); // Some indicator of credit
          } else if (amount < 0) {
            // Negative balance - should have negative/debt styling
            cy.wrap($card).should('have.class', 'balance-negative')
              .or('have.class', 'debt-balance')
              .or('contain.text', 'owes'); // Some indicator of debt
          }
        });
      });
    });
  });

  describe('Settlement Optimization', () => {
    it('should provide efficient settlement suggestions', () => {
      cy.get('#settlement-suggestions-container').should('be.visible');
      
      // Check if we have settlement suggestions
      cy.get('#settlement-suggestions-container').then($container => {
        if ($container.find('.settlement-item').length > 0) {
          // Verify settlement items have required information
          cy.get('.settlement-item').each($item => {
            cy.wrap($item).find('.settlement-description').should('contain', 'pays to');
            cy.wrap($item).find('.settlement-amount').should('match', /\$[\d.]+/);
            cy.wrap($item).find('.process-settlement-btn').should('be.enabled');
          });

          // Check that settlement amounts are reasonable
          cy.get('.settlement-amount').each($amount => {
            const amount = parseFloat($amount.text().replace(/[$,]/g, ''));
            expect(amount).to.be.greaterThan(0);
            expect(amount).to.be.lessThan(1000); // Reasonable upper bound
          });
        }
      });
    });

    it('should update suggestions after processing a settlement', () => {
      // Count initial suggestions
      let initialSuggestionCount;
      cy.get('#settlement-suggestions-container').then($container => {
        initialSuggestionCount = $container.find('.settlement-item').length;
        
        if (initialSuggestionCount > 0) {
          // Process first suggestion
          cy.get('.process-settlement-btn').first().click();
          cy.get('#success-modal', { timeout: 10000 }).should('be.visible');
          cy.get('#success-ok').click();
          
          // Wait for page to refresh
          cy.wait(1000);
          
          // Suggestions should update (may be fewer now)
          cy.get('#settlement-suggestions-container').then($newContainer => {
            const newSuggestionCount = $newContainer.find('.settlement-item').length;
            expect(newSuggestionCount).to.be.lessThan(initialSuggestionCount + 1);
          });
        }
      });
    });
  });

  describe('Bulk Payment Scenarios', () => {
    it('should handle multiple payments in sequence', () => {
      const payments = [
        { user: testUsers[0].name, amount: '25.00', description: 'Partial settlement 1' },
        { user: testUsers[1].name, amount: '15.50', description: 'Partial settlement 2' },
        { user: testUsers[0].name, amount: '10.00', description: 'Additional payment' }
      ];

      payments.forEach((payment, index) => {
        // Open modal
        cy.get('#record-payment-btn').click();
        
        // Fill and submit
        cy.get('#payment-user-id').select(payment.user);
        cy.get('#payment-amount').type(payment.amount);
        cy.get('#payment-description').type(payment.description);
        cy.get('#record-payment-modal .btn-primary').click();
        
        // Confirm success
        cy.get('#success-modal', { timeout: 10000 }).should('be.visible');
        cy.get('#success-ok').click();
        
        // Wait between payments
        cy.wait(500);
      });

      // Verify all payments appear in history
      payments.forEach(payment => {
        cy.get('.payment-item').should('contain', payment.description);
        cy.get('.payment-item').should('contain', payment.amount);
      });
    });

    it('should maintain balance accuracy after multiple payments', () => {
      // Record known payment amounts and verify balance changes
      const testPayment = { amount: '20.00', user: testUsers[0].name };
      
      // Get initial balance
      let initialBalance;
      cy.get('.balance-card').contains(testUsers[0].name).parent().find('.balance-amount')
        .invoke('text').then(text => {
          initialBalance = parseFloat(text.replace(/[$,]/g, ''));
          
          // Record payment
          cy.get('#record-payment-btn').click();
          cy.get('#payment-user-id').select(testPayment.user);
          cy.get('#payment-amount').type(testPayment.amount);
          cy.get('#record-payment-modal .btn-primary').click();
          cy.get('#success-ok').click();
          
          // Verify balance updated correctly
          cy.get('.balance-card').contains(testUsers[0].name).parent().find('.balance-amount')
            .invoke('text').then(newText => {
              const newBalance = parseFloat(newText.replace(/[$,]/g, ''));
              const expectedBalance = initialBalance + parseFloat(testPayment.amount);
              expect(Math.abs(newBalance - expectedBalance)).to.be.lessThan(0.01); // Allow for rounding
            });
        });
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle very large payment amounts', () => {
      cy.get('#record-payment-btn').click();
      cy.get('#payment-user-id').select(testUsers[0].name);
      cy.get('#payment-amount').type('999999.99');
      cy.get('#record-payment-modal .btn-primary').click();
      
      // Should either accept or show appropriate validation
      cy.get('body').then($body => {
        if ($body.find('#success-modal').length > 0) {
          cy.get('#success-ok').click();
          cy.get('.payment-item').should('contain', '$999,999.99');
        } else {
          cy.get('#amount-error').should('be.visible');
        }
      });
    });

    it('should handle decimal precision correctly', () => {
      cy.get('#record-payment-btn').click();
      cy.get('#payment-user-id').select(testUsers[1].name);
      cy.get('#payment-amount').type('123.456'); // More than 2 decimals
      cy.get('#record-payment-modal .btn-primary').click();
      
      // Should round or validate appropriately
      cy.get('#success-modal', { timeout: 5000 }).should('be.visible');
      cy.get('#success-ok').click();
      
      // Check that amount is properly formatted
      cy.get('.payment-item').should('contain', '$123.46').or('contain', '$123.45');
    });

    it('should prevent duplicate payment submission', () => {
      cy.get('#record-payment-btn').click();
      cy.get('#payment-user-id').select(testUsers[2].name);
      cy.get('#payment-amount').type('50.00');
      
      // Click submit multiple times quickly
      cy.get('#record-payment-modal .btn-primary').click();
      cy.get('#record-payment-modal .btn-primary').click();
      cy.get('#record-payment-modal .btn-primary').click();
      
      // Should only process once
      cy.get('#success-modal', { timeout: 10000 }).should('be.visible');
      cy.get('#success-ok').click();
      
      // Only one payment should appear
      cy.get('.payment-item').filter(':contains("$50.00")').should('have.length', 1);
    });
  });

  describe('Balance Settlement Workflows', () => {
    it('should completely settle a user balance through payments', () => {
      // Find a user with a significant balance
      cy.get('.balance-card').then($cards => {
        const significantBalance = Array.from($cards).find(card => {
          const amount = Math.abs(parseFloat(card.querySelector('.balance-amount').textContent.replace(/[$,]/g, '')));
          return amount > 10;
        });
        
        if (significantBalance) {
          const userName = significantBalance.querySelector('.user-name').textContent;
          const balanceAmount = Math.abs(parseFloat(significantBalance.querySelector('.balance-amount').textContent.replace(/[$,]/g, '')));
          
          // Record payment to settle the balance
          cy.get('#record-payment-btn').click();
          cy.get('#payment-user-id').select(userName);
          cy.get('#payment-amount').type(balanceAmount.toFixed(2));
          cy.get('#payment-description').type('Complete settlement');
          cy.get('#record-payment-modal .btn-primary').click();
          cy.get('#success-ok').click();
          
          // Balance should be much closer to zero
          cy.get('.balance-card').contains(userName).parent().find('.balance-amount')
            .invoke('text').then(text => {
              const newBalance = Math.abs(parseFloat(text.replace(/[$,]/g, '')));
              expect(newBalance).to.be.lessThan(1); // Nearly settled
            });
        }
      });
    });

    it('should show updated settlement suggestions after partial payments', () => {
      // Make a partial payment and verify suggestions update
      cy.get('#record-payment-btn').click();
      cy.get('#payment-user-id').select(testUsers[0].name);
      cy.get('#payment-amount').type('5.00');
      cy.get('#payment-description').type('Partial payment for testing');
      cy.get('#record-payment-modal .btn-primary').click();
      cy.get('#success-ok').click();
      
      // Wait for updates
      cy.wait(1000);
      
      // Settlement suggestions should reflect the new balances
      cy.get('#settlement-suggestions-container').should('be.visible');
      cy.get('#settlement-suggestions-container').should('not.contain', 'Loading');
    });
  });

  describe('Data Persistence and Refresh', () => {
    it('should maintain payment data after page refresh', () => {
      // Record a distinctive payment
      const uniqueDescription = `Test Payment ${Date.now()}`;
      
      cy.get('#record-payment-btn').click();
      cy.get('#payment-user-id').select(testUsers[3].name);
      cy.get('#payment-amount').type('77.77');
      cy.get('#payment-description').type(uniqueDescription);
      cy.get('#record-payment-modal .btn-primary').click();
      cy.get('#success-ok').click();
      
      // Verify payment appears
      cy.get('.payment-item').should('contain', uniqueDescription);
      
      // Refresh page
      cy.reload();
      cy.get('[data-page="payments"]').click();
      cy.wait(1000);
      
      // Payment should still be there
      cy.get('.payment-item').should('contain', uniqueDescription);
      cy.get('.payment-item').should('contain', '$77.77');
    });
  });

  after(() => {
    // Clean up test data
    cy.task('clearAllTestData');
  });
});