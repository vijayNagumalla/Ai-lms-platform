// Helper to execute SQL files with DELIMITER statements
// Uses mysql2's ability to execute multiple statements

import { pool } from '../config/database.js';
import logger from './logger.js';

/**
 * Execute SQL file that contains DELIMITER statements
 * This handles stored procedures, functions, and other MySQL-specific syntax
 */
export async function executeMigrationWithDelimiter(sqlContent) {
    try {
        // For files with DELIMITER, we need to use a connection that supports multiple statements
        const connection = await pool.getConnection();
        
        try {
            // Remove USE statements and comments that might interfere
            let cleanedSql = sqlContent
                .replace(/USE\s+\w+\s*;/gi, '') // Remove USE statements
                .replace(/^--.*$/gm, ''); // Remove single-line comments
            
            // Split by DELIMITER blocks
            const delimiterRegex = /DELIMITER\s+([^\s\n]+)/gi;
            let currentDelimiter = ';';
            let processedSql = '';
            let lastIndex = 0;
            let match;
            
            while ((match = delimiterRegex.exec(sqlContent)) !== null) {
                const delimiterStart = match.index;
                const newDelimiter = match[1];
                
                // Process the block before this DELIMITER statement
                if (delimiterStart > lastIndex) {
                    const block = sqlContent.substring(lastIndex, delimiterStart);
                    processedSql += block.replace(new RegExp(currentDelimiter, 'g'), ';');
                }
                
                currentDelimiter = newDelimiter;
                lastIndex = delimiterRegex.lastIndex;
            }
            
            // Process remaining content
            if (lastIndex < sqlContent.length) {
                const block = sqlContent.substring(lastIndex);
                processedSql += block.replace(new RegExp(currentDelimiter, 'g'), ';');
            }
            
            // Remove DELIMITER statements
            processedSql = processedSql.replace(/DELIMITER\s+[^\s\n]+/gi, '');
            
            // Execute the processed SQL
            // Enable multiple statements for this connection
            await connection.query('SET SESSION sql_mode = "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"');
            
            // Split into individual statements and execute
            const statements = processedSql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));
            
            for (const statement of statements) {
                if (statement.length > 5) { // Ignore very short statements
                    try {
                        await connection.query(statement);
                    } catch (error) {
                        // Ignore "already exists" errors
                        if (!error.message.includes('already exists') && 
                            !error.message.includes('Duplicate') &&
                            !error.message.includes('Unknown procedure')) {
                            throw error;
                        }
                    }
                }
            }
            
            return true;
        } finally {
            connection.release();
        }
    } catch (error) {
        logger.error('Error executing migration with DELIMITER', { error: error.message });
        throw error;
    }
}

