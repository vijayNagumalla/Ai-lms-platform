# Database Migrations

## LOW PRIORITY FIX: Migration Documentation and Versioning

This directory contains database migration files. Migrations should be run in the order specified below.

## Migration Order and Dependencies

### Core Schema (Run First)
1. `schema.sql` - Base database schema (if exists)
2. `migrate_enhanced_features.sql` - Enhanced features tables (attendance, courses, classes, etc.)

### Performance Optimizations
3. `migrate_add_performance_indexes.sql` - Database indexes for performance

### Security and Features
4. `add_scraping_failures_table.sql` - Scraping failure tracking
5. `migrate_add_qr_code_used_column.sql` - QR code one-time use tracking

## Migration Versioning

### Current System
- Migrations are SQL files that must be run manually
- No automatic version tracking (to be implemented)

### Future: Migration Versioning System

A migration tracking table will be created to track which migrations have been applied:

```sql
CREATE TABLE IF NOT EXISTS migration_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    INDEX idx_migration_name (migration_name)
);
```

### Running Migrations

**Manual Method (Current):**
```bash
mysql -u your_username -p lms_platform < backend/database/migrate_enhanced_features.sql
mysql -u your_username -p lms_platform < backend/database/migrate_add_performance_indexes.sql
mysql -u your_username -p lms_platform < backend/database/add_scraping_failures_table.sql
mysql -u your_username -p lms_platform < backend/database/migrate_add_qr_code_used_column.sql
```

**Future: Automated Migration Runner**
```bash
npm run migrate:up    # Run all pending migrations
npm run migrate:down  # Rollback last migration
npm run migrate:status # Check migration status
```

## Migration Best Practices

1. **Always backup** database before running migrations
2. **Test migrations** on development/staging first
3. **Run migrations in order** as specified above
4. **Document breaking changes** in migration files
5. **Use transactions** for data migrations when possible

## Migration File Naming Convention

- `migrate_<feature_name>.sql` - Feature migrations
- `add_<table_name>_table.sql` - New table creation
- `migrate_add_<column_name>_column.sql` - Column additions

## Rollback Strategy

Currently, migrations must be rolled back manually. Future versions will include:
- Automatic rollback scripts
- Migration history tracking
- Dependency resolution

## Notes

- Some migrations may have dependencies on others
- Always check migration file comments for prerequisites
- Contact the development team if you encounter migration issues

