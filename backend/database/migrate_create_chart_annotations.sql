-- Migration to create chart_annotations table
USE lms_platform;

-- Create chart_annotations table
CREATE TABLE IF NOT EXISTS chart_annotations (
    id VARCHAR(36) PRIMARY KEY,
    chart_type VARCHAR(100) NOT NULL,
    data_point JSON,
    title VARCHAR(255) NOT NULL,
    comment TEXT,
    filters JSON,
    module ENUM('assessments', 'courses') NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_chart_type (chart_type),
    INDEX idx_created_at (created_at)
);

-- Create analytics_views table for saved views
CREATE TABLE IF NOT EXISTS analytics_views (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    module ENUM('assessments', 'courses') NOT NULL,
    filters JSON NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_created_at (created_at)
);

-- Show the created tables structure
DESCRIBE chart_annotations;
DESCRIBE analytics_views; 