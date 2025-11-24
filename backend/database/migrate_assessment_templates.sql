-- Migration to create assessment_templates table with enhanced features
USE lms_platform;

-- Create assessment_templates table
CREATE TABLE IF NOT EXISTS assessment_templates (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    assessment_type ENUM('quiz', 'test', 'exam', 'assignment', 'coding_challenge', 'survey') NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    time_limit_minutes INT DEFAULT 30,
    total_points INT DEFAULT 100,
    passing_score INT DEFAULT 70,
    max_attempts INT DEFAULT 1,
    time_between_attempts_hours INT DEFAULT 0,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    show_results_immediately BOOLEAN DEFAULT TRUE,
    allow_review BOOLEAN DEFAULT TRUE,
    show_correct_answers BOOLEAN DEFAULT FALSE,
    require_proctoring BOOLEAN DEFAULT FALSE,
    proctoring_type ENUM('none', 'basic', 'advanced', 'ai') DEFAULT 'none',
    proctoring_settings JSON,
    scheduling JSON,
    access_control JSON,
    assignment_settings JSON,
    sections JSON,
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
    college_id VARCHAR(36),
    department VARCHAR(255),
    tags JSON,
    metadata JSON,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assessment_type (assessment_type),
    INDEX idx_difficulty_level (difficulty_level),
    INDEX idx_status (status),
    INDEX idx_college_id (college_id),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
);

-- Create assessment_sections table
CREATE TABLE IF NOT EXISTS assessment_sections (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT NOT NULL,
    time_limit_minutes INT,
    allowed_question_types JSON,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    navigation_type ENUM('free', 'sequential') DEFAULT 'free',
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_order_index (order_index)
);

-- Create assessment_questions table (linking questions to assessments)
CREATE TABLE IF NOT EXISTS assessment_questions (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    section_id VARCHAR(36),
    question_order INT NOT NULL,
    points INT DEFAULT 1,
    time_limit_seconds INT,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES assessment_sections(id) ON DELETE SET NULL,
    UNIQUE KEY unique_assessment_question (assessment_id, question_id),
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_question_id (question_id),
    INDEX idx_section_id (section_id),
    INDEX idx_question_order (question_order)
);

-- Create assessment_assignments table
CREATE TABLE IF NOT EXISTS assessment_assignments (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    assignment_type ENUM('individual', 'group', 'college', 'department', 'course') NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    time_zone VARCHAR(50) DEFAULT 'UTC',
    early_access_hours INT DEFAULT 0,
    late_submission_minutes INT DEFAULT 0,
    password VARCHAR(255),
    ip_restrictions JSON,
    device_restrictions JSON,
    browser_restrictions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_assignment_type (assignment_type),
    INDEX idx_target_id (target_id),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date)
);

-- Show the created tables
SHOW TABLES LIKE 'assessment_%'; 