describe('Event Participant Balance Display', () => {
  beforeEach(() => {
    cy.clearApplicationData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should display event-specific balances for participants', () => {
    cy.log('🏗️ STEP 1: Creating test users and event')

    // Create test users
    cy.visit('/users')
    cy.wait(1000)

    // Create Alice
    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Alice Balance Test')
    cy.get('#user-email').type('alice@balance.test')
    cy.get('#user-phone').type('+1111111111')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Create Bob
    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Bob Balance Test')
    cy.get('#user-email').type('bob@balance.test')
    cy.get('#user-phone').type('+2222222222')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Create Charlie
    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Charlie Balance Test')
    cy.get('#user-email').type('charlie@balance.test')
    cy.get('#user-phone').type('+3333333333')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Verify all users created
    cy.get('.user-card').should('have.length', 3)

    // Create event with all participants
    cy.visit('/events')
    cy.wait(1000)

    cy.get('#add-event-btn').click()
    cy.wait(1000)
    cy.get('#event-name').type('Balance Display Test Event')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Test Venue')
    cy.get('#event-description').type('Event for testing balance display')

    // Select all participants
    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').should('have.length', 3)
    cy.get('.participant-checkbox').each($checkbox => {
      cy.wrap($checkbox).check()
    })

    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Navigate to event detail
    cy.get('.event-card').contains('Balance Display Test Event').click()
    cy.wait(1000)

    cy.log('💰 STEP 2: Adding expenses to create different balance scenarios')

    // Add first expense - Alice pays $60, split equally
    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Court Rental')
    cy.get('#expense-amount').type('60')
    cy.get('#expense-paid-by').select('Alice Balance Test')
    cy.get('#expense-date').type('2025-12-25')
    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Add second expense - Bob pays $30, exclude Alice
    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Shuttlecocks')
    cy.get('#expense-amount').type('30')
    cy.get('#expense-paid-by').select('Bob Balance Test')
    cy.get('#expense-date').type('2025-12-25')

    // Use custom split to exclude Alice
    cy.get('label[for="split-custom"]').click()
    cy.wait(1000)

    // Set percentages: Alice 0%, Bob 50%, Charlie 50%
    cy.get('.split-participant:contains("Alice Balance Test")').within(() => {
      cy.get('.split-percentage-input').clear().type('0')
    })
    cy.get('.split-participant:contains("Bob Balance Test")').within(() => {
      cy.get('.split-percentage-input').clear().type('50')
    })
    cy.get('.split-participant:contains("Charlie Balance Test")').within(() => {
      cy.get('.split-percentage-input').clear().type('50')
    })

    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.log('📊 STEP 3: Verifying event-specific balance display')

    // Verify participants section shows event-specific balances
    cy.get('#event-participants-list').should('be.visible')
    cy.get('.participant-card').should('have.length', 3)

    // Alice: paid $60, owes $20, net = +$40
    cy.get('.participant-card').contains('Alice Balance Test').as('aliceCard')
    cy.get('@aliceCard').within(() => {
      cy.get('.balance-amount').should('contain', '$40.00')
      cy.get('.balance-status').should('contain', 'Credit • This Event')
    })

    // Bob: paid $30, owes $35 ($20 + $15), net = -$5
    cy.get('.participant-card').contains('Bob Balance Test').as('bobCard')
    cy.get('@bobCard').within(() => {
      cy.get('.balance-amount').should('contain', '$5.00')
      cy.get('.balance-status').should('contain', 'Owes • This Event')
    })

    // Charlie: paid $0, owes $35 ($20 + $15), net = -$35
    cy.get('.participant-card').contains('Charlie Balance Test').as('charlieCard')
    cy.get('@charlieCard').within(() => {
      cy.get('.balance-amount').should('contain', '$35.00')
      cy.get('.balance-status').should('contain', 'Owes • This Event')
    })

    // Verify context labels are present
    cy.get('.balance-status').should('contain', 'This Event')
    cy.get('.balance-status').should('not.contain', 'Overall')

    cy.log('✅ SUCCESS: Event-specific balances displayed correctly!')
  })

  it('should distinguish between event and global balances across multiple events', () => {
    cy.log('🏗️ STEP 1: Setting up multi-event scenario')

    // Create users
    cy.visit('/users')
    cy.wait(1000)

    // Create Alice
    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Alice Multi Event')
    cy.get('#user-email').type('alice@multi.test')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Create Bob
    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Bob Multi Event')
    cy.get('#user-email').type('bob@multi.test')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.log('📅 STEP 2: Creating first event with specific balance')

    // Create first event
    cy.visit('/events')
    cy.wait(1000)
    cy.get('#add-event-btn').click()
    cy.wait(1000)
    cy.get('#event-name').type('Event 1 - Multi Test')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Venue 1')

    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').each($checkbox => {
      cy.wrap($checkbox).check()
    })

    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Go to event 1 detail and add expense
    cy.get('.event-card').contains('Event 1 - Multi Test').click()
    cy.wait(1000)

    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Event 1 Expense')
    cy.get('#expense-amount').type('40')
    cy.get('#expense-paid-by').select('Alice Multi Event')
    cy.get('#expense-date').type('2025-12-25')
    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Verify Event 1 balances: Alice +$20, Bob -$20
    cy.get('.participant-card').contains('Alice Multi Event').within(() => {
      cy.get('.balance-amount').should('contain', '$20.00')
      cy.get('.balance-status').should('contain', 'Credit • This Event')
    })

    cy.get('.participant-card').contains('Bob Multi Event').within(() => {
      cy.get('.balance-amount').should('contain', '$20.00')
      cy.get('.balance-status').should('contain', 'Owes • This Event')
    })

    cy.log('📅 STEP 3: Creating second event with different balance')

    // Create second event
    cy.visit('/events')
    cy.wait(1000)
    cy.get('#add-event-btn').click()
    cy.wait(1000)
    cy.get('#event-name').type('Event 2 - Multi Test')
    cy.get('#event-date').type('2025-12-26')
    cy.get('#event-location').type('Venue 2')

    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').each($checkbox => {
      cy.wrap($checkbox).check()
    })

    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Go to event 2 detail and add expense (Bob pays this time)
    cy.get('.event-card').contains('Event 2 - Multi Test').click()
    cy.wait(1000)

    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Event 2 Expense')
    cy.get('#expense-amount').type('60')
    cy.get('#expense-paid-by').select('Bob Multi Event')
    cy.get('#expense-date').type('2025-12-26')
    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Verify Event 2 balances: Alice -$30, Bob +$30
    cy.get('.participant-card').contains('Alice Multi Event').within(() => {
      cy.get('.balance-amount').should('contain', '$30.00')
      cy.get('.balance-status').should('contain', 'Owes • This Event')
    })

    cy.get('.participant-card').contains('Bob Multi Event').within(() => {
      cy.get('.balance-amount').should('contain', '$30.00')
      cy.get('.balance-status').should('contain', 'Credit • This Event')
    })

    cy.log('🔄 STEP 4: Verifying balance changes when switching events')

    // Go back to Event 1
    cy.visit('/events')
    cy.wait(1000)
    cy.get('.event-card').contains('Event 1 - Multi Test').click()
    cy.wait(1000)

    // Verify Event 1 balances are still the same (event-specific)
    cy.get('.participant-card').contains('Alice Multi Event').within(() => {
      cy.get('.balance-amount').should('contain', '$20.00')
      cy.get('.balance-status').should('contain', 'Credit • This Event')
    })

    cy.get('.participant-card').contains('Bob Multi Event').within(() => {
      cy.get('.balance-amount').should('contain', '$20.00')
      cy.get('.balance-status').should('contain', 'Owes • This Event')
    })

    // Go back to Event 2
    cy.visit('/events')
    cy.wait(1000)
    cy.get('.event-card').contains('Event 2 - Multi Test').click()
    cy.wait(1000)

    // Verify Event 2 balances are still the same
    cy.get('.participant-card').contains('Alice Multi Event').within(() => {
      cy.get('.balance-amount').should('contain', '$30.00')
      cy.get('.balance-status').should('contain', 'Owes • This Event')
    })

    cy.get('.participant-card').contains('Bob Multi Event').within(() => {
      cy.get('.balance-amount').should('contain', '$30.00')
      cy.get('.balance-status').should('contain', 'Credit • This Event')
    })

    cy.log('✅ SUCCESS: Event-specific balances correctly separated across events!')
  })

  it('should handle events with no expenses gracefully', () => {
    cy.log('🏗️ STEP 1: Creating event with no expenses')

    // Create user
    cy.visit('/users')
    cy.wait(1000)
    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Alice Empty Event')
    cy.get('#user-email').type('alice@empty.test')
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
    cy.get('#event-name').type('Empty Event Test')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Test Venue')

    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').check()

    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Navigate to event detail
    cy.get('.event-card').contains('Empty Event Test').click()
    cy.wait(1000)

    cy.log('📊 STEP 2: Verifying zero balance display')

    // Verify participant shows settled balance
    cy.get('.participant-card').contains('Alice Empty Event').within(() => {
      cy.get('.balance-amount').should('contain', '$0.00')
      cy.get('.balance-status').should('contain', 'Settled • This Event')
    })

    cy.log('✅ SUCCESS: Empty event balance handling works correctly!')
  })

  it('should update balances when expenses are modified', () => {
    cy.log('🏗️ STEP 1: Setting up initial scenario')

    // Create users and event (using simplified setup)
    cy.visit('/users')
    cy.wait(1000)

    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Alice Dynamic Test')
    cy.get('#user-email').type('alice@dynamic.test')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Bob Dynamic Test')
    cy.get('#user-email').type('bob@dynamic.test')
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
    cy.get('#event-name').type('Dynamic Balance Test')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Test Venue')

    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').each($checkbox => {
      cy.wrap($checkbox).check()
    })

    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.get('.event-card').contains('Dynamic Balance Test').click()
    cy.wait(1000)

    cy.log('💰 STEP 2: Adding initial expense')

    // Add expense: Alice pays $50
    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Initial Expense')
    cy.get('#expense-amount').type('50')
    cy.get('#expense-paid-by').select('Alice Dynamic Test')
    cy.get('#expense-date').type('2025-12-25')
    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Verify initial balances: Alice +$25, Bob -$25
    cy.get('.participant-card').contains('Alice Dynamic Test').within(() => {
      cy.get('.balance-amount').should('contain', '$25.00')
      cy.get('.balance-status').should('contain', 'Credit • This Event')
    })

    cy.log('✏️ STEP 3: Modifying expense amount')

    // Edit the expense to change amount
    cy.get('.expense-card').contains('Initial Expense')
      .closest('.expense-card')
      .find('.edit-expense-btn')
      .click()
    cy.wait(1000)

    cy.get('#expense-amount').clear().type('100')
    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Verify updated balances: Alice +$50, Bob -$50
    cy.get('.participant-card').contains('Alice Dynamic Test').within(() => {
      cy.get('.balance-amount').should('contain', '$50.00')
      cy.get('.balance-status').should('contain', 'Credit • This Event')
    })

    cy.get('.participant-card').contains('Bob Dynamic Test').within(() => {
      cy.get('.balance-amount').should('contain', '$50.00')
      cy.get('.balance-status').should('contain', 'Owes • This Event')
    })

    cy.log('✅ SUCCESS: Balances update correctly when expenses are modified!')
  })
})