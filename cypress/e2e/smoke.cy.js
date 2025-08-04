describe('Smoke Tests - Verify Cypress Setup', () => {
  beforeEach(() => {
    // Clean and seed test data
    cy.task('cleanDatabase')
    cy.task('seedDatabase')
  })

  it('should verify all services are running', () => {
    // Test frontend is accessible
    cy.visit('/')
    cy.contains('Docling File Processor', { timeout: 10000 })
    
    // Test backend health endpoint
    cy.apiRequest('GET', '/health').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('status', 'healthy')
    })
    
    // Test mock Docling API is running
    cy.request({
      method: 'GET',
      url: `${Cypress.env('mockDoclingUrl')}/health`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('status', 'healthy')
    })
  })

  it('should verify authentication headers are working', () => {
    cy.apiRequest('GET', '/api/v1/me').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('email', Cypress.env('testUserEmail'))
    })
  })

  it('should verify database connectivity', () => {
    // Test that we can create and retrieve an API key
    cy.createTestApiKey('Smoke Test Key').then((apiKey) => {
      expect(apiKey).to.have.property('id')
      expect(apiKey).to.have.property('name', 'Smoke Test Key')
      expect(apiKey).to.have.property('key')
      
      // Clean up
      cy.deleteTestApiKey(apiKey.id)
    })
  })

  it('should verify file upload endpoint is accessible', () => {
    // Test file upload endpoint without actually uploading
    cy.apiRequest('POST', '/api/v1/files/upload').then((response) => {
      // Should return 400 for missing file, not 404 or 500
      expect(response.status).to.be.oneOf([400, 422])
    })
  })

  it('should verify mock Docling API responds correctly', () => {
    // Test mock Docling API with a simple request
    cy.fixture('sample.pdf', 'base64').then(fileContent => {
      const formData = new FormData()
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'application/pdf')
      formData.append('file', blob, 'test.pdf')
      
      cy.request({
        method: 'POST',
        url: `${Cypress.env('mockDoclingUrl')}/v1/convert/file`,
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10000
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('status', 'success')
        expect(response.body.document).to.have.property('text')
      })
    })
  })

  it('should verify Cypress custom commands work', () => {
    // Test login command
    cy.loginAsTestUser()
    cy.window().its('localStorage').invoke('getItem', 'user').should('exist')
    
    // Test mock setup commands
    cy.mockDoclingSuccess()
    cy.setupWebhookMock()
    
    // Verify mocks are set up
    cy.get('@doclingConvert').should('exist')
    cy.get('@webhookDelivery').should('exist')
  })

  it('should verify test file fixtures exist and are valid', () => {
    // Check PDF fixture
    cy.fixture('sample.pdf').should('exist')
    
    // Check image fixtures
    cy.fixture('sample.png').should('exist')
    cy.fixture('sample.jpg').should('exist')
    
    // Verify test data SQL exists
    cy.fixture('test-data.sql').should('exist')
  })

  it('should verify environment variables are set correctly', () => {
    // Check required Cypress environment variables
    expect(Cypress.env('apiUrl')).to.exist
    expect(Cypress.env('mockDoclingUrl')).to.exist
    expect(Cypress.env('testUserEmail')).to.exist
    expect(Cypress.env('testApiKey')).to.exist
    
    // Verify they have expected values
    expect(Cypress.env('testUserEmail')).to.eq('test@example.com')
    expect(Cypress.env('testApiKey')).to.eq('test-api-key-123')
  })

  afterEach(() => {
    // Clean up after each test
    cy.task('cleanDatabase')
  })
})