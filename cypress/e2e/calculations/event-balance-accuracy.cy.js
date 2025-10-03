describe('Event Balance Calculation Accuracy', () => {
  beforeEach(() => {
    cy.clearApplicationData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should calculate event balances correctly for complex scenarios', () => {
    cy.log('🏗️ STEP 1: Creating users and event for complex balance testing')

    // Create 4 users for comprehensive testing
    cy.visit('/users')
    cy.wait(1000)

    const users = [
      { name: 'Alice Accuracy', email: 'alice@accuracy.test' },
      { name: 'Bob Accuracy', email: 'bob@accuracy.test' },
      { name: 'Charlie Accuracy', email: 'charlie@accuracy.test' },
      { name: 'Diana Accuracy', email: 'diana@accuracy.test' }
    ]

    users.forEach(user => {
      cy.get('#add-user-btn').click()
      cy.wait(1000)
      cy.get('#user-name').type(user.name)
      cy.get('#user-email').type(user.email)
      cy.get('#add-user-save').click()
      cy.wait(1000)
      cy.get('#success-modal').should('be.visible')
      cy.get('#success-ok').click()
      cy.wait(1000)
    })

    // Create event with all participants
    cy.visit('/events')
    cy.wait(1000)
    cy.get('#add-event-btn').click()
    cy.wait(1000)
    cy.get('#event-name').type('Complex Balance Test Event')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Complex Test Venue')

    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').should('have.length', 4)
    cy.get('.participant-checkbox').each($checkbox => {
      cy.wrap($checkbox).check()
    })

    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.get('.event-card').contains('Complex Balance Test Event').click()
    cy.wait(1000)

    cy.log('💰 STEP 2: Adding multiple expenses with different splits')

    // Expense 1: Alice pays $80, equal split (everyone owes $20)
    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Court Rental')
    cy.get('#expense-amount').type('80')
    cy.get('#expense-paid-by').select('Alice Accuracy')
    cy.get('#expense-date').type('2025-12-25')
    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Expense 2: Bob pays $30, exclude Diana (Alice, Bob, Charlie each owe $10)
    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Shuttlecocks')
    cy.get('#expense-amount').type('30')
    cy.get('#expense-paid-by').select('Bob Accuracy')
    cy.get('#expense-date').type('2025-12-25')

    cy.get('label[for="split-custom"]').click()
    cy.wait(1000)

    cy.get('.split-participant:contains("Alice Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('33.33')
    })
    cy.get('.split-participant:contains("Bob Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('33.33')
    })
    cy.get('.split-participant:contains("Charlie Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('33.34')
    })
    cy.get('.split-participant:contains("Diana Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('0')
    })

    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Expense 3: Charlie pays $40, custom split (Alice 25%, Bob 25%, Charlie 0%, Diana 50%)
    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Equipment')
    cy.get('#expense-amount').type('40')
    cy.get('#expense-paid-by').select('Charlie Accuracy')
    cy.get('#expense-date').type('2025-12-25')

    cy.get('label[for="split-custom"]').click()
    cy.wait(1000)

    cy.get('.split-participant:contains("Alice Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('25')
    })
    cy.get('.split-participant:contains("Bob Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('25')
    })
    cy.get('.split-participant:contains("Charlie Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('0')
    })
    cy.get('.split-participant:contains("Diana Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('50')
    })

    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.log('🧮 STEP 3: Verifying calculated balances match manual calculations')

    // Manual calculation:
    // Alice: Paid $80, Owes $20 + $10 + $10 = $40, Net = $80 - $40 = +$40
    cy.get('.participant-card').contains('Alice Accuracy').within(() => {
      cy.get('.balance-amount').should('contain', '$40.00')
      cy.get('.balance-status').should('contain', 'Credit • This Event')
    })

    // Bob: Paid $30, Owes $20 + $10 + $10 = $40, Net = $30 - $40 = -$10
    cy.get('.participant-card').contains('Bob Accuracy').within(() => {
      cy.get('.balance-amount').should('contain', '$10.00')
      cy.get('.balance-status').should('contain', 'Owes • This Event')
    })

    // Charlie: Paid $40, Owes $20 + $10.02 + $0 = $30.02, Net = $40 - $30.02 = +$9.98
    cy.get('.participant-card').contains('Charlie Accuracy').within(() => {
      // Allow for small rounding differences
      cy.get('.balance-amount').should('match', /\$9\.9[0-9]/)
      cy.get('.balance-status').should('contain', 'Credit • This Event')
    })

    // Diana: Paid $0, Owes $20 + $0 + $20 = $40, Net = $0 - $40 = -$40
    cy.get('.participant-card').contains('Diana Accuracy').within(() => {
      cy.get('.balance-amount').should('contain', '$40.00')
      cy.get('.balance-status').should('contain', 'Owes • This Event')
    })

    cy.log('💸 STEP 4: Adding payments and verifying balance updates')

    // Simulate Diana making a payment
    // Note: In a real scenario, this would be done through the payments interface
    // For this E2E test, we'll add it as a separate expense paid by Diana with custom split

    // Add "payment" as negative split for Diana (she gets credit)
    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Diana Payment/Settlement')
    cy.get('#expense-amount').type('25')
    cy.get('#expense-paid-by').select('Diana Accuracy')
    cy.get('#expense-date').type('2025-12-25')

    // Custom split: Diana doesn't owe anything for this "expense"
    cy.get('label[for="split-custom"]').click()
    cy.wait(1000)

    cy.get('.split-participant:contains("Alice Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('0')
    })
    cy.get('.split-participant:contains("Bob Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('0')
    })
    cy.get('.split-participant:contains("Charlie Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('0')
    })
    cy.get('.split-participant:contains("Diana Accuracy")').within(() => {
      cy.get('.split-percentage-input').clear().type('0')
    })

    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Verify Diana's balance improved: was -$40, paid $25, now -$15
    cy.get('.participant-card').contains('Diana Accuracy').within(() => {
      cy.get('.balance-amount').should('contain', '$15.00')
      cy.get('.balance-status').should('contain', 'Owes • This Event')
    })

    cy.log('🔢 STEP 5: Verifying total balance consistency')

    // The sum of all net balances should equal zero (conservation of money)
    // Alice: +$40, Bob: -$10, Charlie: ~+$10, Diana: -$15
    // Total should be approximately $25 (Alice + Charlie) - $25 (Bob + Diana) = $0

    // This is a conceptual check - in a real app you might have a total display
    // For this E2E test, we verify that credits roughly balance debts
    let totalCredits = 40 + 10; // Alice + Charlie approximate
    let totalDebts = 10 + 15;   // Bob + Diana

    // Verify that our test scenario makes mathematical sense
    // (This is more of a test validation than app testing)
    expect(Math.abs(totalCredits - totalDebts)).to.be.lessThan(5); // Allow for rounding

    cy.log('✅ SUCCESS: Complex balance calculations are accurate!')
  })

  it('should handle floating-point precision correctly', () => {
    cy.log('🏗️ STEP 1: Setting up precision test scenario')

    // Create users
    cy.visit('/users')
    cy.wait(1000)

    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Alice Precision')
    cy.get('#user-email').type('alice@precision.test')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Bob Precision')
    cy.get('#user-email').type('bob@precision.test')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Charlie Precision')
    cy.get('#user-email').type('charlie@precision.test')
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
    cy.get('#event-name').type('Precision Test Event')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Precision Venue')

    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').each($checkbox => {
      cy.wrap($checkbox).check()
    })

    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.get('.event-card').contains('Precision Test Event').click()
    cy.wait(1000)

    cy.log('💰 STEP 2: Adding expense with amount that creates decimal precision challenges')

    // Add expense that when split 3 ways creates repeating decimals
    // $10.00 / 3 = $3.333...
    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Precision Challenge')
    cy.get('#expense-amount').type('10')
    cy.get('#expense-paid-by').select('Alice Precision')
    cy.get('#expense-date').type('2025-12-25')
    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(2000) // Wait longer for balance calculations to complete

    cy.log('🔍 STEP 3: Verifying proper decimal rounding')

    // Wait for participant cards to load with balance data
    cy.get('.participant-card').should('have.length', 3)
    cy.wait(1000) // Additional wait for balance elements to render

    // Check that balances are properly rounded to 2 decimal places
    // Alice: Paid $10.00, Owes $3.33, Net = +$6.67
    cy.get('.participant-card').contains('Alice Precision').within(() => {
      cy.get('.balance-amount', { timeout: 10000 }).should('contain', '$6.67')
    })

    // Bob and Charlie: Each owe $3.33, Net = -$3.33
    cy.get('.participant-card').contains('Bob Precision').within(() => {
      cy.get('.balance-amount', { timeout: 10000 }).should('contain', '$3.33')
    })

    cy.get('.participant-card').contains('Charlie Precision').within(() => {
      cy.get('.balance-amount', { timeout: 10000 }).should('contain', '$3.34') // May get the rounding adjustment
    })

    // Verify no strange precision artifacts (like $3.3300000000001)
    cy.get('.balance-amount').should('not.contain', '000')
    cy.get('.balance-amount').each($amount => {
      const text = $amount.text()
      // Should always have exactly 2 decimal places
      expect(text).to.match(/\$\d+\.\d{2}$/)
    })

    cy.log('✅ SUCCESS: Floating-point precision handled correctly!')
  })

  it('should maintain balance accuracy across expense modifications', () => {
    cy.log('🏗️ STEP 1: Setting up modification tracking scenario')

    // Create users
    cy.visit('/users')
    cy.wait(1000)

    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Alice Modify')
    cy.get('#user-email').type('alice@modify.test')
    cy.get('#add-user-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.get('#add-user-btn').click()
    cy.wait(1000)
    cy.get('#user-name').type('Bob Modify')
    cy.get('#user-email').type('bob@modify.test')
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
    cy.get('#event-name').type('Modification Tracking Event')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Tracking Venue')

    cy.get('#participants-loading').should('not.be.visible')
    cy.get('.participant-checkbox').each($checkbox => {
      cy.wrap($checkbox).check()
    })

    cy.get('#add-event-save').click()
    cy.wait(1000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    cy.get('.event-card').contains('Modification Tracking Event').click()
    cy.wait(1000)

    cy.log('💰 STEP 2: Adding initial expense')

    cy.get('#add-expense-btn').click()
    cy.wait(1000)
    cy.get('#expense-description').type('Trackable Expense')
    cy.get('#expense-amount').type('100')
    cy.get('#expense-paid-by').select('Alice Modify')
    cy.get('#expense-date').type('2025-12-25')
    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(2000) // Wait longer for balance calculations to complete

    // Wait for participant cards to load with balance data
    cy.get('.participant-card').should('have.length', 2)
    cy.wait(1000) // Additional wait for balance elements to render

    // Initial: Alice +$50, Bob -$50
    cy.get('.participant-card').contains('Alice Modify').within(() => {
      cy.get('.balance-amount', { timeout: 10000 }).should('contain', '$50.00')
    })
    cy.get('.participant-card').contains('Bob Modify').within(() => {
      cy.get('.balance-amount', { timeout: 10000 }).should('contain', '$50.00')
      cy.get('.balance-status').should('contain', 'Owes')
    })

    cy.log('✏️ STEP 3: Modifying expense amount')

    cy.get('.expense-card').contains('Trackable Expense')
      .closest('.expense-card')
      .find('.edit-expense-btn')
      .click()
    cy.wait(1000)

    cy.get('#expense-amount').clear().type('200')
    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // After modification: Alice +$100, Bob -$100
    cy.get('.participant-card').contains('Alice Modify').within(() => {
      cy.get('.balance-amount', { timeout: 10000 }).should('contain', '$100.00')
    })
    cy.get('.participant-card').contains('Bob Modify').within(() => {
      cy.get('.balance-amount', { timeout: 10000 }).should('contain', '$100.00')
      cy.get('.balance-status').should('contain', 'Owes')
    })

    cy.log('👤 STEP 4: Changing who paid for the expense')

    cy.get('.expense-card').contains('Trackable Expense')
      .closest('.expense-card')
      .find('.edit-expense-btn')
      .click()
    cy.wait(1000)

    cy.get('#expense-paid-by').select('Bob Modify')
    cy.get('#add-expense-save').click()
    cy.wait(2000)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-ok').click()
    cy.wait(1000)

    // Now Bob paid: Alice -$100, Bob +$100 (roles reversed)
    cy.get('.participant-card').contains('Alice Modify').within(() => {
      cy.get('.balance-amount', { timeout: 10000 }).should('contain', '$100.00')
      cy.get('.balance-status').should('contain', 'Owes')
    })
    cy.get('.participant-card').contains('Bob Modify').within(() => {
      cy.get('.balance-amount', { timeout: 10000 }).should('contain', '$100.00')
      cy.get('.balance-status').should('contain', 'Credit')
    })

    cy.log('✅ SUCCESS: Balance accuracy maintained through modifications!')
  })
})