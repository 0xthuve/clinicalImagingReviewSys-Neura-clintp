#!/bin/bash

# Deployment script for BREA-CAN application
# Run this script on your EC2 instance to deploy the application

set -e  # Exit on any error

echo "🚀 Starting BREA-CAN deployment..."

# Create deployment directory
DEPLOY_DIR="$HOME/brea-can-deployment"
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

echo "📁 Working directory: $(pwd)"

# Create docker-compose.yml
echo "📝 Creating docker-compose.yml..."
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
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  mongo:
    image: mongo:6.0
    container_name: brea-can-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: BCAN
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
echo "📦 Pulling Docker images..."
docker pull thuvecodes/brea-can:latest
docker pull mongo:6.0

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Start services
echo "▶️ Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check container status
echo "🔍 Checking container status..."
docker-compose ps

# Check application health
echo "🏥 Checking application health..."
curl -f http://localhost:3000/api/health || echo "❌ Health check failed"

# Show logs
echo "📋 Application logs:"
docker-compose logs app --tail=20

echo "✅ Deployment completed!"
echo "🌐 Application should be available at http://your-ec2-ip:3000"
echo "🔧 Admin dashboard: http://your-ec2-ip:3000/admin"

# Troubleshooting commands
echo ""
echo "🔧 Troubleshooting commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart app: docker-compose restart app"
echo "  Check MongoDB: docker-compose exec mongo mongosh --eval 'db.adminCommand(\"ping\")'"
echo "  Connect to app container: docker-compose exec app sh"