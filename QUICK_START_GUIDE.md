# 🚀 AI LMS Platform - Quick Start Guide

This guide will help you quickly set up the AI LMS Platform with all external services for 5000+ concurrent users.

## 📋 Prerequisites

- **OS**: Ubuntu 20.04+, CentOS 8+, macOS, or Windows 10+
- **RAM**: 8GB+ (16GB+ recommended)
- **CPU**: 4+ cores (8+ recommended)
- **Storage**: 100GB+ free space
- **Internet**: Stable connection for downloading packages

## ⚡ Quick Setup (Linux/macOS)

### Option 1: Automated Setup (Recommended)
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ai-lms-platform

# 2. Make scripts executable
chmod +x *.sh

# 3. Run the master setup script
./setup-all-services.sh
```

### Option 2: Individual Service Setup
```bash
# Install Redis
./setup-redis.sh

# Install MySQL
./setup-mysql.sh

# Install Docker
./setup-docker.sh

# Install Nginx
./setup-nginx.sh
```

## 🪟 Quick Setup (Windows)

### PowerShell (Run as Administrator)
```powershell
# 1. Clone the repository
git clone <your-repo-url>
cd ai-lms-platform

# 2. Run the Windows setup script
.\setup-windows.ps1

# 3. Restart computer if Docker was installed
# 4. Start Docker Desktop manually
# 5. Run: .\start-services.bat
```

## 🔧 Manual Setup (Step by Step)

### 1. Install Redis
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis

# CentOS/RHEL
sudo yum install redis -y
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis
```

### 2. Install MySQL 8.0
```bash
# Ubuntu/Debian
sudo apt install mysql-server-8.0 -y
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation

# CentOS/RHEL
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo systemctl enable mysqld
sudo mysql_secure_installation

# macOS
brew install mysql
brew services start mysql
```

### 3. Install Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# CentOS/RHEL
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# macOS
brew install --cask docker
# Start Docker Desktop manually
```

### 4. Install Node.js 18
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# macOS
brew install node

# Install PM2 globally
sudo npm install -g pm2
```

### 5. Install Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# CentOS/RHEL
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# macOS
brew install nginx
brew services start nginx
```

## 🚀 Start the Application

### 1. Configure Environment
```bash
# Copy environment file
cp env.production.example .env.production

# Edit with your settings
nano .env.production
```

### 2. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
npm install
```

### 3. Start Backend
```bash
cd backend
pm2 start ecosystem.config.js --env production
cd ..
```

### 4. Build and Serve Frontend
```bash
# Build frontend
npm run build

# Copy to web directory
sudo cp -r dist/* /var/www/html/
# Or on Windows: copy dist\* C:\lms-platform\www\
```

## 🔍 Verify Installation

### Check Service Status
```bash
# Redis
redis-cli ping
# Should return: PONG

# MySQL
mysql -u root -p -e "SELECT 1;"
# Should return: 1

# Docker
docker --version
# Should show Docker version

# Nginx
curl http://localhost
# Should return HTML content

# PM2
pm2 list
# Should show running processes
```

### Test Application
```bash
# Health check
curl http://localhost:5000/health

# API test
curl http://localhost:5000/api/health
```

## 📊 Performance Monitoring

### View Logs
```bash
# Application logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### Monitor Resources
```bash
# System resources
htop
# Or
top

# Disk usage
df -h

# Memory usage
free -h
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Redis Connection Failed
```bash
# Check Redis status
sudo systemctl status redis

# Restart Redis
sudo systemctl restart redis

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

#### 2. MySQL Connection Failed
```bash
# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

#### 3. Docker Permission Denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
# Or run: newgrp docker
```

#### 4. Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 list

# Check backend logs
pm2 logs

# Restart backend
pm2 restart all
```

#### 5. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :5000

# Kill the process
sudo kill -9 <PID>
```

## 🔧 Configuration

### Database Configuration
```sql
-- Create database
CREATE DATABASE lms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON lms_platform.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
```

### Redis Configuration
```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Set memory limit
maxmemory 512mb
maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis
```

### Nginx Configuration
```bash
# Edit Nginx config
sudo nano /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend instances
pm2 scale lms-backend 4

# Or with Docker Compose
docker-compose up -d --scale backend=4
```

### Load Balancing
```nginx
# Add multiple backend servers in nginx.conf
upstream backend {
    least_conn;
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
    server 127.0.0.1:5003;
}
```

## 🔒 Security

### Firewall Configuration
```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### SSL Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 📞 Support

### Health Check Endpoints
- **Overall Health**: `http://your-domain.com/health`
- **Readiness**: `http://your-domain.com/health/ready`
- **Liveness**: `http://your-domain.com/health/live`
- **Metrics**: `http://your-domain.com/metrics`

### Useful Commands
```bash
# Start all services
./start-services.sh

# Stop all services
./stop-services.sh

# Monitor services
./monitor-services.sh

# Backup database
./backup-database.sh
```

## 🎯 Expected Performance

With this setup, you should achieve:
- **Concurrent Users**: 5000+
- **Response Time**: <200ms average
- **Throughput**: 1000+ requests/second
- **Uptime**: 99.9%+
- **Memory Usage**: <16GB total
- **CPU Usage**: <80% average

## 🔄 Next Steps

1. **Configure your domain name**
2. **Set up SSL certificates**
3. **Configure monitoring alerts**
4. **Set up regular backups**
5. **Test with load testing tools**
6. **Monitor performance metrics**

---

**Need Help?** Check the detailed [DEPLOYMENT_GUIDE_5000_USERS.md](DEPLOYMENT_GUIDE_5000_USERS.md) for comprehensive instructions.
