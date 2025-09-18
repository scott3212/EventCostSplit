describe('Expense Edit After Participant Removal', () => {
  beforeEach(() => {
    // Clear application data and navigate to events
    cy.clearApplicationData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should allow editing expense after removing participant from event', () => {
    // Create users through custom commands
    cy.createUser({ name: 'Alice Test', email: 'alice@test.com', phone: '+1111111111' }).as('alice')
    cy.createUser({ name: 'Bob Test', email: 'bob@test.com', phone: '+2222222222' }).as('bob')
    cy.createUser({ name: 'Minnie Test', email: 'minnie@test.com', phone: '+4444444444' }).as('minnie')

    // Get the created users and create event
    cy.get('@alice').then((alice) => {
      cy.get('@bob').then((bob) => {
        cy.get('@minnie').then((minnie) => {

          // Create event with all participants
          const eventData = {
            name: 'Test Event for Participant Removal',
            date: '2025-12-25',
            location: 'Test Location',
            participants: [alice.id, bob.id, minnie.id]
          }

          cy.createEvent(eventData).then((event) => {
            // Create expense with all participants via API
            const expenseData = {
              eventId: event.id,
              description: 'Court Rental',
              amount: 100,
              paidBy: alice.id,
              date: '2025-12-25',
              splitPercentage: {
                [alice.id]: 33.33,
                [bob.id]: 33.33,
                [minnie.id]: 33.34  // Minnie is in the split
              }
            }

            cy.createExpense(expenseData).then((expense) => {
              // Step 1: First remove Minnie from the expense split by editing it to 0%
              // This allows us to then remove her from the event
              const updatedExpenseData = {
                ...expenseData,
                splitPercentage: {
                  [alice.id]: 50,
                  [bob.id]: 50,
                  [minnie.id]: 0  // Set Minnie to 0% so she can be removed from event
                }
              }

              cy.request('PUT', `/api/cost-items/${expense.id}`, updatedExpenseData).then(() => {

                // Step 2: Now remove Minnie from the event (this should work now)
                cy.request('PUT', `/api/events/${event.id}`, {
                  name: eventData.name,
                  date: eventData.date,
                  location: eventData.location,
                  participants: [alice.id, bob.id] // Remove Minnie from event
                }).then(() => {

                  // Step 3: Force stale data into the expense (simulate the bug scenario)
                  // Add Minnie back to the split but she's no longer in the event
                  const staleExpenseData = {
                    eventId: event.id,
                    description: 'Court Rental',
                    amount: 100,
                    paidBy: alice.id,
                    date: '2025-12-25',
                    splitPercentage: {
                      [alice.id]: 33.33,
                      [bob.id]: 33.33,
                      [minnie.id]: 33.34  // Minnie back in split but not in event
                    }
                  }

                  // Use the test endpoint to force stale data bypassing validation
                  cy.request('POST', '/api/test/force-update-expense', {
                    expenseId: expense.id,
                    expenseData: staleExpenseData
                  }).then(() => {

                    // Navigate to event detail page
                    cy.visit('/')
                    cy.wait(500)
                    cy.get('[data-page="events"]').click()
                    cy.wait(1000)
                    cy.get('.event-card').contains(eventData.name).click()
                    cy.wait(1000)

                    // Verify we're on the event detail page
                    cy.get('#event-detail-page').should('be.visible')
                    cy.get('h1').should('contain', eventData.name)

                    // The expense should appear (with stale split data including removed Minnie)
                    cy.get('.expense-card').should('contain', 'Court Rental')

                    // Now try to edit the expense description
                    // This is where our sanitization fix should kick in
                    cy.get('.expense-card').first().find('.edit-expense-btn').click()
                    cy.wait(1000)

                    // Change the description
                    cy.get('#expense-description').should('be.visible')
                    cy.get('#expense-description').clear().type('Updated Court Rental')

                    // Save the expense edit
                    // Our sanitization fix should automatically remove Minnie from the split
                    cy.get('#add-expense-save').click()
                    cy.wait(2000)

                    // Verify the edit was successful (no validation error)
                    cy.get('#success-modal').should('be.visible')
                    cy.get('#success-message').should('contain', 'updated successfully')
                    cy.get('#success-ok').click()

                    // Verify the updated description appears
                    cy.get('.expense-card').should('contain', 'Updated Court Rental')
                  })
                })
              })
            })
          })
        })
      })
    })
  })
})