-- Migration to create assessment_submissions table
USE lms_platform;

-- Create assessment_submissions table
CREATE TABLE IF NOT EXISTS assessment_submissions (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    answers JSON,
    coding_submissions JSON,
    file_submissions JSON,
    score INT DEFAULT 0,
    max_score INT DEFAULT 0,
    percentage_score DECIMAL(5,2) DEFAULT 0,
    time_taken_minutes INT,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    graded_by VARCHAR(36),
    feedback TEXT,
    status ENUM('in_progress', 'submitted', 'graded', 'late', 'disqualified') DEFAULT 'in_progress',
    attempt_number INT DEFAULT 1,
    auto_submitted BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_submission (assessment_id, student_id, attempt_number),
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at)
);

-- Show the created table structure
DESCRIBE assessment_submissions; 