-- Student Assessment Taking System Database Schema
-- This migration creates all necessary tables for the student assessment system

-- Assessment Submissions Table
CREATE TABLE IF NOT EXISTS assessment_submissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    assessment_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    total_time_spent INT DEFAULT 0, -- in seconds
    status ENUM('in_progress', 'completed', 'auto_submitted', 'abandoned') DEFAULT 'in_progress',
    total_score DECIMAL(10,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    grade VARCHAR(10) NULL,
    submitted_at DATETIME NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    device_info JSON NULL,
    proctoring_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attempt (assessment_id, student_id, attempt_number)
);

-- Student Responses Table
CREATE TABLE IF NOT EXISTS student_responses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    section_id VARCHAR(36) NULL,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'coding') NOT NULL,
    student_answer TEXT NULL,
    selected_options JSON NULL, -- For multiple choice questions
    time_spent INT DEFAULT 0, -- in seconds
    is_correct BOOLEAN NULL,
    points_earned DECIMAL(10,2) DEFAULT 0,
    auto_saved BOOLEAN DEFAULT FALSE,
    submitted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response (submission_id, question_id)
);

-- Proctoring Logs Table
CREATE TABLE IF NOT EXISTS proctoring_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id VARCHAR(36) NOT NULL,
    violation_type ENUM('tab_switch', 'right_click', 'copy_paste', 'dev_tools', 'window_focus', 'fullscreen_exit', 'keyboard_shortcut', 'webcam_disconnect', 'suspicious_activity') NOT NULL,
    timestamp DATETIME NOT NULL,
    description TEXT NULL,
    severity_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    metadata JSON NULL, -- Additional violation details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    INDEX idx_submission_violations (submission_id, violation_type),
    INDEX idx_timestamp (timestamp)
);

-- Performance Analytics Cache Table
CREATE TABLE IF NOT EXISTS performance_analytics (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL,
    assessment_id VARCHAR(36) NULL,
    batch_id VARCHAR(36) NULL,
    department_id VARCHAR(36) NULL,
    college_id VARCHAR(36) NULL,
    analytics_type ENUM('student_performance', 'assessment_analytics', 'batch_analytics', 'department_analytics', 'college_analytics') NOT NULL,
    performance_metrics JSON NOT NULL, -- Cached performance data
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    INDEX idx_analytics_lookup (student_id, assessment_id, batch_id, department_id, college_id),
    INDEX idx_analytics_type (analytics_type),
    INDEX idx_expires (expires_at)
);

-- Assessment Access Logs Table
CREATE TABLE IF NOT EXISTS assessment_access_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    assessment_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    access_type ENUM('view', 'start', 'resume', 'submit', 'timeout') NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    device_info JSON NULL,
    access_granted BOOLEAN DEFAULT TRUE,
    failure_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assessment_access (assessment_id, student_id),
    INDEX idx_access_type (access_type)
);

-- Assessment Attempts History Table
CREATE TABLE IF NOT EXISTS assessment_attempts_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    assessment_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    attempt_number INT NOT NULL,
    status ENUM('started', 'in_progress', 'completed', 'abandoned', 'timeout') NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    total_time_spent INT DEFAULT 0,
    score DECIMAL(10,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    grade VARCHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attempt_history (assessment_id, student_id, attempt_number)
);

-- Student Assessment Preferences Table
CREATE TABLE IF NOT EXISTS student_assessment_preferences (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL,
    auto_save_interval INT DEFAULT 30, -- seconds
    show_timer BOOLEAN DEFAULT TRUE,
    show_progress BOOLEAN DEFAULT TRUE,
    enable_notifications BOOLEAN DEFAULT TRUE,
    preferred_theme ENUM('light', 'dark', 'auto') DEFAULT 'auto',
    accessibility_options JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_preferences (student_id)
);

-- Assessment Export Logs Table
CREATE TABLE IF NOT EXISTS assessment_export_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    requested_by VARCHAR(36) NOT NULL,
    export_type ENUM('excel', 'pdf', 'csv', 'dashboard') NOT NULL,
    assessment_ids JSON NULL, -- Array of assessment IDs
    filter_criteria JSON NULL, -- Filter criteria used
    file_path VARCHAR(500) NULL,
    file_size BIGINT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_export_status (status),
    INDEX idx_export_type (export_type)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment ON assessment_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_student ON assessment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_status ON assessment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_created ON assessment_submissions(created_at);

CREATE INDEX IF NOT EXISTS idx_student_responses_submission ON student_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_student_responses_question ON student_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_student_responses_type ON student_responses(question_type);

-- Add triggers for automatic updates
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS update_assessment_submission_time
    BEFORE UPDATE ON assessment_submissions
    FOR EACH ROW
BEGIN
    IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
        SET NEW.total_time_spent = TIMESTAMPDIFF(SECOND, NEW.start_time, NEW.end_time);
    END IF;
END$$

CREATE TRIGGER IF NOT EXISTS update_student_response_timestamp
    BEFORE UPDATE ON student_responses
    FOR EACH ROW
BEGIN
    IF NEW.student_answer IS NOT NULL AND OLD.student_answer IS NULL THEN
        SET NEW.submitted_at = NOW();
    END IF;
END$$

DELIMITER ;

-- Insert default student assessment preferences for existing users
INSERT IGNORE INTO student_assessment_preferences (student_id, auto_save_interval, show_timer, show_progress, enable_notifications, preferred_theme)
SELECT 
    id as student_id,
    30 as auto_save_interval,
    TRUE as show_timer,
    TRUE as show_progress,
    TRUE as enable_notifications,
    'auto' as preferred_theme
FROM users 
WHERE role = 'student';

-- Create views for common queries
CREATE OR REPLACE VIEW student_assessment_summary AS
SELECT 
    s.id as submission_id,
    s.assessment_id,
    s.student_id,
    u.name as student_name,
    u.email as student_email,
    a.title as assessment_title,
    s.attempt_number,
    s.status,
    s.total_score,
    s.percentage,
    s.grade,
    s.start_time,
    s.end_time,
    s.total_time_spent,
    s.submitted_at,
    COUNT(sr.id) as total_questions_answered,
    SUM(CASE WHEN sr.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
    SUM(sr.points_earned) as total_points_earned
FROM assessment_submissions s
LEFT JOIN users u ON s.student_id = u.id
LEFT JOIN assessments a ON s.assessment_id = a.id
LEFT JOIN student_responses sr ON s.id = sr.submission_id
GROUP BY s.id, s.assessment_id, s.student_id, u.name, u.email, a.title, s.attempt_number, s.status, s.total_score, s.percentage, s.grade, s.start_time, s.end_time, s.total_time_spent, s.submitted_at;

-- Create view for assessment performance analytics
CREATE OR REPLACE VIEW assessment_performance_analytics AS
SELECT 
    a.id as assessment_id,
    a.title as assessment_title,
    COUNT(DISTINCT s.student_id) as total_students,
    COUNT(DISTINCT s.id) as total_submissions,
    AVG(s.percentage) as average_percentage,
    AVG(s.total_score) as average_score,
    AVG(s.total_time_spent) as average_time_spent,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_submissions,
    COUNT(CASE WHEN s.status = 'auto_submitted' THEN 1 END) as auto_submitted,
    COUNT(CASE WHEN s.status = 'abandoned' THEN 1 END) as abandoned_submissions,
    MIN(s.start_time) as first_attempt,
    MAX(s.end_time) as last_submission
FROM assessments a
LEFT JOIN assessment_submissions s ON a.id = s.assessment_id
GROUP BY a.id, a.title;
