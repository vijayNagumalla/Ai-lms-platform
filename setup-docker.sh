#!/bin/bash

# Docker Setup Script for AI LMS Platform
# This script installs and configures Docker for code execution

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

# Install Docker
install_docker() {
    print_status "Installing Docker..."
    
    case $OS in
        "debian")
            # Remove old versions
            sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
            
            # Install dependencies
            sudo apt update
            sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
            
            # Add Docker's official GPG key
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            
            # Add Docker repository
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # Install Docker
            sudo apt update
            sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        "redhat")
            # Remove old versions
            sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true
            
            # Install dependencies
            sudo yum install -y yum-utils
            
            # Add Docker repository
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            
            # Install Docker
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install --cask docker
            else
                print_error "Homebrew not found. Please install Docker Desktop manually."
                exit 1
            fi
            ;;
        *)
            print_error "Unsupported OS. Please install Docker manually."
            exit 1
            ;;
    esac
    
    print_success "Docker installed successfully"
}

# Configure Docker for production
configure_docker() {
    print_status "Configuring Docker for production..."
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Create Docker daemon configuration
    sudo mkdir -p /etc/docker
    
    cat > /tmp/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "default-ulimits": {
    "memlock": {
      "Hard": -1,
      "Name": "memlock",
      "Soft": -1
    }
  },
  "default-address-pools": [
    {
      "base": "172.17.0.0/12",
      "size": 24
    }
  ],
  "live-restore": true,
  "userland-proxy": false,
  "experimental": false,
  "metrics-addr": "127.0.0.1:9323",
  "metrics-interval": 5s
}
EOF

    sudo cp /tmp/daemon.json /etc/docker/daemon.json
    
    # Configure systemd limits
    sudo mkdir -p /etc/systemd/system/docker.service.d
    cat > /tmp/override.conf << 'EOF'
[Service]
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity
Delegate=yes
KillMode=process
OOMScoreAdjust=-999
EOF

    sudo cp /tmp/override.conf /etc/systemd/system/docker.service.d/override.conf
    
    print_success "Docker configured for production"
}

# Start Docker service
start_docker() {
    print_status "Starting Docker service..."
    
    case $OS in
        "debian"|"redhat")
            sudo systemctl enable docker
            sudo systemctl daemon-reload
            sudo systemctl start docker
            sudo systemctl status docker --no-pager
            ;;
        "macos")
            open -a Docker
            sleep 10
            ;;
    esac
    
    # Test Docker
    if docker --version &>/dev/null; then
        print_success "Docker is running"
    else
        print_error "Docker failed to start"
        exit 1
    fi
}

# Pull required images
pull_images() {
    print_status "Pulling required Docker images..."
    
    # Language images for code execution
    docker pull python:3.9-alpine
    docker pull node:18-alpine
    docker pull openjdk:17-jdk-alpine
    docker pull gcc:latest
    docker pull mcr.microsoft.com/dotnet/sdk:6.0
    docker pull php:8.1-alpine
    docker pull ruby:3.1-alpine
    docker pull golang:1.19-alpine
    docker pull rust:1.70-alpine
    
    # Judge0 image
    docker pull judge0/judge0:latest
    
    # Redis image
    docker pull redis:7-alpine
    
    # MySQL image
    docker pull mysql:8.0
    
    print_success "Required images pulled successfully"
}

# Test Docker performance
test_docker() {
    print_status "Testing Docker performance..."
    
    # Create test script
    cat > /tmp/docker_test.py << 'EOF'
import time
import subprocess
import json

def test_docker_performance():
    print("Testing Docker performance...")
    
    # Test Python execution
    start_time = time.time()
    result = subprocess.run([
        'docker', 'run', '--rm', 
        'python:3.9-alpine', 
        'python', '-c', 'print("Hello from Docker!")'
    ], capture_output=True, text=True, timeout=10)
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"Python execution completed in {duration:.2f} seconds")
    print(f"Output: {result.stdout.strip()}")
    
    # Test Node.js execution
    start_time = time.time()
    result = subprocess.run([
        'docker', 'run', '--rm',
        'node:18-alpine',
        'node', '-e', 'console.log("Hello from Node.js!")'
    ], capture_output=True, text=True, timeout=10)
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"Node.js execution completed in {duration:.2f} seconds")
    print(f"Output: {result.stdout.strip()}")
    
    print("Docker performance test completed successfully")

if __name__ == "__main__":
    test_docker_performance()
EOF

    # Run test
    python3 /tmp/docker_test.py
    
    # Cleanup
    rm /tmp/docker_test.py
    
    print_success "Docker performance test completed"
}

# Setup Docker Compose
setup_docker_compose() {
    print_status "Setting up Docker Compose..."
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        print_status "Installing Docker Compose..."
        
        # Install Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        # Create symlink
        sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
    
    # Test Docker Compose
    if docker-compose --version &>/dev/null; then
        print_success "Docker Compose is available"
    else
        print_error "Docker Compose installation failed"
        exit 1
    fi
}

# Show Docker status
show_status() {
    print_status "Docker Status:"
    echo ""
    
    # Show Docker version
    docker --version
    echo ""
    
    # Show Docker info
    docker info | head -20
    echo ""
    
    # Show running containers
    docker ps
    echo ""
    
    # Show images
    docker images | head -10
    echo ""
    
    print_status "Docker Configuration:"
    echo "  Storage Driver: overlay2"
    echo "  Log Driver: json-file"
    echo "  Max Log Size: 10MB"
    echo "  Max Log Files: 3"
    echo "  Metrics: Enabled on port 9323"
    echo ""
    
    print_status "Useful Commands:"
    echo "  List containers: docker ps -a"
    echo "  List images: docker images"
    echo "  System info: docker system info"
    echo "  System usage: docker system df"
    echo "  Clean up: docker system prune"
    echo "  Compose up: docker-compose up -d"
    echo "  Compose down: docker-compose down"
}

# Main function
main() {
    echo "🐳 Docker Setup for AI LMS Platform"
    echo "==================================="
    echo ""
    
    detect_os
    install_docker
    configure_docker
    start_docker
    pull_images
    test_docker
    setup_docker_compose
    show_status
    
    echo ""
    print_success "🎉 Docker setup completed successfully!"
    print_warning "Remember to:"
    print_warning "1. Log out and back in to use Docker without sudo"
    print_warning "2. Monitor Docker resource usage"
    print_warning "3. Set up Docker image cleanup"
    print_warning "4. Configure Docker security settings"
    print_warning "5. Test code execution with your application"
}

# Run main function
main "$@"
