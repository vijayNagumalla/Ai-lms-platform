-- Migration to create questions table for Question Bank
USE lms_platform;

-- Create questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255),
    content TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'single_choice', 'true_false', 'short_answer', 'essay', 'coding', 'fill_blanks') NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    points INT DEFAULT 1,
    time_limit_seconds INT,
    category_id VARCHAR(36),
    subcategory_id VARCHAR(36),
    tags JSON,
    options JSON,
    correct_answer JSON,
    correct_answers JSON,
    explanation TEXT,
    hints JSON,
    metadata JSON,
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
    usage_count INT DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    college_id VARCHAR(36),
    department VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES question_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES question_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    INDEX idx_question_type (question_type),
    INDEX idx_difficulty_level (difficulty_level),
    INDEX idx_category_id (category_id),
    INDEX idx_created_by (created_by),
    INDEX idx_college_id (college_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_updated_at (updated_at)
);

-- Create question_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS question_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id VARCHAR(36),
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    is_public BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(36) NOT NULL,
    college_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES question_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    INDEX idx_parent_id (parent_id),
    INDEX idx_created_by (created_by),
    INDEX idx_college_id (college_id),
    INDEX idx_is_public (is_public)
);

-- Create question_tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS question_tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_by VARCHAR(36) NOT NULL,
    college_id VARCHAR(36),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    INDEX idx_created_by (created_by),
    INDEX idx_college_id (college_id),
    INDEX idx_is_public (is_public)
);

-- Show the created table structure
DESCRIBE questions;
DESCRIBE question_categories;
DESCRIBE question_tags; 