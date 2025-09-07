describe('Simple Test', () => {
  it('should visit homepage', () => {
    cy.visit('/')
    cy.get('body').should('exist')
    cy.get('.navbar').should('be.visible')
  })
  
  it('should navigate to users page', () => {
    cy.visit('/')
    cy.get('[data-page="users"]').should('be.visible').click()
    cy.get('#users-page').should('exist')
  })
  
  it('should find add user button', () => {
    cy.visit('/')
    cy.get('[data-page="users"]').click()
    cy.get('#add-user-btn').should('be.visible')
  })
})