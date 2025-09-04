#!/bin/bash

# MySQL Setup Script for AI LMS Platform
# This script installs and configures MySQL 8.0 for high-performance database operations

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

# Install MySQL
install_mysql() {
    print_status "Installing MySQL 8.0..."
    
    case $OS in
        "debian")
            # Add MySQL APT repository
            wget https://dev.mysql.com/get/mysql-apt-config_0.8.24-1_all.deb
            sudo dpkg -i mysql-apt-config_0.8.24-1_all.deb
            sudo apt update
            sudo apt install -y mysql-server
            ;;
        "redhat")
            sudo yum install -y mysql-server
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install mysql
            else
                print_error "Homebrew not found. Please install Homebrew first."
                exit 1
            fi
            ;;
        *)
            print_error "Unsupported OS. Please install MySQL manually."
            exit 1
            ;;
    esac
    
    print_success "MySQL installed successfully"
}

# Configure MySQL for production
configure_mysql() {
    print_status "Configuring MySQL for high performance..."
    
    # Find MySQL config file
    MYSQL_CONF=""
    if [ -f /etc/mysql/mysql.conf.d/mysqld.cnf ]; then
        MYSQL_CONF="/etc/mysql/mysql.conf.d/mysqld.cnf"
    elif [ -f /etc/my.cnf ]; then
        MYSQL_CONF="/etc/my.cnf"
    elif [ -f /usr/local/etc/my.cnf ]; then
        MYSQL_CONF="/usr/local/etc/my.cnf"
    else
        print_warning "MySQL config file not found. Creating custom config."
        MYSQL_CONF="/etc/mysql/my.cnf"
    fi
    
    print_status "Using MySQL config: $MYSQL_CONF"
    
    # Backup original config
    sudo cp $MYSQL_CONF ${MYSQL_CONF}.backup 2>/dev/null || true
    
    # Create optimized MySQL configuration
    cat > /tmp/mysql_optimized.cnf << 'EOF'
[mysqld]
# Basic Settings
user = mysql
default-storage-engine = InnoDB
socket = /var/run/mysqld/mysqld.sock
pid-file = /var/run/mysqld/mysqld.pid

# Network Settings
bind-address = 0.0.0.0
port = 3306
max_connections = 1000
max_connect_errors = 100000
connect_timeout = 60
wait_timeout = 28800
interactive_timeout = 28800

# InnoDB Settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_log_buffer_size = 16M
innodb_flush_log_at_trx_commit = 2
innodb_file_per_table = 1
innodb_open_files = 400
innodb_io_capacity = 400
innodb_flush_method = O_DIRECT

# Query Cache
query_cache_size = 256M
query_cache_type = 1
query_cache_limit = 1M

# MyISAM Settings
key_buffer_size = 32M
max_allowed_packet = 64M
thread_stack = 256K
thread_cache_size = 8
myisam_recover_options = BACKUP

# Logging
log-error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_queries_not_using_indexes = 1

# Binary Logging
log-bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7
max_binlog_size = 100M

# Security
local-infile = 0
symbolic-links = 0

# Performance Schema
performance_schema = ON
performance_schema_max_table_instances = 500
performance_schema_max_table_handles = 1000

# Character Set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
init_connect = 'SET NAMES utf8mb4'

[mysql]
default-character-set = utf8mb4

[client]
default-character-set = utf8mb4
EOF

    # Apply configuration
    sudo cp /tmp/mysql_optimized.cnf $MYSQL_CONF
    
    # Create log directory
    sudo mkdir -p /var/log/mysql
    sudo chown mysql:mysql /var/log/mysql
    
    print_success "MySQL configured for high performance"
}

# Start MySQL service
start_mysql() {
    print_status "Starting MySQL service..."
    
    case $OS in
        "debian"|"redhat")
            sudo systemctl enable mysql
            sudo systemctl start mysql
            sudo systemctl status mysql --no-pager
            ;;
        "macos")
            brew services start mysql
            ;;
    esac
    
    # Wait for MySQL to start
    sleep 5
    
    # Test MySQL connection
    if mysql -u root -e "SELECT 1;" &>/dev/null; then
        print_success "MySQL is running and responding"
    else
        print_warning "MySQL may need initial setup"
    fi
}

# Secure MySQL installation
secure_mysql() {
    print_status "Securing MySQL installation..."
    
    # Generate random password
    MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Create secure installation script
    cat > /tmp/mysql_secure.sql << EOF
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Remove test database
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Create application database
CREATE DATABASE IF NOT EXISTS lms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user
CREATE USER IF NOT EXISTS 'lms_user'@'localhost' IDENTIFIED BY 'lms_secure_password_2024';
CREATE USER IF NOT EXISTS 'lms_user'@'%' IDENTIFIED BY 'lms_secure_password_2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON lms_platform.* TO 'lms_user'@'localhost';
GRANT ALL PRIVILEGES ON lms_platform.* TO 'lms_user'@'%';

-- Create read-only user for analytics
CREATE USER IF NOT EXISTS 'lms_readonly'@'localhost' IDENTIFIED BY 'readonly_password_2024';
GRANT SELECT ON lms_platform.* TO 'lms_readonly'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Show databases
SHOW DATABASES;
EOF

    # Run secure installation
    sudo mysql < /tmp/mysql_secure.sql
    
    # Save passwords to file
    cat > mysql_credentials.txt << EOF
MySQL Root Password: $MYSQL_ROOT_PASSWORD
LMS User: lms_user
LMS Password: lms_secure_password_2024
Read-Only User: lms_readonly
Read-Only Password: readonly_password_2024
Database: lms_platform
EOF
    
    print_success "MySQL secured successfully"
    print_warning "Credentials saved to mysql_credentials.txt"
    print_warning "Please change default passwords in production!"
}

# Test MySQL performance
test_mysql() {
    print_status "Testing MySQL performance..."
    
    # Create test database
    mysql -u lms_user -plms_secure_password_2024 -e "USE lms_platform;"
    
    # Create test table
    mysql -u lms_user -plms_secure_password_2024 lms_platform << 'EOF'
CREATE TABLE IF NOT EXISTS performance_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);
EOF

    # Insert test data
    mysql -u lms_user -plms_secure_password_2024 lms_platform << 'EOF'
DELIMITER //
CREATE PROCEDURE InsertTestData()
BEGIN
    DECLARE i INT DEFAULT 1;
    WHILE i <= 1000 DO
        INSERT INTO performance_test (name, email) 
        VALUES (CONCAT('User', i), CONCAT('user', i, '@example.com'));
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

CALL InsertTestData();
DROP PROCEDURE InsertTestData;
EOF

    # Test queries
    echo "Testing SELECT performance..."
    time mysql -u lms_user -plms_secure_password_2024 lms_platform -e "SELECT COUNT(*) FROM performance_test;"
    
    echo "Testing indexed query performance..."
    time mysql -u lms_user -plms_secure_password_2024 lms_platform -e "SELECT * FROM performance_test WHERE name = 'User500';"
    
    # Cleanup
    mysql -u lms_user -plms_secure_password_2024 lms_platform -e "DROP TABLE performance_test;"
    
    print_success "MySQL performance test completed"
}

# Show MySQL status
show_status() {
    print_status "MySQL Status:"
    echo ""
    
    # Show MySQL version
    mysql -u lms_user -plms_secure_password_2024 -e "SELECT VERSION();"
    echo ""
    
    # Show databases
    mysql -u lms_user -plms_secure_password_2024 -e "SHOW DATABASES;"
    echo ""
    
    # Show variables
    mysql -u lms_user -plms_secure_password_2024 -e "SHOW VARIABLES LIKE 'max_connections';"
    mysql -u lms_user -plms_secure_password_2024 -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';"
    mysql -u lms_user -plms_secure_password_2024 -e "SHOW VARIABLES LIKE 'query_cache_size';"
    echo ""
    
    print_status "MySQL Configuration:"
    echo "  Port: 3306"
    echo "  Max Connections: 1000"
    echo "  InnoDB Buffer Pool: 1GB"
    echo "  Query Cache: 256MB"
    echo "  Character Set: utf8mb4"
    echo ""
    
    print_status "Useful Commands:"
    echo "  Connect: mysql -u lms_user -p lms_platform"
    echo "  Status: sudo systemctl status mysql"
    echo "  Logs: sudo tail -f /var/log/mysql/error.log"
    echo "  Slow queries: sudo tail -f /var/log/mysql/slow.log"
}

# Main function
main() {
    echo "🐬 MySQL Setup for AI LMS Platform"
    echo "=================================="
    echo ""
    
    detect_os
    install_mysql
    configure_mysql
    start_mysql
    secure_mysql
    test_mysql
    show_status
    
    echo ""
    print_success "🎉 MySQL setup completed successfully!"
    print_warning "Remember to:"
    print_warning "1. Change default passwords in production"
    print_warning "2. Configure firewall rules for MySQL port"
    print_warning "3. Set up regular database backups"
    print_warning "4. Monitor MySQL performance"
    print_warning "5. Run the performance optimizations SQL script"
}

# Run main function
main "$@"
