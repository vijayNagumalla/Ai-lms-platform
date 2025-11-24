-- Enhanced LMS Platform - Additional Tables for New Features
-- This file contains the database schema for attendance, scheduling, and faculty status management

-- Create Rooms table first (referenced by other tables)
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    building VARCHAR(255),
    floor INT,
    capacity INT NOT NULL,
    room_type ENUM('lecture', 'lab', 'seminar', 'auditorium', 'library') DEFAULT 'lecture',
    equipment JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_building (building),
    INDEX idx_room_type (room_type),
    INDEX idx_is_active (is_active)
);

-- Create Classes table (referenced by attendance_sessions)
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    class_code VARCHAR(50) NOT NULL,
    semester VARCHAR(50),
    academic_year VARCHAR(20),
    max_students INT DEFAULT 50,
    current_enrollment INT DEFAULT 0,
    status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_course_id (course_id),
    INDEX idx_instructor_id (instructor_id),
    INDEX idx_status (status),
    INDEX idx_semester (semester)
);

-- Attendance Management Tables
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id VARCHAR(36),
    attendance_method ENUM('manual', 'qr', 'biometric', 'gps') DEFAULT 'manual',
    qr_code VARCHAR(500),
    qr_expires_at TIMESTAMP,
    status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
    total_students INT DEFAULT 0,
    present_count INT DEFAULT 0,
    absent_count INT DEFAULT 0,
    late_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    INDEX idx_class_id (class_id),
    INDEX idx_course_id (course_id),
    INDEX idx_instructor_id (instructor_id),
    INDEX idx_session_date (session_date),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marked_by VARCHAR(36),
    method ENUM('manual', 'qr', 'biometric', 'gps') DEFAULT 'manual',
    notes TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_attendance (session_id, student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_marked_at (marked_at)
);

-- Class Scheduling Tables (classes and rooms already created above)
CREATE TABLE IF NOT EXISTS class_schedules (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(36) NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id VARCHAR(36),
    schedule_type ENUM('lecture', 'lab', 'tutorial', 'seminar') DEFAULT 'lecture',
    is_recurring BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    INDEX idx_class_id (class_id),
    INDEX idx_day_of_week (day_of_week),
    INDEX idx_room_id (room_id)
);

CREATE TABLE IF NOT EXISTS class_enrollments (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
    grade VARCHAR(2),
    attendance_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (class_id, student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
);

-- Faculty Status Management Tables
CREATE TABLE IF NOT EXISTS faculty_status (
    id VARCHAR(36) PRIMARY KEY,
    faculty_id VARCHAR(36) NOT NULL,
    status ENUM('available', 'busy', 'away', 'offline') DEFAULT 'offline',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_type ENUM('desktop', 'laptop', 'mobile', 'tablet') DEFAULT 'desktop',
    browser VARCHAR(100),
    ip_address VARCHAR(45),
    location_type ENUM('on_campus', 'remote', 'off_campus') DEFAULT 'off_campus',
    building VARCHAR(255),
    room VARCHAR(100),
    coordinates JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_faculty_status (faculty_id),
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_status (status),
    INDEX idx_last_seen (last_seen)
);

CREATE TABLE IF NOT EXISTS faculty_availability (
    id VARCHAR(36) PRIMARY KEY,
    faculty_id VARCHAR(36) NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    availability_type ENUM('office_hours', 'teaching', 'research', 'meeting', 'break') DEFAULT 'office_hours',
    is_available BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_day_of_week (day_of_week),
    INDEX idx_availability_type (availability_type)
);

CREATE TABLE IF NOT EXISTS faculty_workload (
    id VARCHAR(36) PRIMARY KEY,
    faculty_id VARCHAR(36) NOT NULL,
    semester VARCHAR(50),
    academic_year VARCHAR(20),
    teaching_hours INT DEFAULT 0,
    research_hours INT DEFAULT 0,
    admin_hours INT DEFAULT 0,
    total_hours INT DEFAULT 0,
    max_hours INT DEFAULT 40,
    workload_percentage DECIMAL(5,2) DEFAULT 0,
    courses_count INT DEFAULT 0,
    students_count INT DEFAULT 0,
    projects_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_semester (semester),
    INDEX idx_academic_year (academic_year)
);

-- Assessment Templates Table (if not exists)
CREATE TABLE IF NOT EXISTS assessment_templates (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type ENUM('quiz', 'exam', 'assignment', 'project', 'coding_assessment', 'mcq_test', 'fill_blanks', 'essay', 'practical') NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    time_limit_minutes INT,
    total_points INT DEFAULT 100,
    passing_score INT DEFAULT 60,
    instructions TEXT,
    college_id VARCHAR(36),
    department_id VARCHAR(36),
    created_by VARCHAR(36) NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    is_template BOOLEAN DEFAULT FALSE,
    template_category VARCHAR(100),
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assessment_type (assessment_type),
    INDEX idx_college_id (college_id),
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    INDEX idx_is_template (is_template)
);

-- Insert default rooms
INSERT INTO rooms (id, name, code, building, floor, capacity, room_type, equipment, is_active) VALUES
('room-001', 'Lab 201', 'LAB201', 'Computer Science Building', 2, 50, 'lab', '["Computers", "Projector", "Whiteboard"]', TRUE),
('room-002', 'Room 105', 'R105', 'Main Building', 1, 40, 'lecture', '["Projector", "Whiteboard", "Sound System"]', TRUE),
('room-003', 'Room 203', 'R203', 'Main Building', 2, 45, 'lab', '["Computers", "Projector"]', TRUE),
('room-004', 'Auditorium A', 'AUD-A', 'Main Building', 1, 200, 'auditorium', '["Projector", "Sound System", "Stage"]', TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Insert default departments if not exist (only if college-001 exists)
INSERT INTO departments (id, college_id, name, code, description, is_active) 
SELECT 'dept-001', c.id, 'Computer Science', 'CS', 'Computer Science and Engineering Department', TRUE
FROM colleges c WHERE c.id = 'college-001'
ON DUPLICATE KEY UPDATE departments.id=departments.id;

INSERT INTO departments (id, college_id, name, code, description, is_active) 
SELECT 'dept-002', c.id, 'Mathematics', 'MATH', 'Mathematics Department', TRUE
FROM colleges c WHERE c.id = 'college-001'
ON DUPLICATE KEY UPDATE departments.id=departments.id;

INSERT INTO departments (id, college_id, name, code, description, is_active) 
SELECT 'dept-003', c.id, 'Physics', 'PHYS', 'Physics Department', TRUE
FROM colleges c WHERE c.id = 'college-001'
ON DUPLICATE KEY UPDATE departments.id=departments.id;
