#!/bin/bash

# Comprehensive troubleshooting script for BREA-CAN deployment
# Run this script on your EC2 instance to diagnose issues

echo "🔍 BREA-CAN Deployment Troubleshooting"
echo "======================================"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK") echo -e "✅ $message" ;;
        "ERROR") echo -e "❌ $message" ;;
        "WARNING") echo -e "⚠️ $message" ;;
        "INFO") echo -e "ℹ️ $message" ;;
    esac
}

# Check if Docker is running
if docker --version > /dev/null 2>&1; then
    print_status "OK" "Docker is installed and running"
else
    print_status "ERROR" "Docker is not installed or not running"
    exit 1
fi

# Check if Docker Compose is available
if docker-compose --version > /dev/null 2>&1; then
    print_status "OK" "Docker Compose is available"
else
    print_status "WARNING" "Docker Compose not found, trying docker compose"
    if docker compose version > /dev/null 2>&1; then
        print_status "OK" "Docker Compose (v2) is available"
        COMPOSE_CMD="docker compose"
    else
        print_status "ERROR" "Docker Compose is not available"
        exit 1
    fi
fi

# Set compose command
COMPOSE_CMD=${COMPOSE_CMD:-"docker-compose"}

# Navigate to deployment directory
DEPLOY_DIR="$HOME/brea-can-deployment"
if [ -d "$DEPLOY_DIR" ]; then
    cd "$DEPLOY_DIR"
    print_status "OK" "Found deployment directory: $DEPLOY_DIR"
else
    print_status "ERROR" "Deployment directory not found: $DEPLOY_DIR"
    echo "Creating deployment directory..."
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

echo ""
echo "🐳 Container Status"
echo "=================="

# Check container status
if [ -f "docker-compose.yml" ]; then
    print_status "OK" "Found docker-compose.yml"
    
    # Show container status
    echo "Current container status:"
    $COMPOSE_CMD ps
    
    # Check if containers are running
    if $COMPOSE_CMD ps | grep -q "Up"; then
        print_status "OK" "Some containers are running"
    else
        print_status "ERROR" "No containers are running"
        echo "Starting containers..."
        $COMPOSE_CMD up -d
        sleep 10
    fi
else
    print_status "ERROR" "docker-compose.yml not found"
    echo "This might be why your deployment is failing."
    echo "Let me create the docker-compose.yml file..."
    
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
    
    print_status "OK" "Created docker-compose.yml"
    
    # Start services
    echo "Starting services..."
    $COMPOSE_CMD up -d
    sleep 20
fi

echo ""
echo "🔄 Service Health Checks"
echo "======================="

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check individual container status
APP_STATUS=$($COMPOSE_CMD ps app | grep -o "Up\|Exit\|Restarting" | head -1)
MONGO_STATUS=$($COMPOSE_CMD ps mongo | grep -o "Up\|Exit\|Restarting" | head -1)

if [ "$APP_STATUS" = "Up" ]; then
    print_status "OK" "Application container is running"
else
    print_status "ERROR" "Application container is not running ($APP_STATUS)"
fi

if [ "$MONGO_STATUS" = "Up" ]; then
    print_status "OK" "MongoDB container is running"
else
    print_status "ERROR" "MongoDB container is not running ($MONGO_STATUS)"
fi

echo ""
echo "🌐 Network and Port Checks"
echo "========================="

# Check if ports are listening
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    print_status "OK" "Port 3000 is listening"
else
    print_status "ERROR" "Port 3000 is not listening"
fi

if netstat -tlnp 2>/dev/null | grep -q ":27017"; then
    print_status "OK" "Port 27017 (MongoDB) is listening"
else
    print_status "ERROR" "Port 27017 (MongoDB) is not listening"
fi

echo ""
echo "🏥 Application Health Check"
echo "=========================="

# Health check
echo "Testing application health endpoint..."
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "OK" "Health endpoint is responding"
    echo "Health response:"
    curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
else
    print_status "ERROR" "Health endpoint is not responding"
    
    # Try to get more info
    echo "Attempting to get response:"
    curl -v http://localhost:3000/api/health 2>&1 | head -20
fi

# Test admin endpoint
echo "Testing admin endpoint..."
if curl -f -s http://localhost:3000/api/admin > /dev/null 2>&1; then
    print_status "OK" "Admin API is responding"
else
    print_status "ERROR" "Admin API is not responding"
    echo "Admin endpoint response:"
    curl -s http://localhost:3000/api/admin | head -5
fi

echo ""
echo "📋 Container Logs"
echo "================"

# Show recent logs
echo "Application logs (last 20 lines):"
$COMPOSE_CMD logs --tail=20 app

echo ""
echo "MongoDB logs (last 10 lines):"
$COMPOSE_CMD logs --tail=10 mongo

echo ""
echo "🔧 Database Connection Test"
echo "=========================="

# Test MongoDB connection
echo "Testing MongoDB connection..."
if $COMPOSE_CMD exec -T mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_status "OK" "MongoDB is accessible"
    
    # Check if BCAN database exists
    if $COMPOSE_CMD exec -T mongo mongosh --eval "use BCAN; db.stats()" > /dev/null 2>&1; then
        print_status "OK" "BCAN database is accessible"
    else
        print_status "WARNING" "BCAN database might not be initialized"
        echo "Initializing BCAN database..."
        $COMPOSE_CMD exec -T mongo mongosh --eval "
            use BCAN;
            db.patients.insertOne({test: true});
            db.patients.deleteOne({test: true});
            print('BCAN database initialized');
        "
    fi
else
    print_status "ERROR" "Cannot connect to MongoDB"
fi

echo ""
echo "🚀 Quick Fix Attempts"
echo "===================="

# If health check fails, try restarting
if ! curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "INFO" "Attempting to restart application..."
    $COMPOSE_CMD restart app
    
    echo "Waiting for restart..."
    sleep 15
    
    if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "OK" "Application is now responding after restart"
    else
        print_status "ERROR" "Application still not responding after restart"
        
        # Show more detailed logs
        echo "Detailed application logs:"
        $COMPOSE_CMD logs app
    fi
fi

echo ""
echo "📊 System Resources"
echo "=================="

# Check system resources
echo "Disk usage:"
df -h | grep -E "(Filesystem|/dev/)"

echo ""
echo "Memory usage:"
free -h

echo ""
echo "Docker system info:"
docker system df

echo ""
echo "🔍 Troubleshooting Summary"
echo "========================="

# Final recommendations
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "OK" "✨ Application appears to be working!"
    echo ""
    echo "🌐 Your application should be accessible at:"
    echo "   Main app: http://$(curl -s ifconfig.me):3000"
    echo "   Admin dashboard: http://$(curl -s ifconfig.me):3000/admin"
    echo "   Health check: http://$(curl -s ifconfig.me):3000/api/health"
else
    print_status "ERROR" "❌ Application is still not working properly"
    echo ""
    echo "🔧 Next steps to try:"
    echo "1. Check EC2 security group - ensure port 3000 is open"
    echo "2. Check if there are any firewall rules blocking the port"
    echo "3. Verify the Docker image was built correctly"
    echo "4. Try rebuilding with: $COMPOSE_CMD up -d --build"
    echo ""
    echo "📞 For immediate help, run these commands:"
    echo "   View all logs: $COMPOSE_CMD logs -f"
    echo "   Restart everything: $COMPOSE_CMD restart"
    echo "   Clean rebuild: $COMPOSE_CMD down && $COMPOSE_CMD up -d --build"
fi