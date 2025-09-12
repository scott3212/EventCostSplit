const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      const fs = require('fs');
      const path = require('path');

      on('task', {
        clearAllTestData() {
          // Clear all JSON data files for testing
          const dataDir = path.join(__dirname, 'src', 'data');
          const dataFiles = ['users.json', 'events.json', 'cost_items.json', 'payments.json'];
          
          dataFiles.forEach(file => {
            const filePath = path.join(dataDir, file);
            try {
              if (fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, JSON.stringify([], null, 2));
                console.log(`Cleared ${file}`);
              }
            } catch (error) {
              console.warn(`Failed to clear ${file}:`, error.message);
            }
          });
          
          return null; // Tasks must return a value
        },
        
        writeTestLog(logData) {
          // Write test logs to a file
          const logsDir = path.join(__dirname, 'cypress', 'logs');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const logFile = path.join(logsDir, `test-run-${timestamp}.log`);
          
          try {
            // Ensure logs directory exists
            if (!fs.existsSync(logsDir)) {
              fs.mkdirSync(logsDir, { recursive: true });
            }
            
            const logEntry = `[${new Date().toISOString()}] ${logData.level}: ${logData.message}\n`;
            fs.appendFileSync(logFile, logEntry);
            
            return null;
          } catch (error) {
            console.warn('Failed to write test log:', error.message);
            return null;
          }
        },
        
        writeToResultsLog(logData) {
          // Write to cypress-results.log specifically
          const logFile = path.join(__dirname, 'cypress-results.log');
          
          try {
            const logEntry = `${logData.message}\n`;
            fs.appendFileSync(logFile, logEntry);
            return null;
          } catch (error) {
            console.warn('Failed to write to cypress-results.log:', error.message);
            return null;
          }
        }
      });
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js'
  },
  retries: {
    runMode: 2,
    openMode: 0
  },
  defaultCommandTimeout: 5000,
  requestTimeout: 3000,
  responseTimeout: 3000,
  pageLoadTimeout: 5000
});
