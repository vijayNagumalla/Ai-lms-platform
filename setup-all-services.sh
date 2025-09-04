#!/bin/bash

# Master Setup Script for AI LMS Platform
# This script installs and configures all external services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check available memory
    MEMORY_GB=$(free -g | awk 'NR==2{printf "%.0f", $2}')
    if [ $MEMORY_GB -lt 8 ]; then
        print_warning "System has ${MEMORY_GB}GB RAM. Recommended: 16GB+ for optimal performance"
    fi
    
    # Check CPU cores
    CPU_CORES=$(nproc)
    if [ $CPU_CORES -lt 2 ]; then
        print_warning "System has ${CPU_CORES} CPU cores. Recommended: 4+ for optimal performance"
    fi
    
    # Check available disk space
    DISK_GB=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    if [ $DISK_GB -lt 50 ]; then
        print_warning "Available disk space: ${DISK_GB}GB. Recommended: 100GB+"
    fi
    
    print_success "System requirements check completed"
}

# Update system packages
update_system() {
    print_status "Updating system packages..."
    
    if command -v apt &> /dev/null; then
        sudo apt update && sudo apt upgrade -y
    elif command -v yum &> /dev/null; then
        sudo yum update -y
    elif command -v brew &> /dev/null; then
        brew update
    fi
    
    print_success "System packages updated"
}

# Install Node.js
install_nodejs() {
    print_status "Installing Node.js 18..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ $NODE_VERSION -ge 18 ]; then
            print_success "Node.js $NODE_VERSION is already installed"
            return
        fi
    fi
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install PM2 globally
    sudo npm install -g pm2
    
    print_success "Node.js and PM2 installed successfully"
}

# Run individual setup scripts
run_setup_scripts() {
    print_status "Running individual service setup scripts..."
    
    # Make scripts executable
    chmod +x setup-redis.sh
    chmod +x setup-mysql.sh
    chmod +x setup-docker.sh
    chmod +x setup-nginx.sh
    
    # Run Redis setup
    print_status "Setting up Redis..."
    ./setup-redis.sh
    
    # Run MySQL setup
    print_status "Setting up MySQL..."
    ./setup-mysql.sh
    
    # Run Docker setup
    print_status "Setting up Docker..."
    ./setup-docker.sh
    
    # Run Nginx setup
    print_status "Setting up Nginx..."
    ./setup-nginx.sh
    
    print_success "All services setup completed"
}

# Install application dependencies
install_app_dependencies() {
    print_status "Installing application dependencies..."
    
    # Backend dependencies
    cd backend
    npm install
    cd ..
    
    # Frontend dependencies
    npm install
    
    print_success "Application dependencies installed"
}

# Create systemd services
create_systemd_services() {
    print_status "Creating systemd services..."
    
    # Create PM2 systemd service
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
    
    print_success "Systemd services created"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up basic monitoring..."
    
    # Create monitoring directory
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/provisioning
    
    # Create basic monitoring script
    cat > monitor-services.sh << 'EOF'
#!/bin/bash

echo "=== AI LMS Platform Service Status ==="
echo ""

# Check Redis
if redis-cli ping &>/dev/null; then
    echo "✅ Redis: Running"
else
    echo "❌ Redis: Not running"
fi

# Check MySQL
if mysql -u lms_user -plms_secure_password_2024 -e "SELECT 1;" &>/dev/null; then
    echo "✅ MySQL: Running"
else
    echo "❌ MySQL: Not running"
fi

# Check Docker
if docker --version &>/dev/null; then
    echo "✅ Docker: Running"
else
    echo "❌ Docker: Not running"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Not running"
fi

# Check PM2
if pm2 list &>/dev/null; then
    echo "✅ PM2: Running"
    pm2 list
else
    echo "❌ PM2: Not running"
fi

echo ""
echo "=== System Resources ==="
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h
echo ""
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)"
EOF

    chmod +x monitor-services.sh
    
    print_success "Basic monitoring setup completed"
}

# Create backup scripts
create_backup_scripts() {
    print_status "Creating backup scripts..."
    
    # Database backup script
    cat > backup-database.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/lms-platform"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MySQL database
mysqldump -u lms_user -plms_secure_password_2024 lms_platform > $BACKUP_DIR/lms_platform_$DATE.sql

# Backup Redis
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
EOF

    chmod +x backup-database.sh
    
    # Create cron job for daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/backup-database.sh") | crontab -
    
    print_success "Backup scripts created"
}

# Test all services
test_all_services() {
    print_status "Testing all services..."
    
    # Test Redis
    if redis-cli ping | grep -q "PONG"; then
        print_success "Redis test passed"
    else
        print_error "Redis test failed"
    fi
    
    # Test MySQL
    if mysql -u lms_user -plms_secure_password_2024 -e "SELECT 1;" &>/dev/null; then
        print_success "MySQL test passed"
    else
        print_error "MySQL test failed"
    fi
    
    # Test Docker
    if docker --version &>/dev/null; then
        print_success "Docker test passed"
    else
        print_error "Docker test failed"
    fi
    
    # Test Nginx
    if curl -f http://localhost >/dev/null 2>&1; then
        print_success "Nginx test passed"
    else
        print_error "Nginx test failed"
    fi
    
    print_success "All service tests completed"
}

# Show final status
show_final_status() {
    print_status "Final Service Status:"
    echo ""
    
    # Run monitoring script
    ./monitor-services.sh
    
    echo ""
    print_status "Service URLs:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost:5000 (when running)"
    echo "  Health Check: http://localhost:5000/health (when running)"
    echo ""
    
    print_status "Service Management:"
    echo "  Redis: sudo systemctl start/stop/restart redis"
    echo "  MySQL: sudo systemctl start/stop/restart mysql"
    echo "  Docker: sudo systemctl start/stop/restart docker"
    echo "  Nginx: sudo systemctl start/stop/restart nginx"
    echo "  PM2: pm2 start/stop/restart ecosystem.config.js"
    echo ""
    
    print_status "Configuration Files:"
    echo "  Redis: /etc/redis/redis.conf"
    echo "  MySQL: /etc/mysql/mysql.conf.d/mysqld.cnf"
    echo "  Nginx: /etc/nginx/nginx.conf"
    echo "  PM2: ecosystem.config.js"
    echo ""
    
    print_status "Log Files:"
    echo "  Redis: /var/log/redis/redis-server.log"
    echo "  MySQL: /var/log/mysql/error.log"
    echo "  Nginx: /var/log/nginx/access.log"
    echo "  PM2: pm2 logs"
    echo ""
    
    print_status "Next Steps:"
    echo "1. Start your application: cd backend && pm2 start ecosystem.config.js"
    echo "2. Build frontend: npm run build"
    echo "3. Copy frontend files: sudo cp -r dist/* /var/www/html/"
    echo "4. Configure your domain name"
    echo "5. Set up SSL certificates"
    echo "6. Run database optimizations: mysql -u root -p < backend/database/performance_optimizations.sql"
}

# Main function
main() {
    echo "🚀 AI LMS Platform - Complete Service Setup"
    echo "==========================================="
    echo ""
    
    check_requirements
    update_system
    install_nodejs
    run_setup_scripts
    install_app_dependencies
    create_systemd_services
    setup_monitoring
    create_backup_scripts
    test_all_services
    show_final_status
    
    echo ""
    print_success "🎉 All external services setup completed successfully!"
    print_warning "Important:"
    print_warning "1. Change all default passwords in production"
    print_warning "2. Configure firewall rules"
    print_warning "3. Set up SSL certificates"
    print_warning "4. Monitor service performance"
    print_warning "5. Test your application thoroughly"
    echo ""
    print_status "For detailed configuration, see DEPLOYMENT_GUIDE_5000_USERS.md"
}

# Run main function
main "$@"
