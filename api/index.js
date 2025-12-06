import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { testConnection } from '../backend/config/database.js';
import cacheService from '../backend/services/cacheService.js';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
// Allow requests from the same origin (Vercel deployment) or configured frontend URL
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow same-origin requests (for Vercel deployments where frontend and API are on same domain)
    if (origin.includes('vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.length === 0 || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-XSRF-Token']
}));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Optimized rate limiting for free tier
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 2000 : 10000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.round(15 * 60 * 1000 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/api/health';
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional CORS headers (backup - main CORS is handled by cors middleware above)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Only set CORS headers if origin is allowed
  if (origin && (
    origin.includes('vercel.app') || 
    origin.includes('localhost') ||
    (process.env.FRONTEND_URL && process.env.FRONTEND_URL.split(',').some(url => origin.includes(url.trim())))
  )) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, X-XSRF-Token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  const cacheStats = cacheService.getStats();
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    database: dbStatus ? 'connected' : 'disconnected',
    cache: cacheStats
  });
});

// API health check
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({ 
    status: 'OK', 
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Import and use routes
import authRoutes from '../backend/routes/auth.js';
import assessmentRoutes from '../backend/routes/assessments.js';
import questionBankRoutes from '../backend/routes/questionBank.js';
import userManagementRoutes from '../backend/routes/userManagement.js';
import collegeRoutes from '../backend/routes/colleges.js';
import analyticsRoutes from '../backend/routes/analytics.js';
import emailRoutes from '../backend/routes/email.js';
import codingRoutes from '../backend/routes/coding.js';
import superAdminRoutes from '../backend/routes/superAdmin.js';
import batchRoutes from '../backend/routes/batches.js';

app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/batches', batchRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path
  });
});

// Export handler for Vercel serverless functions
export default (req, res) => {
  return app(req, res);
};
