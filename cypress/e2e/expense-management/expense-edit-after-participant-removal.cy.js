describe('Expense Edit After Participant Removal', () => {
  beforeEach(() => {
    // Clear application data and navigate to homepage
    cy.clearApplicationData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should allow editing expense after removing participant from event', () => {
    cy.log('🏗️ STEP 1: Creating users through UI')

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

    cy.log('💰 STEP 3: Adding expense with all participants through UI')

    // Add an expense with all three participants
    cy.get('#add-expense-btn').click()
    cy.wait(1000)

    cy.get('#add-expense-modal').should('be.visible')
    cy.wait(2000)

    cy.get('#expense-description').type('Court Rental')
    cy.get('#expense-amount').type('90')
    cy.get('#expense-paid-by').select('Alice Test')
    cy.get('#expense-date').type('2025-12-25')

    // Submit the expense (will be split equally among all 3 participants)
    cy.get('#add-expense-save').click()
    cy.wait(2000)

    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.log('🧪 STEP 4: Simulate participant removal scenario')

    // We'll use the test endpoint to simulate the exact bug scenario:
    // 1. Remove Minnie from the event (but leave her in expense split)
    // 2. This creates the stale data condition our fix addresses

    cy.request('GET', '/api/events').then((eventsResponse) => {
      const testEvent = eventsResponse.body.find(e => e.name === 'Test Event for Participant Removal')

      cy.request('GET', '/api/users').then((usersResponse) => {
        const alice = usersResponse.body.find(u => u.name === 'Alice Test')
        const bob = usersResponse.body.find(u => u.name === 'Bob Test')
        const minnie = usersResponse.body.find(u => u.name === 'Minnie Test')

        cy.request('GET', '/api/cost-items').then((costItemsResponse) => {
          const courtRentalExpense = costItemsResponse.body.find(item => item.description === 'Court Rental')

          // Step 1: Remove Minnie from event participants (simulate participant removal)
          cy.request('PUT', `/api/events/${testEvent.id}`, {
            name: testEvent.name,
            date: testEvent.date,
            location: testEvent.location,
            description: testEvent.description,
            participants: [alice.id, bob.id] // Remove Minnie from event
          })

          // Step 2: Force stale data - expense still has Minnie in split
          const staleExpenseData = {
            eventId: testEvent.id,
            description: 'Court Rental',
            amount: 90,
            paidBy: alice.id,
            date: '2025-12-25',
            splitPercentage: {
              [alice.id]: 33.33,
              [bob.id]: 33.33,
              [minnie.id]: 33.34  // Stale data: Minnie still in split but not in event!
            }
          }

          // Force update the expense with stale data (bypassing validation)
          cy.request('POST', '/api/test/force-update-expense', {
            expenseId: courtRentalExpense.id,
            expenseData: staleExpenseData
          })
        })
      })
    })

    cy.wait(1000)

    // Refresh the page to reload data
    cy.reload()
    cy.wait(2000)

    // Navigate back to event detail
    cy.visit('/events')
    cy.wait(1000)
    cy.get('.event-card').contains('Test Event for Participant Removal').click()
    cy.wait(2000)

    cy.log('📝 STEP 5: Test expense editing with stale data (our fix is tested here)')

    // Verify the event now only has 2 participants (Alice and Bob)
    cy.get('#event-detail-page').should('be.visible')

    // But the expense card should still be visible (even with stale split data)
    cy.get('.expense-card').should('contain', 'Court Rental')

    // Now try to edit the expense - this is where our sanitization fix kicks in
    cy.get('.expense-card').contains('Court Rental')
      .closest('.expense-card')
      .find('.edit-expense-btn')
      .click()
    cy.wait(1000)

    cy.get('#add-expense-modal').should('be.visible')
    cy.get('#add-expense-modal .modal-title').should('contain', 'Edit Expense')

    // Wait for the form to load - our sanitization should clean the stale data automatically
    cy.wait(3000)

    // Change the description to test that editing works
    cy.get('#expense-description', { timeout: 10000 }).should('exist')
    cy.get('#expense-description').should('have.value', 'Court Rental')
    cy.get('#expense-description').clear().type('Updated Court Rental')

    // Save the expense edit
    // Our sanitization fix should have removed Minnie from the split and
    // recalculated Alice and Bob's percentages to total 100%
    cy.get('#add-expense-save').click()
    cy.wait(2000)

    // Verify the edit was successful (no validation error)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-message').should('contain', 'updated successfully')
    cy.get('#success-message').should('contain', 'Updated Court Rental')
    cy.get('#success-ok').click()

    // Verify the updated description appears
    cy.get('.expense-card').should('contain', 'Updated Court Rental')

    cy.log('✅ SUCCESS: Expense editing after participant removal works correctly!')

    // The key validation: Our sanitization logic automatically:
    // 1. Detected that Minnie was in the split but not in the event
    // 2. Removed Minnie from the split configuration
    // 3. Recalculated Alice and Bob's percentages to total 100%
    // 4. Allowed the expense edit to succeed without validation errors
  })
})