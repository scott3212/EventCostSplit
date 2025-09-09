const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js'
  },
  retries: {
    runMode: 2,
    openMode: 0
  },
  defaultCommandTimeout: 15000,
  requestTimeout: 15000,
  responseTimeout: 15000,
  pageLoadTimeout: 30000
});
