// ***********************************************
// Custom commands for Badminton Cost Splitter E2E tests
// ***********************************************

// Clear all application data
Cypress.Commands.add('clearApplicationData', () => {
  cy.request('DELETE', '/api/test/clear-data').then((response) => {
    expect(response.status).to.eq(200)
  })
})

// Create a test user
Cypress.Commands.add('createUser', (userData = {}) => {
  const timestamp = Date.now() + Math.floor(Math.random() * 1000) // Add randomness
  const defaultUser = {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    phone: '+1234567890'
  }
  
  // If userData has a name, make it unique by appending timestamp
  const user = { ...defaultUser, ...userData }
  if (userData.name) {
    user.name = `${userData.name} ${timestamp}`
  }
  if (userData.email) {
    user.email = `${userData.email.split('@')[0]}${timestamp}@${userData.email.split('@')[1]}`
  }
  
  return cy.request('POST', '/api/users', user).then((response) => {
    expect(response.status).to.eq(201)
    return response.body.data
  })
})

// Create a test event
Cypress.Commands.add('createEvent', (eventData = {}) => {
  const defaultEvent = {
    name: `Test Event ${Date.now()}`,
    date: '2025-12-31',
    location: 'Test Court',
    participants: []
  }
  const event = { ...defaultEvent, ...eventData }
  
  return cy.request('POST', '/api/events', event).then((response) => {
    expect(response.status).to.eq(201)
    return response.body.data
  })
})

// Create a test expense
Cypress.Commands.add('createExpense', (expenseData = {}) => {
  const defaultExpense = {
    eventId: '',
    description: `Test Expense ${Date.now()}`,
    amount: 100,
    paidBy: '',
    date: '2025-12-31',
    split: {}
  }
  const expense = { ...defaultExpense, ...expenseData }
  
  return cy.request('POST', '/api/cost-items', expense).then((response) => {
    expect(response.status).to.eq(201)
    return response.body.data
  })
})

// Navigate to a specific page in the SPA
Cypress.Commands.add('navigateToPage', (pageName) => {
  cy.visit('/')
  cy.wait(500) // Wait for initial load
  
  // Click the navigation button for the specified page
  cy.get(`[data-page="${pageName}"]`).click()
  cy.wait(300) // Wait for navigation to complete
  
  // Verify the page is active
  cy.get(`#${pageName}-page`).should('exist')
})

// Wait for API response and check success
Cypress.Commands.add('waitForApiSuccess', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201])
    if (interception.response.body.success !== undefined) {
      expect(interception.response.body.success).to.be.true
    }
  })
})

// Fill and submit a form
Cypress.Commands.add('submitForm', (formSelector, data) => {
  Object.keys(data).forEach(field => {
    if (data[field] !== null && data[field] !== undefined) {
      cy.get(`${formSelector} [name="${field}"]`).clear().type(String(data[field]))
    }
  })
  cy.get(`${formSelector} [type="submit"]`).click()
})

// Check if element is visible and contains text
Cypress.Commands.add('shouldContainText', { prevSubject: true }, (subject, text) => {
  cy.wrap(subject).should('be.visible').and('contain', text)
})

// Check if balance is displayed correctly (for financial amounts)
Cypress.Commands.add('shouldShowBalance', { prevSubject: true }, (subject, expectedAmount) => {
  cy.wrap(subject).should('be.visible').then(($el) => {
    const text = $el.text()
    const amount = parseFloat(text.replace(/[$,]/g, ''))
    expect(amount).to.equal(expectedAmount)
  })
})