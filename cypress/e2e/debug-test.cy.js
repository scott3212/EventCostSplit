describe('Debug Test - Fixed Issues', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('[data-page="users"]').click()
    cy.wait(500)
  })

  it('should create a user successfully', () => {
    const timestamp = Date.now()
    const testUser = {
      name: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      phone: '+1234567890'
    }
    
    // Open modal
    cy.get('#add-user-btn').should('be.visible').click()
    
    // Fill form
    cy.get('#user-name').type(testUser.name)
    cy.get('#user-email').type(testUser.email)
    cy.get('#user-phone').type(testUser.phone)
    
    // Submit
    cy.get('#add-user-save').click()
    
    // Verify success modal (not alert-success)
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-message').should('contain', 'added successfully')
    
    // Close success modal
    cy.get('#success-ok').click()
    
    // Verify user in list
    cy.get('.user-card').should('contain', testUser.name)
  })
  
  it('should show validation error for empty name', () => {
    // Open modal
    cy.get('#add-user-btn').click()
    
    // Try to submit without name
    cy.get('#add-user-save').click()
    
    // Check for field-specific error (not generic .error-message)
    cy.get('#name-error').should('be.visible')
  })
})