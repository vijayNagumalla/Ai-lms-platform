import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';

async function addHackerRankDataColumn() {
  try {
    console.log('🔧 Adding HackerRank data column...');
    
    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'database', 'add_hackerrank_data_column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.execute(statement.trim());
          console.log('✅ Executed:', statement.trim().substring(0, 50) + '...');
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME') {
            console.log('⚠️ Column or index already exists, skipping...');
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ HackerRank data column added successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ Error adding HackerRank data column:', error);
    process.exit(1);
  }
}

addHackerRankDataColumn();
