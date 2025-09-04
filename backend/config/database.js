import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();



const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lms_platform',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 100,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 50,
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  timeout: parseInt(process.env.DB_TIMEOUT) || 60000,
  reconnect: true,
  // Additional performance optimizations
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: true,
  debug: process.env.NODE_ENV === 'development' ? ['ComProtocol'] : false,
  // Connection pool settings
  idleTimeout: 300000, // 5 minutes
  maxReconnects: 3,
  reconnectDelay: 2000,
  // SSL configuration for production
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
  } catch (error) {
    process.exit(1);
  }
};

export { pool, testConnection }; 