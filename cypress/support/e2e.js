// ***********************************************************
// Badminton Cost Splitter E2E Support Configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Add global before hook to clear data before each test
beforeEach(() => {
  // Clear application data before each test to ensure clean state
  cy.clearApplicationData()
})

// Global configuration for handling errors
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on certain non-critical exceptions
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  // Return true to fail the test on other exceptions
  return true
})

// Add custom assertions for our application
chai.Assertion.addMethod('balanceAmount', function (expected) {
  const obj = this._obj
  const text = obj.text()
  const amount = parseFloat(text.replace(/[$,]/g, ''))
  
  this.assert(
    amount === expected,
    `expected balance to be ${expected} but got ${amount}`,
    `expected balance not to be ${expected}`,
    expected,
    amount
  )
})