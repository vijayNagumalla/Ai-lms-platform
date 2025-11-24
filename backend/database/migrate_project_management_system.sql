-- Migration: Project Management System - Complete Database Schema
-- Date: 2024-01-27
-- Description: Creates all tables for the Project Management System

USE lms_platform;

-- ============================================================
-- 1. PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    college_id VARCHAR(36) NOT NULL,
    project_type ENUM('company_specific', 'crt', 'custom') NOT NULL,
    total_hours_required INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    trainers_required INT DEFAULT 1,
    admins_required INT DEFAULT 0,
    mode ENUM('online', 'offline', 'hybrid') NOT NULL,
    preferred_timings JSON, -- {start: "09:00", end: "17:00"}
    project_manager_id VARCHAR(36),
    spoc_id VARCHAR(36),
    description TEXT,
    status ENUM('draft', 'faculty_allocation', 'scheduling', 'admin_allocation', 'live', 'completed', 'cancelled') DEFAULT 'draft',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (project_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (spoc_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_college_id (college_id),
    INDEX idx_status (status),
    INDEX idx_project_type (project_type),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_created_by (created_by)
);

-- ============================================================
-- 2. PROJECT DEPARTMENTS (Many-to-Many)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_departments (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_dept (project_id, department_id),
    INDEX idx_project_id (project_id),
    INDEX idx_department_id (department_id)
);

-- ============================================================
-- 3. PROJECT BATCHES (Many-to-Many)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_batches (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    batch_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_batch (project_id, batch_id),
    INDEX idx_project_id (project_id),
    INDEX idx_batch_id (batch_id)
);

-- ============================================================
-- 4. FACULTY PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS faculty_profiles (
    id VARCHAR(36) PRIMARY KEY,
    faculty_id VARCHAR(36) NOT NULL UNIQUE,
    rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
    total_ratings INT DEFAULT 0,
    current_workload_hours INT DEFAULT 0,
    max_available_hours INT DEFAULT 160, -- per month
    location VARCHAR(255),
    distance_preference INT DEFAULT 50, -- km
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_rating (rating),
    INDEX idx_is_available (is_available)
);

-- ============================================================
-- 5. FACULTY SKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS faculty_skills (
    id VARCHAR(36) PRIMARY KEY,
    faculty_id VARCHAR(36) NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    years_of_experience INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_skill_name (skill_name)
);

-- ============================================================
-- 6. FACULTY ALLOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS faculty_allocations (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    faculty_id VARCHAR(36) NOT NULL,
    allocated_hours INT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    employment_type ENUM('full_time', 'freelancer') NOT NULL,
    allocation_status ENUM('pending', 'confirmed', 'replaced', 'completed') DEFAULT 'pending',
    allocated_by VARCHAR(36) NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    replaced_at TIMESTAMP NULL,
    replacement_reason TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_allocation_status (allocation_status)
);

-- ============================================================
-- 7. FACULTY REPLACEMENT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS faculty_replacement_logs (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    old_faculty_id VARCHAR(36) NOT NULL,
    new_faculty_id VARCHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    replaced_by VARCHAR(36) NOT NULL,
    replaced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (old_faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (new_faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (replaced_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_old_faculty_id (old_faculty_id),
    INDEX idx_new_faculty_id (new_faculty_id),
    INDEX idx_replaced_at (replaced_at)
);

-- ============================================================
-- 8. ROOMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    building VARCHAR(255),
    floor INT,
    capacity INT NOT NULL,
    room_type ENUM('lecture', 'lab', 'auditorium', 'seminar') DEFAULT 'lecture',
    amenities JSON, -- ["Projector", "Whiteboard", "Computers"]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_code (college_id, code),
    INDEX idx_college_id (college_id),
    INDEX idx_is_active (is_active)
);

-- ============================================================
-- 9. COLLEGE HOLIDAYS
-- ============================================================
CREATE TABLE IF NOT EXISTS college_holidays (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(255) NOT NULL,
    holiday_type ENUM('holiday', 'exam', 'event') DEFAULT 'holiday',
    description TEXT,
    is_recurring_yearly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_college_holiday (college_id, holiday_date),
    INDEX idx_college_id (college_id),
    INDEX idx_holiday_date (holiday_date)
);

-- ============================================================
-- 10. SESSIONS/CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    batch_id VARCHAR(36) NOT NULL,
    faculty_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    topic TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    mode ENUM('online', 'offline', 'hybrid') NOT NULL,
    room_id VARCHAR(36),
    meeting_link VARCHAR(500), -- For online/hybrid
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSON, -- {type: 'daily/weekly/monthly', interval: 1, endDate: '...'}
    parent_session_id VARCHAR(36), -- For recurring sessions
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_batch_id (batch_id),
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_status (status),
    INDEX idx_dates (start_time, end_time)
);

-- ============================================================
-- 11. ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    marked_by VARCHAR(36) NOT NULL, -- Faculty who marked
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_student (session_id, student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_marked_at (marked_at)
);

-- ============================================================
-- 12. TOPICS COVERED
-- ============================================================
CREATE TABLE IF NOT EXISTS topics_covered (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    topic_name VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    description TEXT,
    attachments JSON, -- [{name: "...", url: "...", type: "pdf/ppt"}]
    covered_by VARCHAR(36) NOT NULL, -- Faculty
    covered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (covered_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_covered_by (covered_by),
    INDEX idx_covered_at (covered_at)
);

-- ============================================================
-- 13. FEEDBACK
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36),
    session_id VARCHAR(36),
    feedback_type ENUM('student_to_faculty', 'faculty_to_batch', 'college_to_company', 'end_of_course') NOT NULL,
    from_user_id VARCHAR(36) NOT NULL,
    to_user_id VARCHAR(36), -- Faculty being rated
    to_batch_id VARCHAR(36), -- Batch being rated
    rating_overall DECIMAL(3,2), -- 1.00 to 5.00
    rating_professionalism DECIMAL(3,2),
    rating_content_relevance DECIMAL(3,2),
    rating_communication DECIMAL(3,2),
    textual_feedback TEXT,
    suggestions TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    INDEX idx_project_id (project_id),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_from_user_id (from_user_id),
    INDEX idx_to_user_id (to_user_id),
    INDEX idx_submitted_at (submitted_at)
);

-- ============================================================
-- 14. ADMIN ALLOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_allocations (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    admin_id VARCHAR(36) NOT NULL,
    admin_role ENUM('attendance_admin', 'logistics_admin', 'reporting_admin') NOT NULL,
    allocated_by VARCHAR(36) NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_admin_role (project_id, admin_id, admin_role),
    INDEX idx_project_id (project_id),
    INDEX idx_admin_id (admin_id)
);

-- ============================================================
-- 15. INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    faculty_id VARCHAR(36) NOT NULL,
    college_id VARCHAR(36) NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    total_hours INT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tds_percentage DECIMAL(5,2) DEFAULT 0.00,
    tds_amount DECIMAL(10,2) DEFAULT 0.00,
    net_payable DECIMAL(10,2) NOT NULL,
    employment_type ENUM('full_time', 'freelancer') NOT NULL,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    pdf_url VARCHAR(500),
    qr_code_url VARCHAR(500),
    bank_details JSON, -- {account_number, ifsc, bank_name, branch}
    notes TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_college_id (college_id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_billing_period (billing_period_start, billing_period_end),
    INDEX idx_status (status)
);

-- ============================================================
-- 16. INVOICE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36),
    hours INT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    session_date DATE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_project_id (project_id)
);

-- ============================================================
-- 17. CALENDAR EVENTS (Denormalized for Performance)
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    batch_id VARCHAR(36) NOT NULL,
    faculty_id VARCHAR(36) NOT NULL,
    college_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    color_code VARCHAR(7), -- Hex color
    event_type ENUM('session', 'holiday', 'exam', 'event') DEFAULT 'session',
    is_conflict BOOLEAN DEFAULT FALSE,
    conflict_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_batch_id (batch_id),
    INDEX idx_college_id (college_id),
    INDEX idx_project_id (project_id),
    INDEX idx_dates (start_time, end_time)
);

-- ============================================================
-- 18. ENHANCE EXISTING NOTIFICATIONS TABLE
-- ============================================================
-- Add new columns to existing notifications table if they don't exist
-- Note: MySQL doesn't support IF NOT EXISTS in ALTER TABLE, so we check first

-- Check and add category column
SET @dbname = DATABASE();
SET @tablename = 'notifications';
SET @columnname = 'category';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(\'trainer_assigned\', \'trainer_replaced\', \'attendance_pending\', \'schedule_updated\', \'invoice_generated\', \'feedback_request\', \'session_reminder\', \'other\') DEFAULT \'other\' AFTER type')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add related_entity_type column
SET @columnname = 'related_entity_type';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) AFTER message')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add related_entity_id column
SET @columnname = 'related_entity_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(36) AFTER related_entity_type')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add indexes if they don't exist (MySQL 5.7+ supports IF NOT EXISTS for CREATE INDEX)
-- For older versions, we'll use a similar check
SET @indexname = 'idx_category';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(category)')
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

SET @indexname = 'idx_related_entity';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(related_entity_type, related_entity_id)')
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- ============================================================
-- END OF MIGRATION
-- ============================================================

