@echo off
setlocal enabledelayedexpansion
echo Checking for processes using port 3000...

REM Find all processes listening on port 3000 and kill them
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        echo Found process %%a using port 3000
        echo Killing process %%a...
        taskkill /F /PID %%a 2>nul
        if !ERRORLEVEL! EQU 0 (
            echo Successfully killed process %%a
        ) else (
            echo Failed to kill process %%a ^(may already be terminated^)
        )
    )
)

REM Also kill any remaining processes that might be using port 3000 (not just LISTENING)
echo Checking for any remaining processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a 2>nul >nul
    )
)

echo Done.
pause