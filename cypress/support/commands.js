// Custom commands for Docling File Processor testing

// Authentication commands
Cypress.Commands.add('loginAsTestUser', () => {
  cy.visit('/')
  cy.window().then((win) => {
    // Mock OAuth2 authentication
    win.localStorage.setItem('user', JSON.stringify({
      email: Cypress.env('testUserEmail'),
      authenticated: true
    }))
  })
})

// API commands
Cypress.Commands.add('apiRequest', (method, url, body = null) => {
  return cy.request({
    method,
    url: `${Cypress.env('apiUrl')}${url}`,
    body,
    headers: {
      'X-Forwarded-Email': Cypress.env('testUserEmail'),
      'X-Forwarded-User': 'test-user'
    },
    failOnStatusCode: false
  })
})

// File upload commands
Cypress.Commands.add('uploadTestFile', (fileName, fileType = 'application/pdf') => {
  cy.fixture(fileName, 'base64').then(fileContent => {
    cy.get('[data-cy=file-upload-dropzone]').attachFile({
      fileContent,
      fileName,
      mimeType: fileType,
      encoding: 'base64'
    }, { subjectType: 'drag-n-drop' })
  })
})

// Database commands
Cypress.Commands.add('seedTestData', () => {
  return cy.task('seedDatabase')
})

Cypress.Commands.add('cleanTestData', () => {
  return cy.task('cleanDatabase')
})

// Wait for processing commands
Cypress.Commands.add('waitForProcessingComplete', (jobId, timeout = 30000) => {
  cy.waitUntil(() => 
    cy.apiRequest('GET', `/api/v1/files/${jobId}/status`)
      .then(response => response.body.status === 'completed' || response.body.status === 'failed'),
    {
      timeout,
      interval: 1000,
      errorMsg: `Processing job ${jobId} did not complete within ${timeout}ms`
    }
  )
})

// Mock Docling API responses
Cypress.Commands.add('mockDoclingSuccess', () => {
  cy.intercept('POST', `${Cypress.env('mockDoclingUrl')}/v1/convert/file`, {
    statusCode: 200,
    body: {
      document: {
        text: 'This is extracted text from the test document.',
        metadata: {
          pages: 1,
          words: 10,
          characters: 45
        }
      },
      status: 'success',
      processing_time: 1.5
    }
  }).as('doclingConvert')
})

Cypress.Commands.add('mockDoclingError', () => {
  cy.intercept('POST', `${Cypress.env('mockDoclingUrl')}/v1/convert/file`, {
    statusCode: 500,
    body: {
      error: 'Internal server error',
      message: 'Failed to process document'
    }
  }).as('doclingConvertError')
})

// Webhook testing commands
Cypress.Commands.add('setupWebhookMock', () => {
  cy.intercept('POST', 'http://localhost:9999/webhook', {
    statusCode: 200,
    body: { received: true }
  }).as('webhookDelivery')
})

// API Key management commands
Cypress.Commands.add('createTestApiKey', (keyName = 'Test API Key') => {
  return cy.apiRequest('POST', '/api/v1/api-keys', { name: keyName })
    .then(response => {
      expect(response.status).to.eq(201)
      return response.body
    })
})

Cypress.Commands.add('deleteTestApiKey', (keyId) => {
  return cy.apiRequest('DELETE', `/api/v1/api-keys/${keyId}`)
})