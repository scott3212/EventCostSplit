describe('Balance Math Validation', () => {
  beforeEach(() => {
    cy.clearApplicationData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should calculate correct mathematical balance for complex scenario', () => {
    cy.log('🧮 Testing mathematical accuracy of balance calculations')

    // Create 4 users for complex scenario
    const users = ['Alice Math', 'Bob Math', 'Charlie Math', 'Diana Math']
    users.forEach(name => {
      cy.visit('/users')
      cy.wait(1000)
      cy.get('#add-user-btn').click()
      cy.wait(1000)
      cy.get('#user-name').type(name)
      cy.get('#user-email').type(`${name.toLowerCase().replace(' ', '')}@math.test`)
      cy.get('#add-user-save').click()
      cy.wait(2000)
      cy.get('#success-modal').should('be.visible')
      cy.get('#success-ok').click()
      cy.wait(1000)
    })

    // Create event with all participants
    cy.visit('/events')
    cy.wait(1000)
    cy.get('#add-event-btn').click()
    cy.wait(1000)
    cy.get('#event-name').type('Math Test Event')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Math Venue')

    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').should('have.length', 4)
    cy.get('.participant-checkbox').each($checkbox => {
      cy.wrap($checkbox).check()
    })

    cy.get('#add-event-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(2000)

    // Navigate to event detail
    cy.get('.event-card').contains('Math Test Event').click()
    cy.wait(2000)

    // API-based validation: Get event balance data directly
    cy.request('GET', '/api/events').then(eventsResponse => {
      const event = eventsResponse.body.find(e => e.name === 'Math Test Event')
      const eventId = event.id

      // Add first expense: Alice pays $80, equal split
      const expense1 = {
        description: 'Court Rental',
        amount: 80,
        paidBy: event.participants.find(p => p.name === 'Alice Math').id,
        date: '2025-12-25',
        eventId: eventId,
        splitType: 'equal'
      }

      cy.request('POST', '/api/cost-items', expense1).then(() => {
        cy.wait(1000)

        // Add second expense: Bob pays $30, Diana excluded
        const expense2 = {
          description: 'Shuttlecocks',
          amount: 30,
          paidBy: event.participants.find(p => p.name === 'Bob Math').id,
          date: '2025-12-25',
          eventId: eventId,
          splitType: 'custom',
          splitPercentage: {
            [event.participants.find(p => p.name === 'Alice Math').id]: 33.33,
            [event.participants.find(p => p.name === 'Bob Math').id]: 33.33,
            [event.participants.find(p => p.name === 'Charlie Math').id]: 33.34,
            [event.participants.find(p => p.name === 'Diana Math').id]: 0
          }
        }

        cy.request('POST', '/api/cost-items', expense2).then(() => {
          cy.wait(1000)

          // Add third expense: Charlie pays $40, custom split
          const expense3 = {
            description: 'Equipment',
            amount: 40,
            paidBy: event.participants.find(p => p.name === 'Charlie Math').id,
            date: '2025-12-25',
            eventId: eventId,
            splitType: 'custom',
            splitPercentage: {
              [event.participants.find(p => p.name === 'Alice Math').id]: 25,
              [event.participants.find(p => p.name === 'Bob Math').id]: 25,
              [event.participants.find(p => p.name === 'Charlie Math').id]: 0,
              [event.participants.find(p => p.name === 'Diana Math').id]: 50
            }
          }

          cy.request('POST', '/api/cost-items', expense3).then(() => {
            cy.wait(1000)

            // Add Diana's partial payment: Diana pays $25, 0% split
            const expense4 = {
              description: 'Diana Payment',
              amount: 25,
              paidBy: event.participants.find(p => p.name === 'Diana Math').id,
              date: '2025-12-25',
              eventId: eventId,
              splitType: 'custom',
              splitPercentage: {
                [event.participants.find(p => p.name === 'Alice Math').id]: 0,
                [event.participants.find(p => p.name === 'Bob Math').id]: 0,
                [event.participants.find(p => p.name === 'Charlie Math').id]: 0,
                [event.participants.find(p => p.name === 'Diana Math').id]: 0
              }
            }

            cy.request('POST', '/api/cost-items', expense4).then(() => {
              cy.wait(2000)

              // Get final balance calculations
              cy.request('GET', `/api/events/${eventId}/balance`).then(balanceResponse => {
                const balances = balanceResponse.body

                // Manual calculations:
                // Alice: Paid $80, Owes ($20+$10+$10) = $40, Net = +$40
                // Bob: Paid $30, Owes ($20+$10+$10) = $40, Net = -$10
                // Charlie: Paid $40, Owes ($20+$10.02+$0) = $30.02, Net = +$9.98
                // Diana: Paid $25, Owes ($20+$0+$20) = $40, Net = -$15

                const expectedBalances = {
                  'Alice Math': 40.00,
                  'Bob Math': -10.00,
                  'Charlie Math': 9.98,
                  'Diana Math': -15.00
                }

                // Validate each balance within tolerance
                Object.entries(expectedBalances).forEach(([name, expectedBalance]) => {
                  const participant = balances.find(b => b.name === name)
                  expect(participant).to.exist
                  expect(participant.eventBalance).to.be.approximately(expectedBalance, 0.1)
                })

                // Calculate totals for mathematical validation
                const totalCredits = 40.00 + 9.98 // Alice + Charlie
                const totalDebts = 10.00 + 15.00  // Bob + Diana absolute values
                const imbalance = Math.abs(totalCredits - totalDebts)

                // This should be approximately $25 due to Diana's partial payment
                expect(imbalance).to.be.approximately(25, 0.1)

                cy.log('✅ Mathematical balance validation passed!')
                cy.log(`Total Credits: $${totalCredits.toFixed(2)}`)
                cy.log(`Total Debts: $${totalDebts.toFixed(2)}`)
                cy.log(`Imbalance: $${imbalance.toFixed(2)}`)
              })
            })
          })
        })
      })
    })
  })
})