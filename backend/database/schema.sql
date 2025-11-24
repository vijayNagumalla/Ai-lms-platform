-- LMS Platform Database Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS lms_platform;
USE lms_platform;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('super-admin', 'college-admin', 'faculty', 'student') NOT NULL,
    college_id VARCHAR(36),
    department VARCHAR(255),
    student_id VARCHAR(50),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_college_id (college_id),
    -- CRITICAL FIX: Add foreign key constraint for college_id
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    -- CRITICAL FIX: Add unique constraint for student_id (per college if needed)
    -- Note: This assumes student_id should be unique globally. 
    -- If student_id should be unique per college, use composite unique constraint
    UNIQUE KEY unique_student_id (student_id)
);

-- Colleges table
CREATE TABLE IF NOT EXISTS colleges (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    established_year INT,
    accreditation VARCHAR(255),
    contact_person VARCHAR(255),
    contact_person_phone VARCHAR(20),
    contact_person_email VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_city (city),
    INDEX idx_state (state),
    INDEX idx_country (country),
    INDEX idx_is_active (is_active)
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    INDEX idx_college_id (college_id)
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    college_id VARCHAR(36) NOT NULL,
    department_id VARCHAR(36),
    instructor_id VARCHAR(36) NOT NULL,
    credits INT DEFAULT 3,
    duration_weeks INT DEFAULT 16,
    max_students INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    thumbnail_url VARCHAR(500),
    syllabus_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_college_id (college_id),
    INDEX idx_instructor_id (instructor_id),
    INDEX idx_code (code)
);

-- Course enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
    grade VARCHAR(2),
    completion_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (course_id, student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_student_id (student_id)
);

-- Course modules table
CREATE TABLE IF NOT EXISTS course_modules (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_id (course_id),
    INDEX idx_order (order_index)
);

-- Course content table
CREATE TABLE IF NOT EXISTS course_content (
    id VARCHAR(36) PRIMARY KEY,
    module_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_type ENUM('video', 'document', 'quiz', 'assignment', 'link') NOT NULL,
    content TEXT,
    file_url VARCHAR(500),
    duration_minutes INT,
    order_index INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE,
    INDEX idx_module_id (module_id),
    INDEX idx_order (order_index)
);

-- Enhanced Assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id VARCHAR(36),
    college_id VARCHAR(36),
    type ENUM('quiz', 'exam', 'assignment', 'project', 'coding_assessment', 'mcq_test', 'fill_blanks', 'essay', 'practical') NOT NULL,
    category VARCHAR(100),
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    total_points INT DEFAULT 100,
    duration_minutes INT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    is_timed BOOLEAN DEFAULT TRUE,
    allow_retake BOOLEAN DEFAULT FALSE,
    max_attempts INT DEFAULT 1,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    show_results_immediately BOOLEAN DEFAULT FALSE,
    passing_score INT DEFAULT 60,
    instructions TEXT,
    created_by VARCHAR(36) NOT NULL,
    assigned_to_college_id VARCHAR(36),
    assigned_to_student_ids JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    INDEX idx_course_id (course_id),
    INDEX idx_college_id (college_id),
    INDEX idx_type (type),
    INDEX idx_created_by (created_by),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_assigned_to_college_id (assigned_to_college_id)
);

-- Enhanced Assessment questions table
CREATE TABLE IF NOT EXISTS assessment_questions (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay', 'coding', 'fill_blanks', 'matching', 'ordering', 'hotspot', 'file_upload') NOT NULL,
    points INT DEFAULT 1,
    options JSON,
    correct_answer TEXT,
    correct_answers JSON,
    explanation TEXT,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    order_index INT NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_question_type (question_type),
    INDEX idx_order (order_index)
);

-- Coding assessment specific table
CREATE TABLE IF NOT EXISTS coding_questions (
    id VARCHAR(36) PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL,
    language VARCHAR(50) NOT NULL,
    starter_code TEXT,
    solution_code TEXT,
    test_cases JSON NOT NULL,
    time_limit INT DEFAULT 1000,
    memory_limit INT DEFAULT 256,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100),
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id),
    INDEX idx_language (language),
    INDEX idx_difficulty (difficulty)
);

-- Enhanced Assessment submissions table
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

-- Coding submission results table
CREATE TABLE IF NOT EXISTS coding_submission_results (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status ENUM('pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compilation_error') DEFAULT 'pending',
    execution_time INT,
    memory_used INT,
    test_cases_passed INT DEFAULT 0,
    total_test_cases INT DEFAULT 0,
    score INT DEFAULT 0,
    feedback TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE,
    INDEX idx_submission_id (submission_id),
    INDEX idx_question_id (question_id),
    INDEX idx_status (status)
);

-- Assessment analytics table
CREATE TABLE IF NOT EXISTS assessment_analytics (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    total_students_assigned INT DEFAULT 0,
    total_students_attempted INT DEFAULT 0,
    total_students_completed INT DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    highest_score INT DEFAULT 0,
    lowest_score INT DEFAULT 0,
    pass_rate DECIMAL(5,2) DEFAULT 0,
    average_time_taken_minutes INT DEFAULT 0,
    question_analytics JSON,
    difficulty_analysis JSON,
    college_performance JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id)
);

-- Assessment reports table
CREATE TABLE IF NOT EXISTS assessment_reports (
    id VARCHAR(36) PRIMARY KEY,
    report_type ENUM('college_level', 'student_level', 'assessment_level', 'question_level') NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    generated_by VARCHAR(36) NOT NULL,
    filters JSON,
    report_data JSON,
    file_url VARCHAR(500),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_report_type (report_type),
    INDEX idx_generated_by (generated_by),
    INDEX idx_generated_at (generated_at)
);

-- Assessment notifications table
CREATE TABLE IF NOT EXISTS assessment_notifications (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    notification_type ENUM('assignment_created', 'assessment_started', 'assessment_ending_soon', 'assessment_completed', 'result_available', 'reminder') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_notification_type (notification_type),
    INDEX idx_is_read (is_read)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- CRITICAL SECURITY FIX: Removed default super admin user
-- SECURITY NOTE: Default credentials (admin@lms.com / admin123) have been removed for security
-- To create the first super admin user:
-- 1. Use the registration endpoint with SUPER_ADMIN_REGISTRATION_CODE from environment variables
-- 2. Or manually create via SQL with a secure password hash:
--    INSERT INTO users (id, email, password, name, role, is_active, email_verified) 
--    VALUES (UUID(), 'your-admin@email.com', 'bcrypt_hash_here', 'Admin Name', 'super-admin', TRUE, TRUE);
-- 
-- To generate a bcrypt hash in Node.js:
--    const bcrypt = require('bcryptjs');
--    const hash = await bcrypt.hash('your-secure-password', 12);
