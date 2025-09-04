#!/bin/bash

# Redis Setup Script for AI LMS Platform
# This script installs and configures Redis for high-performance caching

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

# Install Redis
install_redis() {
    print_status "Installing Redis..."
    
    case $OS in
        "debian")
            sudo apt update
            sudo apt install -y redis-server
            ;;
        "redhat")
            sudo yum install -y epel-release
            sudo yum install -y redis
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install redis
            else
                print_error "Homebrew not found. Please install Homebrew first."
                exit 1
            fi
            ;;
        *)
            print_error "Unsupported OS. Please install Redis manually."
            exit 1
            ;;
    esac
    
    print_success "Redis installed successfully"
}

# Configure Redis for production
configure_redis() {
    print_status "Configuring Redis for high performance..."
    
    # Find Redis config file
    REDIS_CONF=""
    if [ -f /etc/redis/redis.conf ]; then
        REDIS_CONF="/etc/redis/redis.conf"
    elif [ -f /usr/local/etc/redis.conf ]; then
        REDIS_CONF="/usr/local/etc/redis.conf"
    elif [ -f /opt/homebrew/etc/redis.conf ]; then
        REDIS_CONF="/opt/homebrew/etc/redis.conf"
    else
        print_error "Redis configuration file not found"
        exit 1
    fi
    
    print_status "Using Redis config: $REDIS_CONF"
    
    # Backup original config
    sudo cp $REDIS_CONF ${REDIS_CONF}.backup
    
    # Create optimized Redis configuration
    cat > /tmp/redis_optimized.conf << 'EOF'
# Redis Configuration for AI LMS Platform - 5000+ Users

# Network
bind 127.0.0.1
port 6379
timeout 300
tcp-keepalive 300

# Memory Management
maxmemory 512mb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
syslog-enabled no

# Performance
tcp-backlog 511
databases 16
always-show-logo yes

# Security
# requirepass your_redis_password_here
# rename-command FLUSHDB ""
# rename-command FLUSHALL ""

# Client Management
maxclients 10000
timeout 300

# Advanced Configuration
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
EOF

    # Apply configuration
    sudo cp /tmp/redis_optimized.conf $REDIS_CONF
    
    # Create log directory
    sudo mkdir -p /var/log/redis
    sudo chown redis:redis /var/log/redis 2>/dev/null || true
    
    # Set proper permissions
    sudo chown redis:redis /var/lib/redis 2>/dev/null || true
    
    print_success "Redis configured for high performance"
}

# Start Redis service
start_redis() {
    print_status "Starting Redis service..."
    
    case $OS in
        "debian"|"redhat")
            sudo systemctl enable redis
            sudo systemctl start redis
            sudo systemctl status redis --no-pager
            ;;
        "macos")
            brew services start redis
            ;;
    esac
    
    # Test Redis connection
    sleep 2
    if redis-cli ping | grep -q "PONG"; then
        print_success "Redis is running and responding"
    else
        print_error "Redis failed to start or is not responding"
        exit 1
    fi
}

# Test Redis performance
test_redis() {
    print_status "Testing Redis performance..."
    
    # Create test script
    cat > /tmp/redis_test.js << 'EOF'
const redis = require('redis');
const client = redis.createClient();

async function testRedis() {
    try {
        await client.connect();
        
        console.log('Testing Redis performance...');
        
        // Test basic operations
        const start = Date.now();
        
        for (let i = 0; i < 1000; i++) {
            await client.set(`test:key:${i}`, `value:${i}`);
        }
        
        for (let i = 0; i < 1000; i++) {
            await client.get(`test:key:${i}`);
        }
        
        const end = Date.now();
        const duration = end - start;
        
        console.log(`1000 set/get operations completed in ${duration}ms`);
        console.log(`Average: ${duration/1000}ms per operation`);
        
        // Cleanup
        await client.del('test:key:*');
        await client.quit();
        
        console.log('Redis performance test completed successfully');
    } catch (error) {
        console.error('Redis test failed:', error);
        process.exit(1);
    }
}

testRedis();
EOF

    # Install redis client if not available
    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found. Skipping performance test."
        return
    fi
    
    if ! npm list redis &> /dev/null; then
        npm install redis
    fi
    
    # Run test
    node /tmp/redis_test.js
    
    # Cleanup
    rm /tmp/redis_test.js
    
    print_success "Redis performance test completed"
}

# Show Redis status
show_status() {
    print_status "Redis Status:"
    echo ""
    
    # Show Redis info
    redis-cli info server | head -10
    echo ""
    redis-cli info memory | head -5
    echo ""
    redis-cli info clients | head -5
    echo ""
    
    print_status "Redis Configuration:"
    echo "  Port: 6379"
    echo "  Max Memory: 512MB"
    echo "  Max Clients: 10000"
    echo "  Persistence: RDB + AOF"
    echo "  Eviction Policy: allkeys-lru"
    echo ""
    
    print_status "Useful Commands:"
    echo "  Check status: redis-cli ping"
    echo "  Monitor: redis-cli monitor"
    echo "  Info: redis-cli info"
    echo "  Memory usage: redis-cli info memory"
    echo "  Client list: redis-cli client list"
}

# Main function
main() {
    echo "🔴 Redis Setup for AI LMS Platform"
    echo "=================================="
    echo ""
    
    detect_os
    install_redis
    configure_redis
    start_redis
    test_redis
    show_status
    
    echo ""
    print_success "🎉 Redis setup completed successfully!"
    print_warning "Remember to:"
    print_warning "1. Set a password in Redis config if needed"
    print_warning "2. Configure firewall rules for Redis port"
    print_warning "3. Monitor Redis memory usage"
    print_warning "4. Set up Redis persistence backup"
}

# Run main function
main "$@"
