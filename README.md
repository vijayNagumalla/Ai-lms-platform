# 🚀 EDU-HORIZON-PLATFORM

> **AI-Powered Learning Management System for 5000+ Concurrent Users**

A comprehensive, scalable Learning Management System built with modern technologies, optimized for high-performance education delivery with support for 5000+ concurrent users.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7+-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://docker.com/)
[![PM2](https://img.shields.io/badge/PM2-Cluster-green.svg)](https://pm2.keymetrics.io/)

## ✨ Features

### 🎯 **Core Features**
- **Multi-Role System**: Super Admin, College Admin, Faculty, Students
- **Assessment Management**: Create, manage, and grade assessments
- **Question Bank**: Comprehensive question management system
- **Coding Evaluations**: Real-time code execution with multiple languages
- **Analytics Dashboard**: Detailed performance analytics and reporting
- **User Management**: Complete user lifecycle management
- **College Management**: Multi-tenant college administration

### 🚀 **Performance Features**
- **5000+ Concurrent Users**: Optimized for high-scale usage
- **Redis Caching**: Intelligent caching for improved performance
- **Database Optimization**: 20+ performance indexes and query optimization
- **Load Balancing**: Nginx-based load balancing
- **PM2 Clustering**: Multi-core CPU utilization
- **Rate Limiting**: API protection and abuse prevention
- **Health Monitoring**: Comprehensive health checks and metrics

### 💻 **Technical Features**
- **Real-time Code Execution**: Docker-based secure code execution
- **Multiple Programming Languages**: Python, JavaScript, Java, C++, C#, Go, Rust, and more
- **Judge0 Integration**: Advanced code evaluation system
- **File Upload System**: Secure file handling with validation
- **Email Notifications**: Automated email system
- **Responsive Design**: Mobile-first responsive UI
- **Dark/Light Theme**: User preference-based theming

## 🏗️ Architecture

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

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **MySQL 8.0+**
- **Redis 7+**
- **Docker** (for code execution)
- **8GB+ RAM** (16GB+ recommended)
- **4+ CPU cores** (8+ recommended)

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/vijayNagumalla/EDU-HORIZON-PLATFORM.git
cd EDU-HORIZON-PLATFORM

# Make scripts executable
chmod +x *.sh

# Run automated setup
./setup-all-services.sh
```

### Option 2: Docker Compose (Easiest)

```bash
# Clone the repository
git clone https://github.com/vijayNagumalla/EDU-HORIZON-PLATFORM.git
cd EDU-HORIZON-PLATFORM

# Configure environment
cp env.production.example .env.production
nano .env.production  # Edit with your settings

# Deploy with Docker Compose
docker-compose -f docker-compose.production.yml up -d
```

### Option 3: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup database
mysql -u root -p < backend/database/performance_optimizations.sql

# 3. Configure environment
cp env.production.example .env.production
nano .env.production

# 4. Start backend
cd backend
pm2 start ecosystem.config.js --env production
cd ..

# 5. Build and serve frontend
npm run build
sudo cp -r dist/* /var/www/html/
```

## 📊 Performance Specifications

| Metric | Specification |
|--------|---------------|
| **Concurrent Users** | 5000+ |
| **Response Time** | <200ms average |
| **Throughput** | 1000+ requests/second |
| **Uptime** | 99.9%+ |
| **Memory Usage** | <16GB total |
| **CPU Usage** | <80% average |
| **Database Connections** | 100 pooled |
| **Redis Memory** | 512MB with LRU |
| **Docker Containers** | 50 concurrent executions |

## 🛠️ Technology Stack

### **Frontend**
- **React 18** - Modern UI framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Accessible component library
- **Framer Motion** - Animation library
- **Chart.js** - Data visualization
- **Monaco Editor** - Code editor

### **Backend**
- **Node.js 18** - JavaScript runtime
- **Express.js** - Web framework
- **PM2** - Process manager with clustering
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email service

### **Database & Caching**
- **MySQL 8.0** - Primary database
- **Redis 7** - Caching and session storage
- **Connection Pooling** - High-performance database access

### **Code Execution**
- **Docker** - Containerized code execution
- **Judge0** - Code evaluation service
- **Multiple Languages** - Python, JavaScript, Java, C++, C#, Go, Rust, etc.

### **Infrastructure**
- **Nginx** - Load balancer and reverse proxy
- **Docker Compose** - Container orchestration
- **PM2** - Process clustering
- **Grafana** - Monitoring and visualization
- **Prometheus** - Metrics collection

## 📁 Project Structure

```
EDU-HORIZON-PLATFORM/
├── 📁 backend/                    # Backend API server
│   ├── 📁 config/                 # Configuration files
│   │   ├── database.js           # Database configuration
│   │   └── redis.js              # Redis configuration
│   ├── 📁 controllers/            # API controllers
│   ├── 📁 middleware/             # Custom middleware
│   │   ├── auth.js               # Authentication
│   │   ├── cache.js              # Caching middleware
│   │   ├── rateLimiter.js        # Rate limiting
│   │   └── healthCheck.js        # Health monitoring
│   ├── 📁 routes/                 # API routes
│   ├── 📁 services/               # Business logic services
│   ├── 📁 database/               # Database schemas and migrations
│   ├── server.js                 # Main server file
│   ├── ecosystem.config.js       # PM2 configuration
│   └── Dockerfile.production     # Production Docker image
├── 📁 src/                        # Frontend React application
│   ├── 📁 components/             # Reusable UI components
│   ├── 📁 pages/                  # Page components
│   ├── 📁 contexts/               # React contexts
│   ├── 📁 lib/                    # Utility libraries
│   └── 📁 services/               # API services
├── 📁 monitoring/                 # Monitoring configuration
├── 📁 setup scripts/              # Service setup scripts
├── docker-compose.production.yml  # Production Docker setup
├── nginx.conf                     # Nginx configuration
└── 📄 Documentation files
```

## 🔧 Configuration

### Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_USER=lms_user
DB_PASSWORD=your_secure_password
DB_NAME=lms_platform
DB_CONNECTION_LIMIT=100

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
PORT=5000

# Docker Configuration
DOCKER_MAX_POOL_SIZE=10
DOCKER_MAX_CONCURRENT=50
DOCKER_MEMORY_LIMIT=256m
```

## 📈 Monitoring & Health Checks

### Health Check Endpoints
- **Overall Health**: `http://your-domain.com/health`
- **Readiness**: `http://your-domain.com/health/ready`
- **Liveness**: `http://your-domain.com/health/live`
- **Metrics**: `http://your-domain.com/metrics`

### Monitoring Tools
- **Grafana**: `http://your-domain.com:3000`
- **Prometheus**: `http://your-domain.com:9090`
- **PM2 Monitor**: `pm2 monit`

## 🚀 Deployment

### Production Deployment

```bash
# 1. Setup external services
./setup-all-services.sh

# 2. Configure environment
cp env.production.example .env.production
nano .env.production

# 3. Deploy with Docker Compose
docker-compose -f docker-compose.production.yml up -d

# 4. Initialize database
mysql -u root -p < backend/database/performance_optimizations.sql
```

### Scaling

```bash
# Scale backend instances
pm2 scale lms-backend 8

# Or with Docker Compose
docker-compose -f docker-compose.production.yml up -d --scale backend=4
```

## 🧪 Testing

### Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### Health Testing
```bash
# Test all services
./monitor-services.sh

# Test API endpoints
curl http://localhost:5000/health
curl http://localhost:5000/metrics
```

## 📚 Documentation

- **[Quick Start Guide](QUICK_START_GUIDE.md)** - Get started quickly
- **[Deployment Guide](DEPLOYMENT_GUIDE_5000_USERS.md)** - Comprehensive deployment instructions
- **[API Documentation](backend/routes/)** - API endpoint documentation
- **[Database Schema](backend/database/)** - Database structure and migrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/vijayNagumalla/EDU-HORIZON-PLATFORM/issues)
- **Documentation**: [Wiki](https://github.com/vijayNagumalla/EDU-HORIZON-PLATFORM/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/vijayNagumalla/EDU-HORIZON-PLATFORM/discussions)

## 🎯 Roadmap

- [ ] **Microservices Architecture** - Break down into microservices
- [ ] **Kubernetes Support** - Container orchestration
- [ ] **Mobile App** - React Native mobile application
- [ ] **Advanced Analytics** - Machine learning insights
- [ ] **Video Integration** - Video streaming capabilities
- [ ] **AI Tutoring** - AI-powered learning assistance

## 🙏 Acknowledgments

- **React Team** - For the amazing frontend framework
- **Node.js Community** - For the robust backend runtime
- **MySQL Team** - For the reliable database system
- **Redis Team** - For the high-performance caching
- **Docker Team** - For the containerization platform
- **PM2 Team** - For the process management solution

---

**Built with ❤️ for Education**

*Empowering educators and learners worldwide with cutting-edge technology*