#!/bin/bash

# Nocodile Docker Startup Script for Linux/Mac

echo ""
echo "========================================"
echo "   🚀 Nocodile Docker Startup Script"
echo "========================================"
echo ""

# Check if Docker is running
echo "🔍 Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    echo ""
    echo "📋 Steps to start Docker:"
    echo "   1. Start Docker Desktop or Docker daemon"
    echo "   2. Wait for it to fully start"
    echo "   3. Run this script again"
    echo ""
    exit 1
fi
echo "✅ Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not available. Please install Docker Compose."
    exit 1
fi
echo "✅ Docker Compose is available"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env configuration file..."
    cat > .env << 'EOF'
# Database Configuration
MYSQL_HOST=mysql
MYSQL_USER=root
MYSQL_PASSWORD=rootpassword
MYSQL_DATABASE=object_detection
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=rootpassword

# Backend Configuration
BACKEND_PORT=8888
BACKEND_HOST=0.0.0.0
PYTHONUNBUFFERED=1
PYTHONDONTWRITEBYTECODE=1

# Frontend Configuration
FRONTEND_PORT=3001
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8888

# CORS Configuration
CORS_ORIGINS=http://localhost:3001,http://localhost:3000
CORS_CREDENTIALS=true

# Security
SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
PASSWORD_SALT_ROUNDS=12

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100

# Model Configuration
MODEL_DIR=./models
TEMP_DIR=./temp

# Debug
DEBUG=false
LOG_LEVEL=INFO
EOF
    echo "✅ .env file created successfully"
fi

echo ""
echo "🛑 Stopping any existing containers..."
docker-compose down

echo ""
echo "🔨 Building and starting containers..."
echo "   This may take a few minutes on first run..."
docker-compose up --build -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start containers. Check the logs above for errors."
    exit 1
fi

echo ""
echo "⏳ Waiting for services to start..."
sleep 15

echo ""
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "📋 Recent logs:"
docker-compose logs --tail=10

echo ""
echo "========================================"
echo "   ✅ Nocodile is starting up!"
echo "========================================"
echo ""
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:8888"
echo "🗄️  Database: localhost:3307"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo ""
echo "💡 Default login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
