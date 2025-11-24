-- MEDIUM PRIORITY FIX: Add qr_code_used column to attendance_records for one-time use tracking
-- This prevents QR code replay attacks

USE lms_platform;

SET @dbname = DATABASE();
SET @tablename = 'attendance_records';
SET @columnname = 'qr_code_used';

-- Check and add qr_code_used column if it doesn't exist
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT ''Column qr_code_used already exists'' AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(500) NULL COMMENT ''QR code token used for this attendance record (for one-time use validation)'';')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for QR code usage lookups
SET @indexname = 'idx_qr_code_used';
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  'SELECT ''Index idx_qr_code_used already exists'' AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX ', @indexname, ' (qr_code_used);')
));

PREPARE alterIndexIfNotExists FROM @preparedStatement2;
EXECUTE alterIndexIfNotExists;
DEALLOCATE PREPARE alterIndexIfNotExists;

