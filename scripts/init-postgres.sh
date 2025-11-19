#!/bin/bash

# Script to initialize PostgreSQL database for Trivia App
# This script starts PostgreSQL in Docker and creates the database

echo "🐘 Starting PostgreSQL container..."

# Check if container already exists
if [ "$(docker ps -aq -f name=trivia-postgres)" ]; then
    echo "📦 Container exists, checking status..."
    if [ "$(docker ps -q -f name=trivia-postgres)" ]; then
        echo "✅ PostgreSQL is already running"
    else
        echo "▶️  Starting existing container..."
        docker start trivia-postgres
    fi
else
    echo "📦 Creating new PostgreSQL container..."
    docker run -d \
        --name trivia-postgres \
        -e POSTGRES_USER=trivia_user \
        -e POSTGRES_PASSWORD=trivia_pass \
        -e POSTGRES_DB=trivia_db \
        -p 5433:5432 \
        -v trivia-postgres-data:/var/lib/postgresql/data \
        postgres:16-alpine
fi

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Test connection
docker exec trivia-postgres pg_isready -U trivia_user -d trivia_db

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PostgreSQL is ready!"
    echo ""
    echo "📊 Database connection details:"
    echo "   Host: localhost"
    echo "   Port: 5433"
    echo "   Database: trivia_db"
    echo "   User: trivia_user"
    echo "   Password: trivia_pass"
    echo ""
    echo "🔗 Connection string:"
    echo "   postgresql://trivia_user:trivia_pass@localhost:5433/trivia_db"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Run migrations: cd backend && npm run migration:run"
    echo "   2. Seed database: cd backend && npm run seed"
    echo "   3. Start backend: cd backend && npm run dev"
else
    echo "❌ Failed to connect to PostgreSQL"
    exit 1
fi
