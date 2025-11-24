// LOW PRIORITY FIX: Migration runner script
// Run this script to apply all pending migrations

import migrationRunner from '../utils/migrationRunner.js';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    try {
        logger.info('Starting migration process...');

        const pendingMigrations = await migrationRunner.getPendingMigrations();
        
        if (pendingMigrations.length === 0) {
            logger.info('No pending migrations');
            return;
        }

        logger.info(`Found ${pendingMigrations.length} pending migrations`);

        const migrationsDir = path.join(__dirname, '../database');

        for (const migration of pendingMigrations) {
            const migrationPath = path.join(migrationsDir, migration);
            
            try {
                await migrationRunner.runMigration(migrationPath);
            } catch (error) {
                logger.error(`Failed to run migration: ${migration}`, { error: error.message });
                process.exit(1);
            }
        }

        logger.info('All migrations completed successfully');

        // Show migration status
        const status = await migrationRunner.getMigrationStatus();
        console.log('\nMigration Status:');
        console.table(status);

    } catch (error) {
        logger.error('Migration process failed', { error: error.message });
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runMigrations();

