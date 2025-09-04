#!/bin/bash

# AI LMS Platform - Quick Deployment Script for 5000+ Users
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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
    if [ $MEMORY_GB -lt 16 ]; then
        print_warning "System has ${MEMORY_GB}GB RAM. Recommended: 32GB+ for 5000+ users"
    fi
    
    # Check CPU cores
    CPU_CORES=$(nproc)
    if [ $CPU_CORES -lt 4 ]; then
        print_warning "System has ${CPU_CORES} CPU cores. Recommended: 8+ for 5000+ users"
    fi
    
    # Check available disk space
    DISK_GB=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    if [ $DISK_GB -lt 100 ]; then
        print_warning "Available disk space: ${DISK_GB}GB. Recommended: 500GB+"
    fi
    
    print_success "System requirements check completed"
}

# Install Docker and Docker Compose
install_docker() {
    print_status "Installing Docker and Docker Compose..."
    
    if ! command -v docker &> /dev/null; then
        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        print_success "Docker installed successfully"
    else
        print_success "Docker is already installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        # Install Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        print_success "Docker Compose installed successfully"
    else
        print_success "Docker Compose is already installed"
    fi
}

# Setup environment
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env.production ]; then
        cp env.production.example .env.production
        print_warning "Please edit .env.production with your configuration"
        print_warning "Important: Change default passwords and JWT secret!"
        
        # Generate a random JWT secret
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
        sed -i "s/your_super_secure_jwt_secret_key_here_minimum_64_characters/$JWT_SECRET/" .env.production
        
        print_success "Generated random JWT secret"
    else
        print_success "Environment file already exists"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p temp
    mkdir -p ssl
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/provisioning
    
    print_success "Directories created"
}

# Deploy with Docker Compose
deploy_docker() {
    print_status "Deploying with Docker Compose..."
    
    # Pull latest images
    docker-compose -f docker-compose.production.yml pull
    
    # Start services
    docker-compose -f docker-compose.production.yml up -d
    
    print_success "Services started"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for database..."
    timeout 60 bash -c 'until docker exec lms-mysql mysqladmin ping -h localhost --silent; do sleep 2; done'
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    timeout 30 bash -c 'until docker exec lms-redis redis-cli ping; do sleep 2; done'
    
    # Wait for backend
    print_status "Waiting for backend..."
    timeout 60 bash -c 'until curl -f http://localhost:5000/health > /dev/null 2>&1; do sleep 2; done'
    
    print_success "All services are ready"
}

# Initialize database
init_database() {
    print_status "Initializing database with optimizations..."
    
    # Wait a bit more for database to be fully ready
    sleep 10
    
    # Run performance optimizations
    docker exec -i lms-mysql mysql -u root -p${DB_ROOT_PASSWORD:-rootpassword} < backend/database/performance_optimizations.sql || {
        print_warning "Database optimization failed. You may need to run it manually."
    }
    
    print_success "Database initialized"
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    
    # Show running containers
    docker-compose -f docker-compose.production.yml ps
    
    echo ""
    print_status "Service URLs:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost:5000"
    echo "  Health Check: http://localhost:5000/health"
    echo "  Metrics: http://localhost:5000/metrics"
    echo "  Grafana: http://localhost:3000 (admin/your_grafana_password)"
    echo "  Prometheus: http://localhost:9090"
    
    echo ""
    print_status "Useful Commands:"
    echo "  View logs: docker-compose -f docker-compose.production.yml logs -f"
    echo "  Stop services: docker-compose -f docker-compose.production.yml down"
    echo "  Restart services: docker-compose -f docker-compose.production.yml restart"
    echo "  Scale backend: docker-compose -f docker-compose.production.yml up -d --scale backend=4"
}

# Main deployment function
main() {
    echo "🚀 AI LMS Platform - Production Deployment for 5000+ Users"
    echo "=================================================="
    echo ""
    
    # Check if .env.production exists
    if [ ! -f .env.production ]; then
        print_error ".env.production file not found!"
        print_error "Please copy env.production.example to .env.production and configure it first."
        exit 1
    fi
    
    # Load environment variables
    source .env.production
    
    # Run deployment steps
    check_requirements
    install_docker
    setup_environment
    create_directories
    deploy_docker
    wait_for_services
    init_database
    show_status
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    print_warning "Remember to:"
    print_warning "1. Configure your domain name in .env.production"
    print_warning "2. Set up SSL certificates"
    print_warning "3. Configure firewall rules"
    print_warning "4. Set up monitoring alerts"
    print_warning "5. Create regular backups"
    echo ""
    print_status "For detailed configuration, see DEPLOYMENT_GUIDE_5000_USERS.md"
}

# Run main function
main "$@"
