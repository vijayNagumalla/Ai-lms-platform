-- CRITICAL FIX: Add missing database indexes for frequently queried columns
-- This migration adds indexes that may improve query performance

-- Assessment submissions table - add index on started_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_started_at ON assessment_submissions(started_at);

-- Assessment submissions table - add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_assessment_student_status ON assessment_submissions(assessment_id, student_id, status);

-- Assessment submissions table - add index on attempt_number for retake queries
CREATE INDEX IF NOT EXISTS idx_attempt_number ON assessment_submissions(attempt_number);

-- Assessment submissions table - add index on graded_by for grading queries
CREATE INDEX IF NOT EXISTS idx_graded_by ON assessment_submissions(graded_by);

-- Assessment analytics table - add index on last_updated for caching queries
CREATE INDEX IF NOT EXISTS idx_last_updated ON assessment_analytics(last_updated);

-- Assessment notifications table - add composite index for user notifications
CREATE INDEX IF NOT EXISTS idx_user_notification ON assessment_notifications(user_id, is_read, sent_at);

-- Users table - add index on student_id for student lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_student_id ON users(student_id);

-- Users table - add index on department for department-based queries
CREATE INDEX IF NOT EXISTS idx_department ON users(department);

-- Users table - add composite index for college and department queries
CREATE INDEX IF NOT EXISTS idx_college_department ON users(college_id, department);

-- Assessment assignments table - add indexes if table exists (from migrations)
-- These will be created by migrations if the table exists
-- Note: Check if assessment_assignments table exists before running these

-- SELECT 'Missing indexes added successfully' as status;

