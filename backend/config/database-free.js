import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Optimized database configuration for free deployment
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  
  // Connection pool settings optimized for free tier
  connectionLimit: 10, // Reduced for free tier
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  
  // SSL configuration for cloud databases
  ssl: {
    rejectUnauthorized: false
  },
  
  // Query optimization
  multipleStatements: false,
  dateStrings: true,
  
  // Connection management
  idleTimeout: 300000, // 5 minutes
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Optimized query function with connection management
export const query = async (sql, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Transaction support
export const transaction = async (callback) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Health check for database
export const healthCheck = async () => {
  try {
    const result = await query('SELECT 1 as health');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      result: result[0]
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

// Close all connections (for graceful shutdown)
export const closePool = async () => {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
};

export default pool;
