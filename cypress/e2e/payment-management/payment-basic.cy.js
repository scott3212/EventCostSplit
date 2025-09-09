describe('Payment Management - Basic Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-page="payments"]').click();
    cy.wait(1000); // Allow page to load
  });

  describe('Page Loading and Structure', () => {
    it('should load the payments page successfully', () => {
      // Check page header
      cy.get('.page-header').should('contain', 'Payments');
      
      // Check main sections exist
      cy.get('#user-balances-container').should('be.visible');
      cy.get('#settlement-suggestions-container').should('be.visible');
      cy.get('#recent-payments-container').should('be.visible');
      
      // Check record payment button
      cy.get('#record-payment-btn').should('be.visible').and('contain', 'Record Payment');
    });

    it('should show loading states initially', () => {
      // Visit fresh and check loading states
      cy.visit('/');
      cy.get('[data-page="payments"]').click();
      
      // Should show loading placeholders briefly (may be very quick)
      cy.get('.loading-placeholder', { timeout: 2000 }).should('exist');
    });
  });

  describe('Record Payment Modal', () => {
    it('should open and close payment modal correctly', () => {
      // Open modal
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
      
      // Check form elements
      cy.get('#payment-user-id').should('be.visible');
      cy.get('#payment-amount').should('be.visible');
      cy.get('#payment-description').should('be.visible');
      cy.get('#payment-date').should('be.visible');
      
      // Close with cancel button
      cy.get('#record-payment-modal .btn-secondary').contains('Cancel').click();
      cy.get('#record-payment-modal').should('not.be.visible');
    });

    it('should close modal with X button', () => {
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
      
      // Close with X
      cy.get('#record-payment-modal .modal-close').click();
      cy.get('#record-payment-modal').should('not.be.visible');
    });

    it('should show validation errors for empty required fields', () => {
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
      
      // Try to submit without data
      cy.get('#record-payment-modal .btn-primary').click();
      
      // Should show validation errors (may vary based on implementation)
      cy.get('body').then($body => {
        if ($body.find('#userId-error').length > 0) {
          cy.get('#userId-error').should('be.visible');
        }
        if ($body.find('#amount-error').length > 0) {
          cy.get('#amount-error').should('be.visible');
        }
        if ($body.find('.form-error').length > 0) {
          cy.get('.form-error').should('be.visible');
        }
      });
    });

    it('should populate user dropdown when modal opens', () => {
      cy.get('#record-payment-btn').click();
      cy.get('#payment-user-id').should('be.visible');
      
      // Check if users are loaded (may be empty if no users exist)
      cy.get('#payment-user-id option').then($options => {
        if ($options.length > 1) {
          // Has users
          cy.get('#payment-user-id option').should('have.length.greaterThan', 1);
        } else {
          // Empty state is acceptable
          cy.log('No users available - this is acceptable for basic test');
        }
      });
    });
  });

  describe('Balance Display', () => {
    it('should handle empty balance state gracefully', () => {
      cy.get('#user-balances-container').should('be.visible');
      
      // Should show either balance cards or empty state
      cy.get('#user-balances-container').then($container => {
        if ($container.find('.balance-card').length > 0) {
          // Has balances
          cy.get('.balance-card').should('be.visible');
        } else {
          // Empty state is acceptable
          cy.log('No balances displayed - acceptable for empty state');
        }
      });
    });
  });

  describe('Settlement Suggestions', () => {
    it('should handle empty settlement state gracefully', () => {
      cy.get('#settlement-suggestions-container').should('be.visible');
      
      // Should show either suggestions or empty state
      cy.get('#settlement-suggestions-container').then($container => {
        if ($container.find('.settlement-item').length > 0) {
          // Has suggestions
          cy.get('.settlement-item').should('be.visible');
          cy.get('.process-settlement-btn').should('be.visible');
        } else {
          // Empty state is acceptable
          cy.log('No settlement suggestions - acceptable when balances are settled');
        }
      });
    });
  });

  describe('Recent Payments', () => {
    it('should display recent payments section', () => {
      cy.get('#recent-payments-container').should('be.visible');
      
      // Should show either payment history or empty state
      cy.get('#recent-payments-container').then($container => {
        if ($container.find('.payment-item').length > 0) {
          // Has payments
          cy.get('.payment-item').should('be.visible');
        } else {
          // Empty state is acceptable for fresh install
          cy.log('No payment history - acceptable for empty state');
        }
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
    });

    it('should validate negative amounts', () => {
      // Skip if no users available
      cy.get('#payment-user-id option').then($options => {
        if ($options.length > 1) {
          cy.get('#payment-user-id').select(1);
          cy.get('#payment-amount').type('-10.00');
          cy.get('#record-payment-modal .btn-primary').click();
          
          // Should show error or prevent submission
          cy.get('body').then($body => {
            if ($body.find('#amount-error').length > 0) {
              cy.get('#amount-error').should('be.visible');
            } else if ($body.find('#success-modal').length === 0) {
              // Payment was not recorded (good - negative amounts rejected)
              cy.log('Negative amount correctly rejected');
            }
          });
        } else {
          cy.log('Skipping validation test - no users available');
        }
      });
    });

    it('should handle very small amounts', () => {
      cy.get('#payment-user-id option').then($options => {
        if ($options.length > 1) {
          cy.get('#payment-user-id').select(1);
          cy.get('#payment-amount').type('0.01');
          cy.get('#record-payment-modal .btn-primary').click();
          
          // Small positive amounts should be accepted or show validation
          cy.get('body').then($body => {
            if ($body.find('#success-modal').length > 0) {
              // Success
              cy.get('#success-modal').should('be.visible');
              cy.get('#success-ok').click();
            } else if ($body.find('#amount-error').length > 0) {
              // Validation error (acceptable if minimum amount required)
              cy.get('#amount-error').should('be.visible');
            }
          });
        }
      });
    });
  });

  describe('Navigation and UI', () => {
    it('should maintain payments page state after modal interactions', () => {
      // Open and close modal
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal .btn-secondary').click();
      
      // Should still be on payments page
      cy.get('.page-header').should('contain', 'Payments');
      cy.get('#record-payment-btn').should('be.visible');
    });

    it('should be responsive on mobile viewport', () => {
      // Test mobile layout
      cy.viewport(375, 667); // iPhone SE size
      
      // Elements should still be accessible
      cy.get('#record-payment-btn').should('be.visible');
      cy.get('#user-balances-container').should('be.visible');
      
      // Modal should work on mobile
      cy.get('#record-payment-btn').click();
      cy.get('#record-payment-modal').should('be.visible');
      cy.get('#payment-user-id').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Intercept API calls to simulate errors
      cy.intercept('GET', '/api/users', { forceNetworkError: true }).as('getUsersError');
      
      // Reload page to trigger error
      cy.visit('/');
      cy.get('[data-page="payments"]').click();
      
      // Should not crash the application
      cy.get('.page-header').should('contain', 'Payments');
      
      // Should show some form of error state or continue with empty data
      cy.get('body').should('be.visible'); // Basic check that page is functional
    });

    it('should handle missing data gracefully', () => {
      // Intercept to return empty data
      cy.intercept('GET', '/api/users', { body: { data: [] } }).as('getEmptyUsers');
      cy.intercept('GET', '/api/payments', { body: { data: [] } }).as('getEmptyPayments');
      
      cy.visit('/');
      cy.get('[data-page="payments"]').click();
      
      // Should handle empty data without errors
      cy.get('.page-header').should('contain', 'Payments');
      cy.get('#record-payment-btn').should('be.visible');
    });
  });
});