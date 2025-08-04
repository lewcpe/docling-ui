const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:8000',
      mockDoclingUrl: 'http://localhost:8080',
      testUserEmail: 'test@example.com',
      testApiKey: 'test-api-key-123'
    },
    setupNodeEvents(on, config) {
      const { seedDatabase, cleanDatabase } = require('./cypress/support/database')
      
      // Task for database seeding and cleanup
      on('task', {
        async seedDatabase() {
          try {
            await seedDatabase()
            return null
          } catch (error) {
            console.error('Failed to seed database:', error)
            return null
          }
        },
        async cleanDatabase() {
          try {
            await cleanDatabase()
            return null
          } catch (error) {
            console.error('Failed to clean database:', error)
            return null
          }
        },
        log(message) {
          console.log(message)
          return null
        }
      })

      // Plugin for file uploads
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage')
        }
        return launchOptions
      })

      return config
    }
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack'
    }
  }
})