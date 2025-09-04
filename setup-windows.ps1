# Windows Setup Script for AI LMS Platform
# This script installs and configures all external services on Windows

param(
    [switch]$SkipDocker,
    [switch]$SkipMySQL,
    [switch]$SkipRedis,
    [switch]$SkipNginx
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check system requirements
function Test-SystemRequirements {
    Write-Status "Checking system requirements..."
    
    # Check available memory
    $memory = Get-WmiObject -Class Win32_ComputerSystem
    $memoryGB = [math]::Round($memory.TotalPhysicalMemory / 1GB, 0)
    if ($memoryGB -lt 8) {
        Write-Warning "System has ${memoryGB}GB RAM. Recommended: 16GB+ for optimal performance"
    }
    
    # Check CPU cores
    $cpu = Get-WmiObject -Class Win32_Processor
    $cores = $cpu.NumberOfCores
    if ($cores -lt 2) {
        Write-Warning "System has ${cores} CPU cores. Recommended: 4+ for optimal performance"
    }
    
    # Check available disk space
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeSpaceGB = [math]::Round($disk.FreeSpace / 1GB, 0)
    if ($freeSpaceGB -lt 50) {
        Write-Warning "Available disk space: ${freeSpaceGB}GB. Recommended: 100GB+"
    }
    
    Write-Success "System requirements check completed"
}

# Install Chocolatey
function Install-Chocolatey {
    Write-Status "Installing Chocolatey package manager..."
    
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Success "Chocolatey is already installed"
        return
    }
    
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    Write-Success "Chocolatey installed successfully"
}

# Install Node.js
function Install-NodeJS {
    Write-Status "Installing Node.js 18..."
    
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = node --version
        Write-Success "Node.js $nodeVersion is already installed"
        return
    }
    
    choco install nodejs -y
    refreshenv
    
    # Install PM2 globally
    npm install -g pm2
    
    Write-Success "Node.js and PM2 installed successfully"
}

# Install Redis
function Install-Redis {
    if ($SkipRedis) {
        Write-Status "Skipping Redis installation"
        return
    }
    
    Write-Status "Installing Redis..."
    
    if (Get-Command redis-server -ErrorAction SilentlyContinue) {
        Write-Success "Redis is already installed"
        return
    }
    
    choco install redis-64 -y
    refreshenv
    
    # Start Redis service
    Start-Service redis
    
    Write-Success "Redis installed and started successfully"
}

# Install MySQL
function Install-MySQL {
    if ($SkipMySQL) {
        Write-Status "Skipping MySQL installation"
        return
    }
    
    Write-Status "Installing MySQL 8.0..."
    
    if (Get-Command mysql -ErrorAction SilentlyContinue) {
        Write-Success "MySQL is already installed"
        return
    }
    
    choco install mysql -y
    refreshenv
    
    # Start MySQL service
    Start-Service mysql
    
    Write-Success "MySQL installed and started successfully"
}

# Install Docker Desktop
function Install-Docker {
    if ($SkipDocker) {
        Write-Status "Skipping Docker installation"
        return
    }
    
    Write-Status "Installing Docker Desktop..."
    
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Success "Docker is already installed"
        return
    }
    
    choco install docker-desktop -y
    
    Write-Success "Docker Desktop installed successfully"
    Write-Warning "Please restart your computer and start Docker Desktop manually"
}

# Install Nginx
function Install-Nginx {
    if ($SkipNginx) {
        Write-Status "Skipping Nginx installation"
        return
    }
    
    Write-Status "Installing Nginx..."
    
    if (Get-Command nginx -ErrorAction SilentlyContinue) {
        Write-Success "Nginx is already installed"
        return
    }
    
    choco install nginx -y
    refreshenv
    
    Write-Success "Nginx installed successfully"
}

# Configure services
function Configure-Services {
    Write-Status "Configuring services..."
    
    # Create configuration directories
    New-Item -ItemType Directory -Force -Path "C:\lms-platform\config"
    New-Item -ItemType Directory -Force -Path "C:\lms-platform\logs"
    New-Item -ItemType Directory -Force -Path "C:\lms-platform\data"
    
    # Configure Redis
    if (-not $SkipRedis) {
        $redisConfig = @"
# Redis Configuration for AI LMS Platform
port 6379
bind 127.0.0.1
timeout 300
tcp-keepalive 300
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
"@
        $redisConfig | Out-File -FilePath "C:\lms-platform\config\redis.conf" -Encoding UTF8
    }
    
    # Configure MySQL
    if (-not $SkipMySQL) {
        $mysqlConfig = @"
[mysqld]
port=3306
bind-address=0.0.0.0
max_connections=1000
innodb_buffer_pool_size=1G
innodb_log_file_size=256M
query_cache_size=256M
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
"@
        $mysqlConfig | Out-File -FilePath "C:\lms-platform\config\my.cnf" -Encoding UTF8
    }
    
    # Configure Nginx
    if (-not $SkipNginx) {
        $nginxConfig = @"
worker_processes auto;
events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;
    
    upstream backend {
        server 127.0.0.1:5000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
        }
        
        location / {
            root C:\lms-platform\www;
            index index.html;
        }
    }
}
"@
        $nginxConfig | Out-File -FilePath "C:\lms-platform\config\nginx.conf" -Encoding UTF8
    }
    
    Write-Success "Services configured successfully"
}

# Install application dependencies
function Install-AppDependencies {
    Write-Status "Installing application dependencies..."
    
    # Backend dependencies
    Set-Location "backend"
    npm install
    Set-Location ".."
    
    # Frontend dependencies
    npm install
    
    Write-Success "Application dependencies installed"
}

# Create service management scripts
function Create-ServiceScripts {
    Write-Status "Creating service management scripts..."
    
    # Start services script
    $startScript = @"
@echo off
echo Starting AI LMS Platform Services...

REM Start Redis
if not "%SkipRedis%"=="true" (
    echo Starting Redis...
    start "Redis" redis-server C:\lms-platform\config\redis.conf
)

REM Start MySQL
if not "%SkipMySQL%"=="true" (
    echo Starting MySQL...
    net start mysql
)

REM Start Nginx
if not "%SkipNginx%"=="true" (
    echo Starting Nginx...
    start "Nginx" nginx -c C:\lms-platform\config\nginx.conf
)

REM Start Backend with PM2
echo Starting Backend...
cd backend
pm2 start ecosystem.config.js --env production
cd ..

echo All services started!
pause
"@
    $startScript | Out-File -FilePath "start-services.bat" -Encoding ASCII
    
    # Stop services script
    $stopScript = @"
@echo off
echo Stopping AI LMS Platform Services...

REM Stop PM2
pm2 stop all
pm2 delete all

REM Stop Nginx
if not "%SkipNginx%"=="true" (
    echo Stopping Nginx...
    taskkill /f /im nginx.exe
)

REM Stop MySQL
if not "%SkipMySQL%"=="true" (
    echo Stopping MySQL...
    net stop mysql
)

REM Stop Redis
if not "%SkipRedis%"=="true" (
    echo Stopping Redis...
    taskkill /f /im redis-server.exe
)

echo All services stopped!
pause
"@
    $stopScript | Out-File -FilePath "stop-services.bat" -Encoding ASCII
    
    Write-Success "Service management scripts created"
}

# Test services
function Test-Services {
    Write-Status "Testing services..."
    
    # Test Redis
    if (-not $SkipRedis) {
        try {
            redis-cli ping | Out-Null
            Write-Success "Redis test passed"
        } catch {
            Write-Error "Redis test failed"
        }
    }
    
    # Test MySQL
    if (-not $SkipMySQL) {
        try {
            mysql -u root -e "SELECT 1;" | Out-Null
            Write-Success "MySQL test passed"
        } catch {
            Write-Error "MySQL test failed"
        }
    }
    
    # Test Docker
    if (-not $SkipDocker) {
        try {
            docker --version | Out-Null
            Write-Success "Docker test passed"
        } catch {
            Write-Error "Docker test failed"
        }
    }
    
    # Test Nginx
    if (-not $SkipNginx) {
        try {
            Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing | Out-Null
            Write-Success "Nginx test passed"
        } catch {
            Write-Error "Nginx test failed"
        }
    }
    
    Write-Success "Service tests completed"
}

# Show final status
function Show-FinalStatus {
    Write-Status "Final Service Status:"
    Write-Host ""
    
    Write-Host "Service Management:" -ForegroundColor $Blue
    Write-Host "  Start: .\start-services.bat"
    Write-Host "  Stop: .\stop-services.bat"
    Write-Host ""
    
    Write-Host "Service URLs:" -ForegroundColor $Blue
    Write-Host "  Frontend: http://localhost"
    Write-Host "  Backend API: http://localhost:5000 (when running)"
    Write-Host ""
    
    Write-Host "Configuration Files:" -ForegroundColor $Blue
    Write-Host "  Redis: C:\lms-platform\config\redis.conf"
    Write-Host "  MySQL: C:\lms-platform\config\my.cnf"
    Write-Host "  Nginx: C:\lms-platform\config\nginx.conf"
    Write-Host ""
    
    Write-Host "Next Steps:" -ForegroundColor $Blue
    Write-Host "1. Restart your computer if Docker was installed"
    Write-Host "2. Start Docker Desktop manually"
    Write-Host "3. Run: .\start-services.bat"
    Write-Host "4. Build frontend: npm run build"
    Write-Host "5. Copy frontend files to C:\lms-platform\www"
    Write-Host "6. Configure your domain name"
    Write-Host "7. Set up SSL certificates"
}

# Main function
function Main {
    Write-Host "🚀 AI LMS Platform - Windows Service Setup" -ForegroundColor $Green
    Write-Host "=========================================="
    Write-Host ""
    
    if (-not (Test-Administrator)) {
        Write-Error "This script must be run as Administrator"
        exit 1
    }
    
    Test-SystemRequirements
    Install-Chocolatey
    Install-NodeJS
    Install-Redis
    Install-MySQL
    Install-Docker
    Install-Nginx
    Configure-Services
    Install-AppDependencies
    Create-ServiceScripts
    Test-Services
    Show-FinalStatus
    
    Write-Host ""
    Write-Success "🎉 All external services setup completed successfully!"
    Write-Warning "Important:"
    Write-Warning "1. Change all default passwords in production"
    Write-Warning "2. Configure Windows Firewall rules"
    Write-Warning "3. Set up SSL certificates"
    Write-Warning "4. Monitor service performance"
    Write-Warning "5. Test your application thoroughly"
}

# Run main function
Main
