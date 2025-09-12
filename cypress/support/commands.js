// ***********************************************
// Custom commands for Badminton Cost Splitter E2E tests
// ***********************************************

// Clear all application data with robust error handling and verification
Cypress.Commands.add('clearApplicationData', () => {
  cy.log('Starting application data clearing...')
  
  // Attempt data clearing with retries
  cy.request({
    method: 'DELETE',
    url: '/api/test/clear-data',
    timeout: 10000, // 10 second timeout for data clearing
    retryOnStatusCodeFailure: true,
    retryOnNetworkFailure: true
  }).then((response) => {
    expect(response.status).to.eq(200)
    expect(response.body).to.have.property('success', true)
    
    // Log clearing results for debugging
    if (response.body.cleared) {
      cy.log(`Data cleared - Users: ${response.body.cleared.users}, Events: ${response.body.cleared.events}, CostItems: ${response.body.cleared.costItems}, Payments: ${response.body.cleared.payments}`)
    }
    
    if (response.body.remaining) {
      cy.log(`Remaining data - Users: ${response.body.remaining.users}, Events: ${response.body.remaining.events}, CostItems: ${response.body.remaining.costItems}, Payments: ${response.body.remaining.payments}`)
    }
    
    // Verify complete clearing
    expect(response.body.fullyCleared).to.be.true
    
    // Add small delay to ensure file system consistency
    cy.wait(200)
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
  return cy.request('GET', '/api/users').then((usersResponse) => {
    const users = usersResponse.body.data || usersResponse.body || [];
    const participantIds = users.length > 0 ? [users[0].id] : []; // Use first user as participant
    
    const defaultEvent = {
      name: `Test Event ${Date.now()}`,
      date: '2025-12-31',
      location: 'Test Court',
      participants: participantIds
    }
    const event = { ...defaultEvent, ...eventData }
    
    // Always ensure events have at least one participant if users exist
    if ((!event.participants || event.participants.length === 0) && users.length > 0) {
      event.participants = [users[0].id];
    }
    
    return cy.request('POST', '/api/events', event).then((response) => {
      expect(response.status).to.eq(201)
      return response.body.data
    })
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

// Custom logging command for writing to cypress-results.log
Cypress.Commands.add('logToFile', (message, level = 'INFO') => {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${level}: ${message}`
  
  cy.task('writeToResultsLog', {
    message: logMessage,
    timestamp: timestamp
  })
})

// Log test progress
Cypress.Commands.add('logTestProgress', (step, description) => {
  cy.logToFile(`Step ${step}: ${description}`)
})