// Import commands
import './commands'

// Import plugins
import 'cypress-file-upload'
import 'cypress-wait-until'

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that might occur during development
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  return true
})

// Before each test
beforeEach(() => {
  // Set up common test data
  cy.task('log', `Starting test: ${Cypress.currentTest.title}`)
  
  // Mock OAuth2 authentication headers
  cy.intercept('**', (req) => {
    req.headers['x-forwarded-email'] = Cypress.env('testUserEmail')
    req.headers['x-forwarded-user'] = 'test-user'
  })
})

// After each test
afterEach(() => {
  // Clean up test data if test failed
  if (Cypress.currentTest.state === 'failed') {
    cy.task('log', `Test failed: ${Cypress.currentTest.title}`)
    cy.task('cleanDatabase')
  }
})