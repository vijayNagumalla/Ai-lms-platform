-- Migration to completely rebuild the scheduling system
-- This will drop old columns and create a clean timezone-aware structure

-- Step 1: Backup existing data (if needed)
-- CREATE TABLE assessment_assignments_backup AS SELECT * FROM assessment_assignments;

-- Step 2: Drop foreign key constraints first to avoid conflicts
-- Drop constraints from assessment_analytics table if it exists
SET FOREIGN_KEY_CHECKS = 0;

-- Step 3: Drop all related tables to ensure clean rebuild
DROP TABLE IF EXISTS timezone_conversion_logs;
DROP TABLE IF EXISTS assessment_instances;
DROP TABLE IF EXISTS assessment_scheduling_templates;
DROP TABLE IF EXISTS assessment_assignments;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Step 4: Create a completely new assessment_assignments table with proper timezone handling
CREATE TABLE assessment_assignments (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    assignment_type ENUM('individual', 'group', 'college', 'department', 'course') NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    
    -- NEW: Clean scheduling fields with proper timezone handling
    start_date_only DATE NOT NULL,
    start_time_only TIME NOT NULL,
    end_date_only DATE NOT NULL,
    end_time_only TIME NOT NULL,
    assessment_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    
    -- Access control settings
    early_access_hours INT DEFAULT 0,
    late_submission_minutes INT DEFAULT 0,
    password VARCHAR(255),
    ip_restrictions JSON,
    device_restrictions JSON,
    browser_restrictions JSON,
    
    -- Metadata
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_assignment_type (assignment_type),
    INDEX idx_target_id (target_id),
    INDEX idx_start_date_only (start_date_only),
    INDEX idx_end_date_only (end_date_only),
    INDEX idx_assessment_timezone (assessment_timezone),
    INDEX idx_created_by (created_by)
);

-- Step 5: Try to remove old scheduling column (ignore if it doesn't exist)
-- This will fail silently if the column doesn't exist, which is fine
ALTER TABLE assessment_templates DROP COLUMN scheduling;

-- Step 6: Drop existing scheduling columns if they exist (ignore errors)
ALTER TABLE assessment_templates DROP COLUMN default_start_date_only;
ALTER TABLE assessment_templates DROP COLUMN default_start_time_only;
ALTER TABLE assessment_templates DROP COLUMN default_end_date_only;
ALTER TABLE assessment_templates DROP COLUMN default_end_time_only;
ALTER TABLE assessment_templates DROP COLUMN default_assessment_timezone;
ALTER TABLE assessment_templates DROP COLUMN default_early_access_hours;
ALTER TABLE assessment_templates DROP COLUMN default_late_submission_minutes;

-- Step 7: Add new scheduling fields to assessment_templates for template-level defaults
ALTER TABLE assessment_templates 
ADD COLUMN default_start_date_only DATE NULL AFTER proctoring_settings,
ADD COLUMN default_start_time_only TIME NULL AFTER default_start_date_only,
ADD COLUMN default_end_date_only DATE NULL AFTER default_start_time_only,
ADD COLUMN default_end_time_only TIME NULL AFTER default_end_date_only,
ADD COLUMN default_assessment_timezone VARCHAR(50) DEFAULT 'UTC' AFTER default_end_time_only,
ADD COLUMN default_early_access_hours INT DEFAULT 0 AFTER default_assessment_timezone,
ADD COLUMN default_late_submission_minutes INT DEFAULT 0 AFTER default_early_access_hours;

-- Step 8: Create a new table for assessment scheduling templates
CREATE TABLE assessment_scheduling_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scheduling configuration
    start_date_only DATE NOT NULL,
    start_time_only TIME NOT NULL,
    end_date_only DATE NOT NULL,
    end_time_only TIME NOT NULL,
    assessment_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    
    -- Access control
    early_access_hours INT DEFAULT 0,
    late_submission_minutes INT DEFAULT 0,
    
    -- Recurring settings (for future use)
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSON,
    
    -- Metadata
    created_by VARCHAR(36) NOT NULL,
    college_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    INDEX idx_created_by (created_by),
    INDEX idx_college_id (college_id),
    INDEX idx_is_active (is_active)
);

-- Step 9: Create a table for timezone-aware assessment instances
CREATE TABLE assessment_instances (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    assignment_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    
    -- Instance-specific scheduling (can override assignment settings)
    start_date_only DATE NOT NULL,
    start_time_only TIME NOT NULL,
    end_date_only DATE NOT NULL,
    end_time_only TIME NOT NULL,
    assessment_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    
    -- Instance status
    status ENUM('scheduled', 'available', 'in_progress', 'completed', 'expired', 'cancelled') DEFAULT 'scheduled',
    
    -- Access tracking
    first_accessed_at TIMESTAMP NULL,
    last_accessed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assessment_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_assignment (student_id, assignment_id),
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_assignment_id (assignment_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_start_date_only (start_date_only),
    INDEX idx_end_date_only (end_date_only)
);

-- Step 10: Create a table for timezone conversion logs (for debugging)
CREATE TABLE timezone_conversion_logs (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    assignment_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    
    -- Original assessment timezone data
    original_start_date_only DATE NOT NULL,
    original_start_time_only TIME NOT NULL,
    original_end_date_only DATE NOT NULL,
    original_end_time_only TIME NOT NULL,
    original_assessment_timezone VARCHAR(50) NOT NULL,
    
    -- User's timezone
    user_timezone VARCHAR(50) NOT NULL,
    
    -- Converted times (for verification)
    converted_start_datetime TIMESTAMP NULL,
    converted_end_datetime TIMESTAMP NULL,
    
    -- Conversion metadata
    conversion_method VARCHAR(50) NOT NULL DEFAULT 'browser_native',
    conversion_success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Log metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assessment_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_assignment_id (assignment_id),
    INDEX idx_student_id (student_id),
    INDEX idx_conversion_success (conversion_success),
    INDEX idx_created_at (created_at)
);

-- Step 11: Show the new table structures
DESCRIBE assessment_assignments;
DESCRIBE assessment_scheduling_templates;
DESCRIBE assessment_instances;
DESCRIBE timezone_conversion_logs;

-- Step 12: Show all assessment-related tables
SHOW TABLES LIKE 'assessment_%'; 