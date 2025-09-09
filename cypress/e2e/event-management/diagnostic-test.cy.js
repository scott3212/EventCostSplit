describe('Diagnostic Test - Step by Step', () => {
  it('should diagnose where the test breaks', () => {
    // Clear data
    cy.clearApplicationData()
    console.log('✓ Data cleared')
    
    // Visit home page
    cy.visit('/', { timeout: 30000 })
    cy.get('body').should('be.visible')
    console.log('✓ Home page loaded')
    
    // Create users
    cy.createUser({ name: 'Alice Test', email: 'alice@test.com' })
    cy.createUser({ name: 'Bob Test', email: 'bob@test.com' })
    console.log('✓ Users created')
    
    // Navigate to events page
    cy.visit('/events', { timeout: 30000 })
    console.log('✓ Navigated to events page')
    
    // Wait for page to be fully loaded
    cy.contains('Events', { timeout: 10000 }).should('be.visible')
    console.log('✓ Events heading visible')
    
    // Wait for any loading to complete
    cy.get('body').should('not.contain', 'Loading')
    console.log('✓ Loading completed')
    
    // Look for the Add Event button
    cy.get('#add-event-btn', { timeout: 10000 }).should('be.visible')
    console.log('✓ Add Event button found')
    
    // Click the Add Event button
    cy.get('#add-event-btn').click()
    console.log('✓ Clicked Add Event button')
    
    // Wait for modal to appear
    cy.get('#add-event-modal', { timeout: 10000 }).should('be.visible')
    console.log('✓ Modal appeared')
    
    // Check for form fields
    cy.get('#event-name').should('be.visible')
    cy.get('#event-date').should('be.visible')
    cy.get('#event-location').should('be.visible')
    console.log('✓ Form fields visible')
    
    // Wait for participants to load
    cy.get('#participants-loading').should('not.exist')
    console.log('✓ Participants loading completed')
    
    // Check for participants list
    cy.get('#participants-list').should('be.visible')
    console.log('✓ Participants list visible')
    
    // Look for participant items
    cy.get('.participant-item').should('have.length.at.least', 1)
    console.log('✓ Participant items found')
    
    // Try filling form
    cy.get('#event-name').clear().type('Diagnostic Test Event')
    cy.get('#event-date').clear().type('2025-12-25')
    cy.get('#event-location').clear().type('Test Location')
    console.log('✓ Form filled')
    
    // Try selecting a participant
    cy.get('.participant-item').first().click()
    console.log('✓ Participant selected')
    
    // Check if participant is selected
    cy.get('.participant-item').first().should('have.class', 'selected')
    console.log('✓ Participant selection confirmed')
    
    // Success!
    cy.log('🎉 All steps completed successfully!')
  })
})