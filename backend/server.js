import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { 
  generalLimiter, 
  authLimiter, 
  codeExecutionLimiter, 
  assessmentLimiter, 
  uploadLimiter,
  roleBasedLimiter 
} from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: process.env.MAX_REQUEST_SIZE || '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_REQUEST_SIZE || '10mb' 
}));

// Apply general rate limiting
app.use('/api/', generalLimiter);

// Serve static files
app.use('/uploads', express.static('uploads'));
app.use('/uploads/exports', express.static('uploads/exports'));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoints
import { healthCheck, getMetrics, readinessCheck, livenessCheck } from './middleware/healthCheck.js';

app.get('/health', healthCheck);
app.get('/health/ready', readinessCheck);
app.get('/health/live', livenessCheck);
app.get('/metrics', getMetrics);

// Import routes with specific rate limiting
import('./routes/auth.js').then(module => {
  app.use('/api/auth', authLimiter, module.default);
});

import('./routes/assessments.js').then(module => {
  app.use('/api/assessments', assessmentLimiter, module.default);
});

import('./routes/questionBank.js').then(module => {
  app.use('/api/question-bank', roleBasedLimiter, module.default);
});

import('./routes/userManagement.js').then(module => {
  app.use('/api/users', roleBasedLimiter, module.default);
});

import('./routes/colleges.js').then(module => {
  app.use('/api/colleges', roleBasedLimiter, module.default);
});

import('./routes/analytics.js').then(module => {
  app.use('/api/analytics', roleBasedLimiter, module.default);
});

import('./routes/email.js').then(module => {
  app.use('/api/email', uploadLimiter, module.default);
});

import('./routes/coding.js').then(module => {
  app.use('/api/coding', codeExecutionLimiter, module.default);
});

import('./routes/superAdmin.js').then(module => {
  app.use('/api/super-admin', roleBasedLimiter, module.default);
});

import('./routes/codingProfiles.js').then(module => {
  app.use('/api/coding-profiles', roleBasedLimiter, module.default);
});

import('./routes/batches.js').then(module => {
  app.use('/api/batches', roleBasedLimiter, module.default);
});

app.use((error, req, res, next) => {
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 