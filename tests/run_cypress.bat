@echo off
npm run cypress:run -- --spec "cypress/e2e/event-management/event-description-update-bug.cy.js" > cypress-results.log 2>&1
