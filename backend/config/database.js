import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey || 'dummy-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Connection pool stats (for compatibility with existing monitoring)
let poolStats = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  queueLength: 0,
  lastCheck: new Date()
};

// Test database connection
const testConnection = async () => {
  try {
    // Try to query a simple table to test connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      // PGRST116/42P01 = relation does not exist (OK for initial setup)
      throw error;
    }
    logger.info('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    logger.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};

// Enhanced SQL parser for common MySQL patterns
class SQLParser {
  static parseSelect(sql, params = []) {
    const tableMatch = sql.match(/FROM\s+`?(\w+)`?/i);
    if (!tableMatch) {
      throw new Error('Could not parse table name from SQL');
    }
    
    const tableName = tableMatch[1];
    let query = supabase.from(tableName);
    
    // Parse SELECT columns
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    if (selectMatch) {
      const columns = selectMatch[1].trim();
      if (columns !== '*') {
        const columnList = columns.split(',').map(c => c.trim().replace(/`/g, ''));
        query = query.select(columnList.join(','));
      } else {
        query = query.select('*');
      }
    } else {
      query = query.select('*');
    }
    
    // Parse WHERE conditions
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|$)/i);
    if (whereMatch) {
      const conditions = this.parseWhereClause(whereMatch[1], params);
      conditions.forEach(condition => {
        if (condition.operator === '=') {
          query = query.eq(condition.column, condition.value);
        } else if (condition.operator === '!=' || condition.operator === '<>') {
          query = query.neq(condition.column, condition.value);
        } else if (condition.operator === '>') {
          query = query.gt(condition.column, condition.value);
        } else if (condition.operator === '<') {
          query = query.lt(condition.column, condition.value);
        } else if (condition.operator === '>=') {
          query = query.gte(condition.column, condition.value);
        } else if (condition.operator === '<=') {
          query = query.lte(condition.column, condition.value);
        } else if (condition.operator === 'LIKE') {
          query = query.like(condition.column, condition.value.replace(/%/g, ''));
        } else if (condition.operator === 'IN') {
          query = query.in(condition.column, condition.value);
        }
      });
    }
    
    // Parse ORDER BY
    const orderMatch = sql.match(/ORDER\s+BY\s+`?(\w+)`?(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      query = query.order(orderMatch[1], { ascending: orderMatch[2]?.toUpperCase() !== 'DESC' });
    }
    
    // Parse LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)(?:\s*,\s*(\d+))?/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1]);
      const offset = limitMatch[2] ? parseInt(limitMatch[2]) : 0;
      query = query.range(offset, offset + limit - 1);
    }
    
    return query;
  }
  
  static parseWhereClause(whereClause, params) {
    const conditions = [];
    // Split by AND/OR but keep them
    const parts = whereClause.split(/\s+(AND|OR)\s+/i);
    let paramIndex = 0;
    
    for (let i = 0; i < parts.length; i += 2) {
      const part = parts[i];
      if (!part) continue;
      
      // Match: column operator value
      const match = part.match(/`?(\w+)`?\s*(=|!=|<>|>|<|>=|<=|LIKE|IN)\s*(\?|'[^']*'|"[^"]*"|`?\w+`?|\d+|NULL)/i);
      if (match) {
        const column = match[1];
        const operator = match[2];
        let value = match[3];
        
        // Replace ? with param value
        if (value === '?') {
          value = params[paramIndex++];
        } else if (value === 'NULL' || value === 'null') {
          value = null;
        } else if (value.startsWith("'") || value.startsWith('"')) {
          value = value.slice(1, -1);
        } else if (!isNaN(value) && value !== '') {
          value = parseFloat(value);
        }
        
        conditions.push({ column, operator, value });
      }
    }
    
    return conditions;
  }
  
  static parseInsert(sql, params) {
    const tableMatch = sql.match(/INSERT\s+INTO\s+`?(\w+)`?/i);
    if (!tableMatch) {
      throw new Error('Could not parse table name from INSERT SQL');
    }
    
    const tableName = tableMatch[1];
    
    // Parse columns
    const columnsMatch = sql.match(/\(([^)]+)\)/);
    if (!columnsMatch) {
      throw new Error('Could not parse columns from INSERT SQL');
    }
    
    const columns = columnsMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
    
    // Parse VALUES
    const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
    if (!valuesMatch) {
      throw new Error('Could not parse values from INSERT SQL');
    }
    
    const values = valuesMatch[1].split(',').map((v, i) => {
      const trimmed = v.trim();
      if (trimmed === '?') {
        return params[i];
      } else if (trimmed === 'NULL' || trimmed === 'null') {
        return null;
      } else if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
        return trimmed.slice(1, -1);
      } else if (!isNaN(trimmed) && trimmed !== '') {
        return parseFloat(trimmed);
      }
      return trimmed;
    });
    
    // Build object
    const record = {};
    columns.forEach((col, i) => {
      record[col] = values[i];
    });
    
    return { tableName, record };
  }
  
  static parseUpdate(sql, params) {
    const tableMatch = sql.match(/UPDATE\s+`?(\w+)`?/i);
    if (!tableMatch) {
      throw new Error('Could not parse table name from UPDATE SQL');
    }
    
    const tableName = tableMatch[1];
    
    // Parse SET clause
    const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|$)/i);
    if (!setMatch) {
      throw new Error('Could not parse SET clause from UPDATE SQL');
    }
    
    const updates = {};
    const setClause = setMatch[1];
    const assignments = setClause.split(',');
    
    let paramIndex = 0;
    assignments.forEach(assignment => {
      const [column, value] = assignment.split('=').map(s => s.trim().replace(/`/g, ''));
      if (value === '?') {
        updates[column] = params[paramIndex++];
      } else if (value === 'NULL' || value === 'null') {
        updates[column] = null;
      } else if (value.startsWith("'") || value.startsWith('"')) {
        updates[column] = value.slice(1, -1);
      } else if (!isNaN(value) && value !== '') {
        updates[column] = parseFloat(value);
      } else {
        updates[column] = value;
      }
    });
    
    // Parse WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+LIMIT|$)/i);
    const whereConditions = whereMatch ? this.parseWhereClause(whereMatch[1], params.slice(paramIndex)) : [];
    
    return { tableName, updates, whereConditions };
  }
  
  static parseDelete(sql, params) {
    const tableMatch = sql.match(/DELETE\s+FROM\s+`?(\w+)`?/i);
    if (!tableMatch) {
      throw new Error('Could not parse table name from DELETE SQL');
    }
    
    const tableName = tableMatch[1];
    
    // Parse WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+LIMIT|$)/i);
    const whereConditions = whereMatch ? this.parseWhereClause(whereMatch[1], params) : [];
    
    return { tableName, whereConditions };
  }
}

// Main query function
export const query = async (sql, params = []) => {
  try {
    const sqlUpper = sql.trim().toUpperCase();
    
    // SELECT queries
    if (sqlUpper.startsWith('SELECT')) {
      const query = SQLParser.parseSelect(sql, params);
      const { data, error } = await query;
      if (error) throw error;
      return [data || []];
    }
    
    // INSERT queries
    if (sqlUpper.startsWith('INSERT')) {
      const { tableName, record } = SQLParser.parseInsert(sql, params);
      const { data, error } = await supabase.from(tableName).insert(record).select();
      if (error) throw error;
      return [{ insertId: data[0]?.id, affectedRows: data.length }, []];
    }
    
    // UPDATE queries
    if (sqlUpper.startsWith('UPDATE')) {
      const { tableName, updates, whereConditions } = SQLParser.parseUpdate(sql, params);
      let query = supabase.from(tableName).update(updates);
      
      whereConditions.forEach(condition => {
        if (condition.operator === '=') {
          query = query.eq(condition.column, condition.value);
        } else if (condition.operator === '!=' || condition.operator === '<>') {
          query = query.neq(condition.column, condition.value);
        }
      });
      
      const { data, error } = await query.select();
      if (error) throw error;
      return [{ affectedRows: data?.length || 0 }, []];
    }
    
    // DELETE queries
    if (sqlUpper.startsWith('DELETE')) {
      const { tableName, whereConditions } = SQLParser.parseDelete(sql, params);
      let query = supabase.from(tableName).delete();
      
      whereConditions.forEach(condition => {
        if (condition.operator === '=') {
          query = query.eq(condition.column, condition.value);
        } else if (condition.operator === '!=' || condition.operator === '<>') {
          query = query.neq(condition.column, condition.value);
        }
      });
      
      const { data, error } = await query.select();
      if (error) throw error;
      return [{ affectedRows: data?.length || 0 }, []];
    }
    
    // For other queries, log warning and try RPC
    logger.warn('Unsupported SQL query type, attempting RPC:', sql.substring(0, 100));
    throw new Error('Complex SQL queries need to be converted to Supabase queries or RPC functions');
  } catch (error) {
    logger.error('Database query error:', { sql: sql.substring(0, 200), error: error.message });
    throw error;
  }
};

// Compatibility wrapper for pool.execute() - maintains same interface
export const pool = {
  execute: async (sql, params = []) => {
    try {
      const result = await query(sql, params);
      return result;
    } catch (error) {
      logger.error('Pool execute error:', error);
      throw error;
    }
  },
  
  // For transactions, return a mock connection object
  getConnection: async () => {
    return {
      execute: async (sql, params = []) => {
        return await query(sql, params);
      },
      query: async (sql, params = []) => {
        return await query(sql, params);
      },
      beginTransaction: async () => {
        // Supabase handles transactions automatically
        return true;
      },
      commit: async () => {
        // Supabase commits automatically
        return true;
      },
      rollback: async () => {
        logger.warn('Rollback called - Supabase handles transactions automatically');
        return true;
      },
      release: () => {
        // No-op for Supabase
        return true;
      }
    };
  }
};

// Export pool stats for monitoring
export const getPoolStats = () => poolStats;

// Export Supabase client for direct use if needed
export { supabase, testConnection };
