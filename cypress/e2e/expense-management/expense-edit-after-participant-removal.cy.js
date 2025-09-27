describe('Expense Edit After Participant Removal', () => {
  beforeEach(() => {
    cy.clearApplicationData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should allow editing expense after removing participant from event through UI', () => {
    cy.log('🏗️ STEP 1: Creating 3 users through UI')

    // Navigate to users page and create three users
    cy.visit('/users')
    cy.wait(1000)

    // Create Alice
    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Alice Test')
    cy.get('#user-email').type('alice@test.com')
    cy.get('#user-phone').type('+1111111111')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Create Bob
    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Bob Test')
    cy.get('#user-email').type('bob@test.com')
    cy.get('#user-phone').type('+2222222222')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Create Minnie (the participant we'll remove later)
    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Minnie Test')
    cy.get('#user-email').type('minnie@test.com')
    cy.get('#user-phone').type('+3333333333')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Verify all users created
    cy.get('.user-card').should('have.length', 3)

    cy.log('🏸 STEP 2: Creating event with all participants through UI')

    // Navigate to events and create event
    cy.visit('/events')
    cy.wait(1000)

    cy.get('#add-event-btn').click()
    cy.wait(1000)
    cy.get('#event-name').type('Test Event for Participant Removal')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Test Location')
    cy.get('#event-description').type('Test event to verify expense editing after participant removal')

    // Wait for participants to load and select all 3
    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').should('have.length', 3)
    cy.get('.participant-checkbox').each($checkbox => {
      cy.wrap($checkbox).check()
    })

    // Create the event
    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-message').should('contain', 'Event "Test Event for Participant Removal" created successfully!')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Navigate to the event detail page
    cy.get('.event-card').contains('Test Event for Participant Removal').click()
    cy.wait(1000)
    cy.get('#event-detail-page').should('be.visible')

    cy.log('💰 STEP 3: Adding expense with custom split - setting Minnie to 0%')

    // Add an expense with custom split percentages
    cy.get('#add-expense-btn').click()
    cy.wait(1000)

    cy.get('#add-expense-modal').should('be.visible')
    cy.wait(2000)

    cy.get('#expense-description').type('Court Rental')
    cy.get('#expense-amount').type('90')
    cy.get('#expense-paid-by').select('Alice Test')
    cy.get('#expense-date').type('2025-12-25')

    // Use custom split to set Minnie to 0%
    cy.get('label[for="split-custom"]').click()
    cy.wait(1000)

    // Set custom percentages: Alice 50%, Bob 50%, Minnie 0%
    // Wait for split participants to load and be visible
    cy.get('.split-participant').should('have.length', 3)

    // Set Alice to 50%
    cy.get('.split-participant:contains("Alice Test")').within(() => {
      cy.get('.split-percentage-input').clear().type('50')
    })

    // Set Bob to 50%
    cy.get('.split-participant:contains("Bob Test")').within(() => {
      cy.get('.split-percentage-input').clear().type('50')
    })

    // Set Minnie to 0%
    cy.get('.split-participant:contains("Minnie Test")').within(() => {
      cy.get('.split-percentage-input').clear().type('0')
    })

    // Submit the expense
    cy.get('#add-expense-save').click()
    cy.wait(2000)

    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Verify expense was created
    cy.get('.expense-card').should('contain', 'Court Rental')

    cy.log('📝 STEP 4: Test expense editing with 0% participant - our sanitization fix should work')

    // Test 1: Edit the expense immediately - this tests our core scenario
    // We have an expense where Minnie has 0% split, which simulates the stale data scenario

    // Now try to edit the expense - this tests our sanitization fix
    cy.get('.expense-card').contains('Court Rental')
      .closest('.expense-card')
      .find('.edit-expense-btn')
      .click()
    cy.wait(1000)

    cy.get('#add-expense-modal').should('be.visible')
    cy.get('#add-expense-modal .modal-title').should('contain', 'Edit Expense')

    // Wait for the form to load - our sanitization should handle the 0% participant
    cy.wait(3000)

    // Change the description to test that editing works
    cy.get('#expense-description', { timeout: 10000 }).should('exist')
    cy.get('#expense-description').should('have.value', 'Court Rental')
    cy.get('#expense-description').clear().type('Updated Court Rental - Test 1')

    // Save the expense edit - this should work even with Minnie at 0%
    cy.get('#add-expense-save').click()
    cy.wait(2000)

    // Verify the edit was successful (no validation error)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-message').should('contain', 'updated successfully')
    cy.get('#success-ok').click()

    // Verify the updated description appears
    cy.get('.expense-card').should('contain', 'Updated Court Rental - Test 1')

    cy.log('✅ SUCCESS: Expense editing with 0% participant works correctly!')

    // Test 2: Now actually remove Minnie from the event and test editing again
    cy.log('📝 STEP 5: Remove Minnie from event and test editing again')

    // Go back to events page to edit the event
    cy.visit('/events')
    cy.wait(1000)

    // Click on our test event to go to detail page
    cy.get('.event-card').contains('Test Event for Participant Removal').click()
    cy.wait(1000)

    // Click edit event
    cy.get('#edit-event-btn').click()
    cy.wait(2000)

    // Wait for modal and participants to load
    cy.get('#add-event-modal', { timeout: 10000 }).should('be.visible')
    cy.get('#participants-loading').should('not.be.visible')

    // Find and uncheck Minnie to remove her from the event
    cy.get('.participant-item').contains('Minnie Test').closest('.participant-item').within(() => {
      cy.get('.participant-checkbox').uncheck()
    })

    // Save the event changes
    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Now edit the expense again - this is the true test of our fix
    cy.get('.expense-card').contains('Updated Court Rental - Test 1')
      .closest('.expense-card')
      .find('.edit-expense-btn')
      .click()
    cy.wait(1000)

    cy.get('#add-expense-modal').should('be.visible')
    cy.wait(3000)

    // Change description again
    cy.get('#expense-description').should('have.value', 'Updated Court Rental - Test 1')
    cy.get('#expense-description').clear().type('Final Update - After Participant Removal')

    // This is the critical test - expense editing after removing participant from event
    cy.get('#add-expense-save').click()
    cy.wait(2000)

    // Verify success (our sanitization fix prevents the validation error)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-message').should('contain', 'updated successfully')
    cy.get('#success-ok').click()

    cy.get('.expense-card').should('contain', 'Final Update - After Participant Removal')

    cy.log('🎉 COMPLETE SUCCESS: Both scenarios work correctly!')
    cy.log('✅ Scenario 1: Edit expense with 0% participant - PASSED')
    cy.log('✅ Scenario 2: Edit expense after removing participant from event - PASSED')
  })
})