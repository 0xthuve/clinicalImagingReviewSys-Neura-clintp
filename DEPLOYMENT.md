# BREA-CAN Deployment Guide

## Fixed Issues

### 1. MongoDB Connection Problem
**Problem**: Internal server error when accessing admin dashboard due to missing MongoDB connection in Docker deployment.

**Solution**: 
- Updated deployment to use Docker Compose with both application and MongoDB containers
- Added proper networking between containers
- Enhanced MongoDB connection handling with better error messages
- Added health checks for both services

### 2. Environment Configuration
**Problem**: Single container deployment without database access.

**Solution**: 
- Created proper Docker Compose setup for production
- Added MongoDB initialization scripts
- Configured proper networking and dependencies

## Deployment Instructions

### Method 1: Automatic Deployment (GitHub Actions)
Your GitHub Actions workflow will now automatically:
1. Build and push the Docker image
2. Deploy using Docker Compose on EC2
3. Set up MongoDB container alongside the application
4. Configure proper networking and health checks

### Method 2: Manual Deployment on EC2

1. **SSH into your EC2 instance**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Run the deployment script**:
   ```bash
   # Download and run the deployment script
   curl -sSL https://raw.githubusercontent.com/your-repo/main/deploy.sh | bash
   ```

   Or manually:
   ```bash
   mkdir -p ~/brea-can-deployment
   cd ~/brea-can-deployment
   # Copy the docker-compose.yml content from this repo
   docker-compose up -d
   ```

### Method 3: Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd image-pred-consult-rediol
   ```

2. **Start with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Main app: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin
   - Health check: http://localhost:3000/api/health

## Troubleshooting

### Check Application Health
```bash
curl http://localhost:3000/api/health
```

### View Logs
```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Just MongoDB
docker-compose logs -f mongo
```

### Check MongoDB Connection
```bash
# Connect to MongoDB container
docker-compose exec mongo mongosh

# Check if BCAN database exists
docker-compose exec mongo mongosh --eval "show dbs"
```

### Restart Services
```bash
# Restart everything
docker-compose restart

# Restart just the app
docker-compose restart app
```

### Container Status
```bash
# Check running containers
docker-compose ps

# Check container health
docker-compose exec app wget --spider http://localhost:3000/api/health
```

## Database Information

- **Database Name**: BCAN
- **Collection**: patients
- **MongoDB Version**: 6.0
- **Default Credentials**: 
  - Username: admin
  - Password: password123

## Environment Variables

The application uses these environment variables:

- `NODE_ENV`: Set to "production" in production
- `MONGODB_URI`: MongoDB connection string (automatically set in Docker Compose)
- `PORT`: Application port (default: 3000)

## Security Notes

1. **Change default MongoDB credentials** in production
2. **Use environment-specific secrets** for GitHub Actions
3. **Configure EC2 security groups** to allow only necessary traffic
4. **Use HTTPS** in production with a reverse proxy (nginx/Apache)

## Common Issues and Solutions

### 1. "Failed to fetch patients" Error
- **Cause**: MongoDB connection failure
- **Solution**: Check MongoDB container is running and healthy
- **Check**: `docker-compose ps` and `docker-compose logs mongo`

### 2. Container Won't Start
- **Cause**: Port conflicts or image issues
- **Solution**: Stop conflicting services, rebuild images
- **Commands**: 
  ```bash
  docker-compose down
  docker system prune -f
  docker-compose up -d --build
  ```

### 3. Health Check Fails
- **Cause**: Application not fully started or MongoDB not ready
- **Solution**: Wait longer for startup, check dependencies
- **Check**: `docker-compose logs -f app`

### 4. Permission Issues
- **Cause**: Docker permissions or file ownership
- **Solution**: Run with proper permissions, check Docker group membership

## Monitoring

The application includes built-in health monitoring:

- **Health endpoint**: `/api/health`
- **Docker health checks**: Automatic container health monitoring
- **Logging**: Comprehensive logging for debugging

## Next Steps

1. **Set up SSL/TLS** with Let's Encrypt or CloudFlare
2. **Configure reverse proxy** (nginx) for better performance
3. **Set up monitoring** with tools like Prometheus/Grafana
4. **Implement backup strategy** for MongoDB data
5. **Configure log rotation** and centralized logging

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs -f`
3. Verify MongoDB connection: `docker-compose exec mongo mongosh`
4. Check application health: `curl http://localhost:3000/api/health`