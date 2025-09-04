# 🚀 AI LMS Platform - Production Deployment Guide for 5000+ Concurrent Users

This guide will help you deploy the AI LMS Platform to support 5000+ concurrent users with high performance, reliability, and scalability.

## 📋 Prerequisites

### System Requirements
- **CPU**: 8+ cores (16+ recommended)
- **RAM**: 32GB+ (64GB+ recommended)
- **Storage**: 500GB+ SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Network**: 1Gbps+ bandwidth

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for development)
- Git
- Nginx (if not using Docker)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Frontend      │    │   Backend       │
│   (Nginx)       │────│   (React)       │────│   (Node.js)     │
│   Port: 80/443  │    │   Port: 80      │    │   Port: 5000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │   MySQL DB      │
                       │   Port: 6379    │    │   Port: 3306    │
                       └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Judge0        │    │   Monitoring    │
                       │   Port: 2358    │    │   (Grafana)     │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start (Docker Compose)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd ai-lms-platform

# Copy environment file
cp env.production.example .env.production

# Edit environment variables
nano .env.production
```

### 2. Configure Environment Variables
```bash
# Database Configuration
DB_ROOT_PASSWORD=your_secure_root_password
DB_PASSWORD=your_secure_db_password
DB_NAME=lms_platform

# JWT Secret (generate a secure 64+ character string)
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_64_characters

# Domain Configuration
FRONTEND_URL=https://your-domain.com

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
```

### 3. Deploy with Docker Compose
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 4. Initialize Database
```bash
# Run database optimizations
docker exec -i lms-mysql mysql -u root -p${DB_ROOT_PASSWORD} < backend/database/performance_optimizations.sql

# Verify database setup
docker exec -i lms-mysql mysql -u root -p${DB_ROOT_PASSWORD} -e "SHOW DATABASES;"
```

## 🔧 Manual Installation (Non-Docker)

### 1. Install Dependencies

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL 8.0
sudo apt install mysql-server-8.0 -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2

# Install Docker (for code execution)
sudo apt install docker.io -y
sudo usermod -aG docker $USER
```

#### CentOS/RHEL
```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install MySQL 8.0
sudo yum install mysql-server -y

# Install Redis
sudo yum install redis -y

# Install Nginx
sudo yum install nginx -y

# Install PM2
sudo npm install -g pm2

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo usermod -aG docker $USER
```

### 2. Database Setup
```bash
# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE lms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON lms_platform.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Redis Setup
```bash
# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Configure Redis for production
sudo nano /etc/redis/redis.conf
```

Add these configurations:
```
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 4. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

Configure your `.env` file:
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=lms_user
DB_PASSWORD=your_secure_password
DB_NAME=lms_platform
DB_CONNECTION_LIMIT=100
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_super_secure_jwt_secret_key
```

### 5. Start Backend with PM2
```bash
# Start with PM2 cluster
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 6. Frontend Setup
```bash
# Navigate to root directory
cd ..

# Install dependencies
npm install

# Build for production
npm run build

# Copy build files to web directory
sudo cp -r dist/* /var/www/html/
```

### 7. Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/lms-platform
```

Add the configuration from `nginx.conf` file.

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/lms-platform /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 📊 Performance Optimization

### 1. Database Optimization
```sql
-- Run performance optimizations
mysql -u root -p < backend/database/performance_optimizations.sql

-- Monitor performance
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
```

### 2. Redis Optimization
```bash
# Monitor Redis
redis-cli info memory
redis-cli info stats

# Check connections
redis-cli info clients
```

### 3. System Optimization
```bash
# Increase file limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" | sudo tee -a /etc/sysctl.conf
echo "vm.swappiness = 10" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 🔍 Monitoring and Health Checks

### 1. Health Check Endpoints
- **Overall Health**: `http://your-domain.com/health`
- **Readiness**: `http://your-domain.com/health/ready`
- **Liveness**: `http://your-domain.com/health/live`
- **Metrics**: `http://your-domain.com/metrics`

### 2. Monitoring Setup
```bash
# Access Grafana (if using Docker)
http://your-domain.com:3000
Username: admin
Password: your_grafana_password

# Access Prometheus
http://your-domain.com:9090
```

### 3. Log Monitoring
```bash
# View application logs
pm2 logs

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system logs
sudo journalctl -u nginx -f
sudo journalctl -u mysql -f
```

## 🚀 Scaling for 5000+ Users

### 1. Horizontal Scaling
```bash
# Scale backend instances
pm2 scale lms-backend 8

# Or with Docker Compose
docker-compose -f docker-compose.production.yml up -d --scale backend=4
```

### 2. Load Balancer Configuration
```nginx
# Add multiple backend servers in nginx.conf
upstream backend {
    least_conn;
    server backend1:5000 max_fails=3 fail_timeout=30s;
    server backend2:5000 max_fails=3 fail_timeout=30s;
    server backend3:5000 max_fails=3 fail_timeout=30s;
    server backend4:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

### 3. Database Scaling
```sql
-- Read replicas for read-heavy workloads
-- Master-Slave replication setup
-- Connection pooling optimization
```

### 4. Redis Clustering
```bash
# Redis Cluster setup for high availability
# Multiple Redis instances with failover
```

## 🔒 Security Configuration

### 1. SSL/TLS Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Firewall Configuration
```bash
# Configure UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Database Security
```sql
-- Remove test databases
DROP DATABASE IF EXISTS test;

-- Create read-only user for analytics
CREATE USER 'lms_readonly'@'localhost' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON lms_platform.* TO 'lms_readonly'@'localhost';
```

## 📈 Performance Testing

### 1. Load Testing with Artillery
```bash
# Install Artillery
npm install -g artillery

# Create load test
cat > load-test.yml << EOF
config:
  target: 'http://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 100
scenarios:
  - name: "API Load Test"
    weight: 100
    flow:
      - get:
          url: "/api/health"
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password"
EOF

# Run load test
artillery run load-test.yml
```

### 2. Database Performance Testing
```sql
-- Test concurrent connections
-- Monitor query performance
-- Check index usage
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. High Memory Usage
```bash
# Check memory usage
free -h
pm2 monit

# Restart services if needed
pm2 restart all
```

#### 2. Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Check connections
mysql -u root -p -e "SHOW PROCESSLIST;"
```

#### 3. Redis Connection Issues
```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping
```

#### 4. Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

## 📋 Maintenance

### 1. Regular Backups
```bash
# Database backup
mysqldump -u root -p lms_platform > backup_$(date +%Y%m%d).sql

# Redis backup
redis-cli BGSAVE

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/html/
```

### 2. Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/lms-platform
```

### 3. Updates
```bash
# Update application
git pull origin main
npm install
npm run build
pm2 restart all

# Update system
sudo apt update && sudo apt upgrade -y
```

## 📞 Support

For issues and support:
1. Check the health endpoints
2. Review logs
3. Monitor system resources
4. Check database performance
5. Verify Redis connectivity

## 🎯 Expected Performance

With this configuration, you should achieve:
- **Concurrent Users**: 5000+
- **Response Time**: <200ms average
- **Throughput**: 1000+ requests/second
- **Uptime**: 99.9%+
- **Memory Usage**: <16GB total
- **CPU Usage**: <80% average

## 🔄 Updates and Scaling

To scale beyond 5000 users:
1. Add more backend instances
2. Implement database sharding
3. Use Redis Cluster
4. Add CDN for static assets
5. Implement microservices architecture
6. Use Kubernetes for orchestration

---

**Note**: This guide assumes a single-server deployment. For production environments with 10,000+ users, consider multi-server deployment with load balancers, database clusters, and microservices architecture.
