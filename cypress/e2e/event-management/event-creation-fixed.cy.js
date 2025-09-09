describe('Event Creation - Fixed Implementation', () => {
  beforeEach(() => {
    // Clear application data before each test
    cy.clearApplicationData()
    cy.visit('/')
    
    // Create test users that will be needed for participant selection
    cy.createUser({
      name: 'Alice Test User',
      email: 'alice@test.com'
    })
    cy.createUser({
      name: 'Bob Test User', 
      email: 'bob@test.com'
    })
    cy.createUser({
      name: 'Charlie Test User',
      email: 'charlie@test.com'
    })
  })

  it('should create an event with proper participant selection', () => {
    // Navigate to events page  
    cy.visit('/events')
    cy.contains('Events').should('be.visible')
    
    // Open create event modal
    cy.get('#add-event-btn').should('be.visible').click()
    cy.get('#add-event-modal').should('be.visible')
    cy.get('#add-event-modal h3').should('contain', 'Create New Event')
    
    // Fill out the basic form fields
    cy.get('#event-name').should('be.visible').clear().type('Test Event Session')
    cy.get('#event-date').should('be.visible').clear().type('2025-12-25')
    cy.get('#event-location').should('be.visible').clear().type('Test Sports Center')
    cy.get('#event-description').should('be.visible').clear().type('A test event for validation')
    
    // Wait for participants to load completely
    cy.get('#participants-loading').should('not.exist')
    cy.get('#participants-list').should('be.visible')
    
    // Wait for participant items to appear and select participants
    cy.get('.participant-item').should('have.length.at.least', 1)
    
    // Select the first two participants by clicking on the items
    cy.get('.participant-item').first().click()
    cy.get('.participant-item').first().should('have.class', 'selected')
    cy.get('.participant-item').first().find('.participant-checkbox').should('be.checked')
    
    cy.get('.participant-item').eq(1).click()
    cy.get('.participant-item').eq(1).should('have.class', 'selected')
    cy.get('.participant-item').eq(1).find('.participant-checkbox').should('be.checked')
    
    // Verify selected participants section appears
    cy.get('#selected-participants').should('be.visible')
    cy.get('#selected-participants-list .selected-participant').should('have.length', 2)
    
    // Submit the form
    cy.get('#add-event-save').should('be.visible').click()
    
    // Wait for and verify success modal
    cy.get('#success-modal', { timeout: 10000 }).should('be.visible')
    cy.get('#success-message').should('contain', 'successfully')
    
    // Close success modal
    cy.get('#success-ok').click()
    cy.get('#success-modal').should('not.be.visible')
    
    // Verify the event appears in the events list
    cy.get('.event-card').should('contain', 'Test Event Session')
    cy.get('.event-card').should('contain', 'Test Sports Center')
    cy.get('.event-card').should('contain', '2 participants')
  })

  it('should validate required fields properly', () => {
    cy.visit('/events')
    cy.get('#add-event-btn').click()
    
    // Try to submit with empty form
    cy.get('#add-event-save').click()
    
    // Check that validation errors appear
    cy.get('#event-name-error').should('be.visible').should('contain', 'required')
    cy.get('#event-date-error').should('be.visible').should('contain', 'required')
    cy.get('#event-location-error').should('be.visible').should('contain', 'required')
    
    // Modal should remain open
    cy.get('#add-event-modal').should('be.visible')
  })

  it('should validate participant selection requirement', () => {
    cy.visit('/events')
    cy.get('#add-event-btn').click()
    
    // Fill out required text fields but don't select participants
    cy.get('#event-name').type('Test Event')
    cy.get('#event-date').type('2025-12-25')
    cy.get('#event-location').type('Test Location')
    
    // Wait for participants to load
    cy.get('#participants-loading').should('not.exist')
    cy.get('.participant-item').should('have.length.at.least', 1)
    
    // Try to submit without selecting participants
    cy.get('#add-event-save').click()
    
    // Should show participants error
    cy.get('#participants-error').should('be.visible').should('contain', 'participant')
    cy.get('#add-event-modal').should('be.visible')
  })

  it('should allow canceling event creation', () => {
    cy.visit('/events')
    cy.get('#add-event-btn').click()
    
    // Start filling form
    cy.get('#event-name').type('Test Event')
    
    // Cancel
    cy.get('#add-event-cancel').click()
    cy.get('#add-event-modal').should('not.be.visible')
    
    // Reopen and verify form is reset
    cy.get('#add-event-btn').click()
    cy.get('#event-name').should('have.value', '')
  })

  it('should handle participant selection/deselection correctly', () => {
    cy.visit('/events')
    cy.get('#add-event-btn').click()
    
    // Wait for participants to load
    cy.get('#participants-loading').should('not.exist')
    cy.get('.participant-item').should('have.length.at.least', 2)
    
    // Select first participant
    cy.get('.participant-item').first().click()
    cy.get('.participant-item').first().should('have.class', 'selected')
    cy.get('#selected-participants').should('be.visible')
    cy.get('#selected-participants-list .selected-participant').should('have.length', 1)
    
    // Select second participant
    cy.get('.participant-item').eq(1).click()
    cy.get('.participant-item').eq(1).should('have.class', 'selected')
    cy.get('#selected-participants-list .selected-participant').should('have.length', 2)
    
    // Deselect first participant by clicking again
    cy.get('.participant-item').first().click()
    cy.get('.participant-item').first().should('not.have.class', 'selected')
    cy.get('#selected-participants-list .selected-participant').should('have.length', 1)
    
    // Deselect via remove button in selected list
    cy.get('#selected-participants-list .remove-participant').first().click()
    cy.get('#selected-participants-list .selected-participant').should('have.length', 0)
    cy.get('#selected-participants').should('not.be.visible')
  })
})