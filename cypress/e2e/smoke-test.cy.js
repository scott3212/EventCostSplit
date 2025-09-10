describe('Application Smoke Test', () => {
  it('should load the application successfully', () => {
    cy.visit('/')
    
    // Wait for app to load (loading screen may appear)
    cy.get('#app', { timeout: 10000 }).should('be.visible')
    
    // Check that main page loads
    cy.get('body').should('be.visible')
    cy.get('.nav-menu').should('be.visible')
    
    // Check that navigation works
    cy.get('.nav-item').contains('Dashboard').should('be.visible')
    cy.get('.nav-item').contains('Users').should('be.visible') 
    cy.get('.nav-item').contains('Events').should('be.visible')
    cy.get('.nav-item').contains('Payments').should('be.visible')
  })
  
  it('should navigate between pages', () => {
    cy.visit('/')
    
    // Wait for app to load
    cy.get('#app', { timeout: 10000 }).should('be.visible')
    
    // Navigate to Users page
    cy.get('[data-page="users"]').click()
    cy.get('#users-page').should('be.visible')
    
    // Navigate to Events page  
    cy.get('[data-page="events"]').click()
    cy.get('#events-page').should('be.visible')
    
    // Navigate back to Dashboard
    cy.get('[data-page="dashboard"]').click() 
    cy.get('#dashboard-page').should('be.visible')
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