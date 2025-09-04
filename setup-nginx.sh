#!/bin/bash

# Nginx Setup Script for AI LMS Platform
# This script installs and configures Nginx as a load balancer and reverse proxy

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

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        OS="unknown"
    fi
    print_status "Detected OS: $OS"
}

# Install Nginx
install_nginx() {
    print_status "Installing Nginx..."
    
    case $OS in
        "debian")
            sudo apt update
            sudo apt install -y nginx
            ;;
        "redhat")
            sudo yum install -y nginx
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install nginx
            else
                print_error "Homebrew not found. Please install Nginx manually."
                exit 1
            fi
            ;;
        *)
            print_error "Unsupported OS. Please install Nginx manually."
            exit 1
            ;;
    esac
    
    print_success "Nginx installed successfully"
}

# Configure Nginx for production
configure_nginx() {
    print_status "Configuring Nginx for high performance..."
    
    # Find Nginx config directory
    NGINX_CONF_DIR=""
    if [ -d /etc/nginx ]; then
        NGINX_CONF_DIR="/etc/nginx"
    elif [ -d /usr/local/etc/nginx ]; then
        NGINX_CONF_DIR="/usr/local/etc/nginx"
    elif [ -d /opt/homebrew/etc/nginx ]; then
        NGINX_CONF_DIR="/opt/homebrew/etc/nginx"
    else
        print_error "Nginx configuration directory not found"
        exit 1
    fi
    
    print_status "Using Nginx config directory: $NGINX_CONF_DIR"
    
    # Backup original config
    sudo cp $NGINX_CONF_DIR/nginx.conf ${NGINX_CONF_DIR}/nginx.conf.backup
    
    # Create optimized Nginx configuration
    cat > /tmp/nginx_optimized.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
    worker_rlimit_nofile 65535;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

    # Upstream backend servers
    upstream backend {
        least_conn;
        server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # Main server block
    server {
        listen 80;
        server_name _;
        root /var/www/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Auth routes with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Upload routes
        location /api/upload/ {
            limit_req zone=upload burst=5 nodelay;
            client_max_body_size 10M;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend;
            access_log off;
        }

        # Static files with caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options "nosniff";
        }

        # HTML files
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public";
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security
        location ~ /\. {
            deny all;
        }

        # Error pages
        error_page 404 /index.html;
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /var/www/html;
        }
    }
}
EOF

    # Apply configuration
    sudo cp /tmp/nginx_optimized.conf $NGINX_CONF_DIR/nginx.conf
    
    # Create web directory
    sudo mkdir -p /var/www/html
    sudo chown -R nginx:nginx /var/www/html 2>/dev/null || sudo chown -R www-data:www-data /var/www/html 2>/dev/null || true
    
    print_success "Nginx configured for high performance"
}

# Start Nginx service
start_nginx() {
    print_status "Starting Nginx service..."
    
    case $OS in
        "debian"|"redhat")
            sudo systemctl enable nginx
            sudo systemctl start nginx
            sudo systemctl status nginx --no-pager
            ;;
        "macos")
            sudo brew services start nginx
            ;;
    esac
    
    # Test Nginx
    if curl -f http://localhost >/dev/null 2>&1; then
        print_success "Nginx is running and responding"
    else
        print_warning "Nginx may need configuration"
    fi
}

# Test Nginx performance
test_nginx() {
    print_status "Testing Nginx performance..."
    
    # Create test HTML file
    sudo tee /var/www/html/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>AI LMS Platform</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .status { color: green; font-size: 24px; }
    </style>
</head>
<body>
    <h1>AI LMS Platform</h1>
    <p class="status">✅ Nginx is working correctly!</p>
    <p>Backend API: <a href="/api/health">/api/health</a></p>
</body>
</html>
EOF

    # Test with curl
    echo "Testing Nginx response..."
    curl -I http://localhost
    
    print_success "Nginx performance test completed"
}

# Setup SSL (optional)
setup_ssl() {
    print_status "Setting up SSL (optional)..."
    
    if command -v certbot &> /dev/null; then
        print_status "Certbot found. You can set up SSL certificates with:"
        echo "sudo certbot --nginx -d your-domain.com"
    else
        print_status "Installing Certbot for SSL..."
        case $OS in
            "debian")
                sudo apt install -y certbot python3-certbot-nginx
                ;;
            "redhat")
                sudo yum install -y certbot python3-certbot-nginx
                ;;
        esac
    fi
    
    print_success "SSL setup ready"
}

# Show Nginx status
show_status() {
    print_status "Nginx Status:"
    echo ""
    
    # Show Nginx version
    nginx -v
    echo ""
    
    # Show configuration test
    sudo nginx -t
    echo ""
    
    # Show active connections
    curl -s http://localhost/nginx_status 2>/dev/null || echo "Status module not enabled"
    echo ""
    
    print_status "Nginx Configuration:"
    echo "  Port: 80"
    echo "  Worker Processes: auto"
    echo "  Worker Connections: 1024"
    echo "  Gzip Compression: enabled"
    echo "  Rate Limiting: enabled"
    echo "  Load Balancing: enabled"
    echo ""
    
    print_status "Useful Commands:"
    echo "  Test config: sudo nginx -t"
    echo "  Reload: sudo systemctl reload nginx"
    echo "  Restart: sudo systemctl restart nginx"
    echo "  Status: sudo systemctl status nginx"
    echo "  Logs: sudo tail -f /var/log/nginx/access.log"
    echo "  Error logs: sudo tail -f /var/log/nginx/error.log"
}

# Main function
main() {
    echo "🌐 Nginx Setup for AI LMS Platform"
    echo "=================================="
    echo ""
    
    detect_os
    install_nginx
    configure_nginx
    start_nginx
    test_nginx
    setup_ssl
    show_status
    
    echo ""
    print_success "🎉 Nginx setup completed successfully!"
    print_warning "Remember to:"
    print_warning "1. Configure your domain name"
    print_warning "2. Set up SSL certificates"
    print_warning "3. Configure firewall rules"
    print_warning "4. Monitor Nginx performance"
    print_warning "5. Set up log rotation"
}

# Run main function
main "$@"
