-- Migration to ensure QR code columns exist in attendance_sessions table
-- This enables QR code expiration and validation for attendance
-- 
-- NOTE: The attendance_sessions table from migrate_enhanced_features.sql already has:
-- - qr_code VARCHAR(500) - used for storing QR code data/token
-- - qr_expires_at TIMESTAMP - used for QR code expiration
--
-- This migration ensures those columns exist and adds indexes if needed.

USE lms_platform;

-- CRITICAL FIX: MySQL doesn't support IF NOT EXISTS with ADD COLUMN
-- Check if qr_code column exists, if not add it
SET @dbname = DATABASE();
SET @tablename = 'attendance_sessions';

-- Check and add qr_code column if it doesn't exist
SET @columnname = 'qr_code';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT ''Column qr_code already exists'' AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(500) NULL COMMENT ''QR code token for attendance'';')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add qr_expires_at column if it doesn't exist
SET @columnname2 = 'qr_expires_at';
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  'SELECT ''Column qr_expires_at already exists'' AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname2, ' TIMESTAMP NULL COMMENT ''QR code expiration timestamp'';')
));

PREPARE alterIfNotExists2 FROM @preparedStatement2;
EXECUTE alterIfNotExists2;
DEALLOCATE PREPARE alterIfNotExists2;

-- Add index for QR code lookups (if column exists and index doesn't)
SET @indexname = 'idx_qr_code';
SET @preparedStatement3 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  'SELECT ''Index idx_qr_code already exists'' AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX ', @indexname, ' (qr_code);')
));

PREPARE alterIndexIfNotExists FROM @preparedStatement3;
EXECUTE alterIndexIfNotExists;
DEALLOCATE PREPARE alterIndexIfNotExists;

-- Add index for QR code expiration queries (if column exists and index doesn't)
SET @indexname2 = 'idx_qr_expires_at';
SET @preparedStatement4 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname2)
  ) > 0,
  'SELECT ''Index idx_qr_expires_at already exists'' AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX ', @indexname2, ' (qr_expires_at);')
));

PREPARE alterIndexIfNotExists2 FROM @preparedStatement4;
EXECUTE alterIndexIfNotExists2;
DEALLOCATE PREPARE alterIndexIfNotExists2;

-- Note: QR codes are generated on session creation and expire after 15 minutes by default
-- The qr_code is validated when marking attendance via QR code method

