describe('Event Creation - Isolated Test', () => {
  beforeEach(() => {
    // Clear application data before each test
    cy.clearApplicationData()
    cy.visit('/')
  })

  it('should create a simple event successfully', () => {
    // Create test users first
    cy.createUser({
      name: 'Test Alice',
      email: 'alice@test.com'
    }).then(alice => {
      cy.createUser({
        name: 'Test Bob', 
        email: 'bob@test.com'
      }).then(bob => {
        
        // Navigate to events page
        cy.visit('/events')
        cy.contains('Events').should('be.visible')
        
        // Click Add Event button
        cy.get('#add-event-btn').should('be.visible').click()
        
        // Fill out the event form
        cy.get('#event-name').should('be.visible').type('Simple Test Event')
        cy.get('#event-date').should('be.visible').type('2025-12-25')
        cy.get('#event-location').should('be.visible').type('Test Court')
        cy.get('#event-description').should('be.visible').type('A simple test event')
        
        // Select participants
        cy.get(`#participant-${alice.id}`).should('be.visible').check()
        cy.get(`#participant-${bob.id}`).should('be.visible').check()
        
        // Submit the form
        cy.get('#add-event-save').should('be.visible').click()
        
        // Verify the event was created
        cy.contains('Simple Test Event').should('be.visible')
        cy.contains('Test Court').should('be.visible')
        
        // Verify we can navigate to event detail
        cy.contains('Simple Test Event').click()
        cy.get('#event-detail-name').should('contain', 'Simple Test Event')
        cy.get('#event-detail-location').should('contain', 'Test Court')
        
        // Verify participants are shown
        cy.contains('Test Alice').should('be.visible')
        cy.contains('Test Bob').should('be.visible')
      })
    })
  })
})