-- Migration: Add default departments to the system
-- Date: 2025-01-27

-- Insert default departments that colleges can choose from
INSERT INTO college_departments (id, college_id, name, code, description, is_active, created_at, updated_at) VALUES
(UUID(), 'college-001', 'Computer Science', 'CS', 'Computer Science and Engineering Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Electrical Engineering', 'EE', 'Electrical and Electronics Engineering Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Mechanical Engineering', 'ME', 'Mechanical Engineering Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Civil Engineering', 'CE', 'Civil Engineering Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Information Technology', 'IT', 'Information Technology Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Electronics & Communication', 'ECE', 'Electronics and Communication Engineering Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Chemical Engineering', 'CHE', 'Chemical Engineering Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Biotechnology', 'BT', 'Biotechnology Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Business Administration', 'BA', 'Business Administration and Management Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Commerce', 'COM', 'Commerce and Accounting Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Economics', 'ECO', 'Economics Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Mathematics', 'MATH', 'Mathematics Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Physics', 'PHY', 'Physics Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Chemistry', 'CHEM', 'Chemistry Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'English', 'ENG', 'English Language and Literature Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'History', 'HIST', 'History Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Psychology', 'PSY', 'Psychology Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Sociology', 'SOC', 'Sociology Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Political Science', 'POL', 'Political Science Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Geography', 'GEO', 'Geography Department', TRUE, NOW(), NOW()),
(UUID(), 'college-001', 'Philosophy', 'PHIL', 'Philosophy Department', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE
name = VALUES(name),
description = VALUES(description),
updated_at = NOW();
