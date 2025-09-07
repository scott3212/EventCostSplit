describe('Application Smoke Test', () => {
  it('should load the application successfully', () => {
    cy.visit('/')
    
    // Check that main page loads
    cy.get('body').should('be.visible')
    cy.get('.navbar').should('be.visible')
    
    // Check that navigation works
    cy.get('.nav-item').contains('Dashboard').should('be.visible')
    cy.get('.nav-item').contains('Users').should('be.visible') 
    cy.get('.nav-item').contains('Events').should('be.visible')
    cy.get('.nav-item').contains('Payments').should('be.visible')
  })
  
  it('should navigate between pages', () => {
    cy.visit('/')
    
    // Navigate to Users page
    cy.contains('Users').click()
    cy.get('#users-page').should('have.class', 'active')
    
    // Navigate to Events page  
    cy.contains('Events').click()
    cy.get('#events-page').should('have.class', 'active')
    
    // Navigate back to Dashboard
    cy.contains('Dashboard').click() 
    cy.get('#dashboard-page').should('have.class', 'active')
  })
  
  it('should make API calls successfully', () => {
    cy.visit('/')
    
    // Check that API endpoints respond
    cy.request('GET', '/api/users').then((response) => {
      expect(response.status).to.eq(200)
    })
    
    cy.request('GET', '/api/events').then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})