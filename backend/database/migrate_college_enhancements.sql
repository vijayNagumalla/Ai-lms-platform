-- Migration: Enhance college structure with contact persons and departments
-- Date: 2025-01-27

-- Create contact_persons table for multiple contact persons per college
CREATE TABLE IF NOT EXISTS contact_persons (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    INDEX idx_college_id (college_id),
    INDEX idx_is_primary (is_primary)
);

-- Create college_departments table for departments associated with colleges
CREATE TABLE IF NOT EXISTS college_departments (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_college_dept_code (college_id, code),
    INDEX idx_college_id (college_id),
    INDEX idx_code (code)
);

-- Add some common departments as default options
INSERT INTO college_departments (id, college_id, name, code, description) VALUES
('dept-cs-001', 'college-001', 'Computer Science', 'CS', 'Computer Science and Engineering'),
('dept-it-001', 'college-001', 'Information Technology', 'IT', 'Information Technology'),
('dept-mech-001', 'college-001', 'Mechanical Engineering', 'MECH', 'Mechanical Engineering'),
('dept-ece-001', 'college-001', 'Electronics & Communication', 'ECE', 'Electronics and Communication Engineering'),
('dept-civil-001', 'college-001', 'Civil Engineering', 'CIVIL', 'Civil Engineering'),
('dept-ece-001', 'college-001', 'Electrical Engineering', 'EEE', 'Electrical and Electronics Engineering'),
('dept-biotech-001', 'college-001', 'Biotechnology', 'BIOTECH', 'Biotechnology'),
('dept-chem-001', 'college-001', 'Chemical Engineering', 'CHEM', 'Chemical Engineering'),
('dept-mba-001', 'college-001', 'Business Administration', 'MBA', 'Master of Business Administration'),
('dept-pharma-001', 'college-001', 'Pharmacy', 'PHARMA', 'Pharmacy')
ON DUPLICATE KEY UPDATE name=name;
