describe('Balance Display Debug', () => {
  beforeEach(() => {
    cy.clearApplicationData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should display balance amounts in participant cards', () => {
    cy.log('🔍 Creating simple test scenario to debug balance display')

    // Create 2 users
    cy.visit('/users')
    cy.wait(1000)

    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Alice Debug')
    cy.get('#user-email').type('alice@debug.test')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Bob Debug')
    cy.get('#user-email').type('bob@debug.test')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Create event
    cy.visit('/events')
    cy.wait(1000)
    cy.get('#add-event-btn').click()
    cy.wait(1000)
    cy.get('#event-name').type('Debug Event')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Debug Venue')

    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').should('have.length', 2)
    cy.get('.participant-checkbox').each($checkbox => {
      cy.wrap($checkbox).check()
    })

    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Navigate to event detail
    cy.get('.event-card').contains('Debug Event').click()
    cy.wait(1000)

    // Debug: Check what participant cards exist
    cy.get('.participant-card').should('exist')
    cy.log('🔍 Found participant cards, checking structure...')

    // Debug: Log the HTML content of participant cards
    cy.get('.participant-card').then($cards => {
      cy.log(`Found ${$cards.length} participant cards`)
      $cards.each((index, card) => {
        cy.log(`Card ${index}: ${card.outerHTML}`)
      })
    })

    // Add a simple expense
    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Debug Expense')
    cy.get('#expense-amount').type('10')
    cy.get('#expense-paid-by').select('Alice Debug')
    cy.get('#expense-date').type('2025-12-25')
    cy.get('#add-expense-save').click()
    cy.wait(3000) // Wait longer for balance calculation

    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(2000) // Wait for page to refresh with new balance data

    // Debug: Check participant cards after expense
    cy.log('🔍 Checking participant cards after expense creation...')
    cy.get('.participant-card').should('exist')

    // Debug: Log the HTML content again
    cy.get('.participant-card').then($cards => {
      cy.log(`Found ${$cards.length} participant cards after expense`)
      $cards.each((index, card) => {
        cy.log(`Card ${index} after expense: ${card.outerHTML}`)
      })
    })

    // Try to find balance elements
    cy.get('.participant-card').first().within(() => {
      cy.log('🔍 Looking for balance elements in first participant card...')

      // Check if balance-amount exists
      cy.get('body').then($body => {
        const hasBalanceAmount = $body.find('.balance-amount').length > 0
        cy.log(`Has .balance-amount: ${hasBalanceAmount}`)

        const hasParticipantBalance = $body.find('.participant-balance').length > 0
        cy.log(`Has .participant-balance: ${hasParticipantBalance}`)

        // Log all classes in the card
        const allElements = $body.find('*').get()
        allElements.forEach((el, i) => {
          if (el.className) {
            cy.log(`Element ${i}: ${el.tagName}.${el.className}`)
          }
        })
      })
    })
  })
})