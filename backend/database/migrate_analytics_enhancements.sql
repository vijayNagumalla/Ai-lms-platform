-- Migration for Analytics Enhancements
USE lms_platform;

-- Create analytics_views table for saving filter presets
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

-- Create chart_annotations table for chart comments
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
    INDEX idx_chart_type (chart_type),
    INDEX idx_module (module),
    INDEX idx_created_at (created_at)
);

-- Add category field to courses table if not exists
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general' AFTER description;

-- Add rating field to course_enrollments table if not exists
ALTER TABLE course_enrollments 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT NULL AFTER grade,
ADD COLUMN IF NOT EXISTS time_spent_hours DECIMAL(5,2) DEFAULT 0 AFTER rating;

-- Add is_completed field to course_content table if not exists
ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE AFTER order_index,
ADD COLUMN IF NOT EXISTS time_spent_minutes INT DEFAULT 0 AFTER is_completed;

-- Create indexes for better analytics performance
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_submitted_at ON assessment_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_student_id ON assessment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment_id ON assessment_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_status ON assessment_submissions(status);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_enrollment_date ON course_enrollments(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);

CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert sample analytics views for testing
INSERT INTO analytics_views (id, name, module, filters, user_id) VALUES
(UUID(), 'Recent Assessment Performance', 'assessments', 
 '{"dateRange": "30", "collegeId": "all", "departmentId": "all", "assessmentType": "all"}', 
 (SELECT id FROM users WHERE role = 'super-admin' LIMIT 1)),
(UUID(), 'Course Completion Analysis', 'courses', 
 '{"dateRange": "90", "collegeId": "all", "departmentId": "all", "courseCategory": "all"}', 
 (SELECT id FROM users WHERE role = 'super-admin' LIMIT 1));

-- Insert sample chart annotations for testing
INSERT INTO chart_annotations (id, chart_type, data_point, title, comment, filters, module, user_id) VALUES
(UUID(), 'scoreDistribution', '{"scoreRange": "80-89%", "count": 45}', 
 'High Performance Trend', 'Excellent performance in the 80-89% range. Consider advanced content for these students.', 
 '{"dateRange": "30", "collegeId": "all"}', 'assessments', 
 (SELECT id FROM users WHERE role = 'super-admin' LIMIT 1)),
(UUID(), 'enrollmentVsCompletion', '{"name": "Programming Fundamentals", "enrollment": 120, "completion": 95}', 
 'Strong Course Performance', 'Programming Fundamentals shows excellent completion rates. Consider expanding similar courses.', 
 '{"dateRange": "90", "collegeId": "all"}', 'courses', 
 (SELECT id FROM users WHERE role = 'super-admin' LIMIT 1));

-- Show the created tables structure
DESCRIBE analytics_views;
DESCRIBE chart_annotations;

-- Show sample data
SELECT 'Analytics Views' as table_name, COUNT(*) as count FROM analytics_views
UNION ALL
SELECT 'Chart Annotations' as table_name, COUNT(*) as count FROM chart_annotations; 