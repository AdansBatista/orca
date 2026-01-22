@echo off
echo =====================================
echo  Autoclave Monitor - Electron App
echo =====================================
echo.
echo Starting the tablet app in Electron...
echo.

cd /d "%~dp0"

echo [1/2] Compiling TypeScript...
call npm run electron:compile
if errorlevel 1 (
    echo ERROR: Failed to compile TypeScript
    pause
    exit /b 1
)

echo.
echo [2/2] Starting Electron...
echo.
echo The app will:
echo  - Start Next.js dev server on port 3001
echo  - Open Electron window with DevTools
echo  - Connect to MongoDB
echo.
echo Press Ctrl+C to stop
echo.

call npm run electron:dev

pause
