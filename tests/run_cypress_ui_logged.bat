@echo off
echo Starting Cypress UI with logging...
echo.

REM Clear the log file first
if exist cypress-results.log del cypress-results.log

REM Start server in background (no output redirection to keep it clean)
echo Starting development server...
start /B cmd /c "npm run dev > server.log 2>&1"

REM Wait for server to start
timeout /t 3 /nobreak >nul

echo Starting Cypress UI...
echo Cypress UI output will be logged to cypress-ui.log
echo Server output will be logged to server.log
echo.

REM Run Cypress UI and capture output
npx cypress open > cypress-ui.log 2>&1

echo.
echo Cypress UI session ended.
echo Logs saved to:
echo   - cypress-ui.log (UI session log)
echo   - server.log (development server log)
echo.
pause