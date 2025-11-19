#!/bin/bash

# Trivia Game - Quick Setup Script
# This script automates the initial setup of the project

set -e

echo "🎮 =================================="
echo "   Trivia Game - Setup Wizard"
echo "   =================================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)

if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required"
    echo "   Current version: $(node -v)"
    echo "   Please upgrade Node.js: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install backend dependencies
echo "📥 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

# Create .env file if it doesn't exist
cd ../backend
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi
echo ""

# Summary
echo "🎉 =================================="
echo "   Setup Complete!"
echo "   =================================="
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Start the development servers:"
echo "   npm run dev"
echo ""
echo "2. Open your browser:"
echo "   Frontend: http://localhost:4200"
echo "   Backend:  http://localhost:3000"
echo ""
echo "3. Start playing! 🎮"
echo ""
echo "📚 For more information, see:"
echo "   - README.md (full documentation)"
echo "   - QUICKSTART.md (quick reference)"
echo "   - DEPLOYMENT.md (production deployment)"
echo ""
