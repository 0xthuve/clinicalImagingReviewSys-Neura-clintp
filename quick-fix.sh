#!/bin/bash

# Quick fix script for BREA-CAN deployment
# This script will update your current deployment with the latest working configuration

set -e

echo "🚀 BREA-CAN Quick Fix Deployment"
echo "================================"

# Create deployment directory
DEPLOY_DIR="$HOME/brea-can-deployment"
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

echo "📁 Working in: $(pwd)"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker stop brea-can brea-can-app brea-can-mongo 2>/dev/null || true
docker rm brea-can brea-can-app brea-can-mongo 2>/dev/null || true

# Clean up old compose
if [ -f "docker-compose.yml" ]; then
    docker-compose down 2>/dev/null || true
fi

# Create the updated docker-compose.yml
echo "📝 Creating updated docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    image: thuvecodes/brea-can:latest
    container_name: brea-can-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/BCAN
    depends_on:
      mongo:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - brea-can-network

  mongo:
    image: mongo:6.0
    container_name: brea-can-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    # Remove authentication to fix connection issues
    restart: unless-stopped
    networks:
      - brea-can-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

volumes:
  mongo_data:

networks:
  brea-can-network:
    driver: bridge
EOF

# Pull latest images
echo "📦 Pulling latest images..."
docker pull thuvecodes/brea-can:latest
docker pull mongo:6.0

# Start services
echo "▶️ Starting services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 30

# Check status
echo "🔍 Checking service status..."
docker-compose ps

# Test health
echo "🏥 Testing application health..."
for i in {1..12}; do
    if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    else
        echo "⏳ Waiting for application... ($i/12)"
        sleep 10
    fi
done

# Seed users
echo "👥 Seeding expert users..."
docker-compose exec -T mongo mongosh --quiet << 'MONGO_SCRIPT'
use BCAN;
try {
  db.user.deleteMany({});
  var result = db.user.insertMany([
    { id: 'c001', name: 'Dr. Anjali Kumaran', category: 'Consultant' },
    { id: 'c002', name: 'Dr. Ramesh Perera', category: 'Consultant' },
    { id: 'r001', name: 'Dr. Nilani Fernando', category: 'Radiologist' },
    { id: 'r002', name: 'Dr. K. Tharshan', category: 'Radiologist' },
    { id: 'c003', name: 'Dr. Malathi Sivarajah', category: 'Consultant' },
    { id: 'r003', name: 'Dr. Mohamed Niyas', category: 'Radiologist' },
    { id: 'admin', name: 'SenzuraAdmin', category: 'Admin' }
  ]);
  print('✅ Successfully inserted ' + result.insertedCount + ' users');
} catch (error) {
  print('❌ Error seeding users: ' + error.message);
}
MONGO_SCRIPT

# Test user authentication
echo "🔐 Testing user authentication..."
sleep 5
ADMIN_TEST=$(curl -s -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{"userId": "admin"}')

if echo "$ADMIN_TEST" | grep -q '"exists":true'; then
    echo "✅ Admin user authentication working"
else
    echo "❌ Admin user authentication failed: $ADMIN_TEST"
fi

# Final test
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo ""
    echo "✅ SUCCESS! Application is running"
    echo "🌐 Access your application at:"
    echo "   http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR-EC2-IP'):3000"
    echo "   Admin: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR-EC2-IP'):3000/admin"
    echo ""
    echo "📋 Login credentials:"
    echo "   Admin: admin"
    echo "   Consultant: c001, c002, c003"
    echo "   Radiologist: r001, r002, r003"
    echo ""
    echo "📋 Application health:"
    curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
else
    echo ""
    echo "❌ Application is still not responding"
    echo "📋 Recent logs:"
    docker-compose logs --tail=20 app
fi

echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Restart: docker-compose restart"
echo "   Stop: docker-compose down"
echo "   Status: docker-compose ps"