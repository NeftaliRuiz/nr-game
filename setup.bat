@echo off
REM Trivia Game - Quick Setup Script for Windows

echo ===================================
echo    Trivia Game - Setup Wizard
echo ===================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    exit /b 1
)

echo Checking Node.js version...
node -v
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    exit /b 1
)
echo Backend dependencies installed
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    exit /b 1
)
echo Frontend dependencies installed
echo.

REM Create .env file
cd ..\backend
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo .env file created
) else (
    echo .env file already exists
)
echo.

REM Summary
echo ===================================
echo    Setup Complete!
echo ===================================
echo.
echo Next steps:
echo.
echo 1. Start the development servers:
echo    npm run dev
echo.
echo 2. Open your browser:
echo    Frontend: http://localhost:4200
echo    Backend:  http://localhost:3000
echo.
echo 3. Start playing!
echo.
echo For more information, see:
echo    - README.md (full documentation)
echo    - QUICKSTART.md (quick reference)
echo    - DEPLOYMENT.md (production deployment)
echo.

pause
