describe('Fixed User Management Tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('[data-page="users"]').click()
    cy.wait(500)
  })

  it('should create and display users without navigation issues', () => {
    // Create user via API (this should have unique name now)
    cy.createUser({ name: 'Alice Johnson', email: 'alice@example.com' }).then((user) => {
      // Wait for UI to update (no reload needed)
      cy.wait(1000)
      
      // Verify user appears in list
      cy.get('.user-card').should('contain', user.name)
      
      // Test that we can still interact with UI (no navigation issues)
      cy.get('#add-user-btn').should('be.visible')
    })
  })
  
  it('should handle edit user modal correctly', () => {
    // Create a user first
    cy.createUser({ name: 'Bob Smith', email: 'bob@example.com' }).then((user) => {
      cy.wait(1000)
      
      // Click edit button
      cy.get('.user-card').first().find('.edit-user-btn').click()
      
      // Verify correct modal opens
      cy.get('#edit-user-modal').should('be.visible')
      cy.get('#edit-user-name').should('have.value', user.name)
      
      // Close modal
      cy.get('#edit-user-cancel').click()
      cy.get('#edit-user-modal').should('not.be.visible')
    })
  })
  
  it('should create user via UI with success message', () => {
    const timestamp = Date.now()
    const testUser = {
      name: `UI Test User ${timestamp}`,
      email: `uitest${timestamp}@example.com`,
      phone: '+1234567890'
    }
    
    // Open modal
    cy.get('#add-user-btn').click()
    cy.get('#add-user-modal').should('be.visible')
    
    // Fill form
    cy.get('#user-name').type(testUser.name)
    cy.get('#user-email').type(testUser.email) 
    cy.get('#user-phone').type(testUser.phone)
    
    // Submit
    cy.get('#add-user-save').click()
    
    // Verify success
    cy.get('#success-modal').should('be.visible')
    cy.get('#success-message').should('contain', 'added successfully')
    cy.get('#success-ok').click()
    
    // Verify user in list
    cy.get('.user-card').should('contain', testUser.name)
  })
})