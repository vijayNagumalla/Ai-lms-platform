-- MEDIUM PRIORITY FIX: Add missing database indexes for frequently queried columns
-- Simplified version without stored procedures (compatible with mysql2 driver)
-- This improves query performance for assessment_submissions.status, student_responses.submission_id, and assessment_assignments.assessment_id

-- Note: If indexes already exist, these statements will fail gracefully
-- The migration runner will skip "Duplicate key name" errors
-- MySQL doesn't support "IF NOT EXISTS" for CREATE INDEX, so the migration runner handles this

-- Index for assessment_submissions.status (frequently queried for filtering)
CREATE INDEX idx_assessment_submissions_status ON assessment_submissions(status);

-- Index for student_responses.submission_id (frequently joined)
CREATE INDEX idx_student_responses_submission_id ON student_responses(submission_id);

-- Composite index for assessment_assignments.assessment_id (frequently queried with target_id)
CREATE INDEX idx_assessment_assignments_assessment_id ON assessment_assignments(assessment_id);
CREATE INDEX idx_assessment_assignments_target_id ON assessment_assignments(target_id);
CREATE INDEX idx_assessment_assignments_composite ON assessment_assignments(assessment_id, target_id);

-- Additional performance indexes for common query patterns
CREATE INDEX idx_assessment_submissions_student_assessment ON assessment_submissions(student_id, assessment_id);
CREATE INDEX idx_assessment_submissions_assessment_status ON assessment_submissions(assessment_id, status);
CREATE INDEX idx_student_responses_question_id ON student_responses(question_id);

-- Index for assessment_questions (frequently joined)
CREATE INDEX idx_assessment_questions_assessment_id ON assessment_questions(assessment_id);

-- Index for users table (common filters)
CREATE INDEX idx_users_college_id ON users(college_id);
CREATE INDEX idx_users_batch ON users(batch);
CREATE INDEX idx_users_role ON users(role);

-- Index for coding profiles (frequently queried)
CREATE INDEX idx_student_coding_profiles_student_id ON student_coding_profiles(student_id);
CREATE INDEX idx_student_coding_profiles_platform_id ON student_coding_profiles(platform_id);

-- Index for attendance (if tables exist - will fail gracefully if tables don't exist)
CREATE INDEX idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX idx_attendance_sessions_class_id ON attendance_sessions(class_id);

