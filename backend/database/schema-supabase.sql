-- LMS Platform Database Schema for Supabase (PostgreSQL)
-- This schema is converted from MySQL to PostgreSQL syntax

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB for better JSON support
-- (Already enabled by default in Supabase)

-- =====================================================
-- COLLEGES TABLE (must be created first due to foreign keys)
-- =====================================================
CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    established_year INTEGER,
    accreditation VARCHAR(255),
    contact_person VARCHAR(255),
    contact_person_phone VARCHAR(20),
    contact_person_email VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for colleges
CREATE INDEX IF NOT EXISTS idx_colleges_code ON colleges(code);
CREATE INDEX IF NOT EXISTS idx_colleges_city ON colleges(city);
CREATE INDEX IF NOT EXISTS idx_colleges_state ON colleges(state);
CREATE INDEX IF NOT EXISTS idx_colleges_country ON colleges(country);
CREATE INDEX IF NOT EXISTS idx_colleges_is_active ON colleges(is_active);

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super-admin', 'college-admin', 'faculty', 'student')),
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    department VARCHAR(255),
    student_id VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id);

-- =====================================================
-- DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_college_id ON departments(college_id);

-- =====================================================
-- COURSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credits INTEGER DEFAULT 3,
    duration_weeks INTEGER DEFAULT 16,
    max_students INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    thumbnail_url VARCHAR(500),
    syllabus_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_college_id ON courses(college_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

-- =====================================================
-- COURSE ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    grade VARCHAR(2),
    completion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);

-- =====================================================
-- COURSE MODULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_order ON course_modules(order_index);

-- =====================================================
-- COURSE CONTENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS course_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'document', 'quiz', 'assignment', 'link')),
    content TEXT,
    file_url VARCHAR(500),
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_content_module_id ON course_content(module_id);
CREATE INDEX IF NOT EXISTS idx_course_content_order ON course_content(order_index);

-- =====================================================
-- ASSESSMENTS TABLE (renamed from assessment_templates in some queries)
-- =====================================================
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('quiz', 'exam', 'assignment', 'project', 'coding_assessment', 'mcq_test', 'fill_blanks', 'essay', 'practical')),
    category VARCHAR(100),
    difficulty_level VARCHAR(10) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    total_points INTEGER DEFAULT 100,
    duration_minutes INTEGER,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    is_timed BOOLEAN DEFAULT TRUE,
    allow_retake BOOLEAN DEFAULT FALSE,
    max_attempts INTEGER DEFAULT 1,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    show_results_immediately BOOLEAN DEFAULT FALSE,
    passing_score INTEGER DEFAULT 60,
    instructions TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to_college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    assigned_to_student_ids JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessments_college_id ON assessments(college_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);
CREATE INDEX IF NOT EXISTS idx_assessments_start_time ON assessments(start_time);
CREATE INDEX IF NOT EXISTS idx_assessments_end_time ON assessments(end_time);
CREATE INDEX IF NOT EXISTS idx_assessments_assigned_to_college_id ON assessments(assigned_to_college_id);

-- =====================================================
-- ASSESSMENT QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'coding', 'fill_blanks', 'matching', 'ordering', 'hotspot', 'file_upload')),
    points INTEGER DEFAULT 1,
    options JSONB,
    correct_answer TEXT,
    correct_answers JSONB,
    explanation TEXT,
    difficulty_level VARCHAR(10) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_question_type ON assessment_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_order ON assessment_questions(order_index);

-- =====================================================
-- CODING QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coding_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    starter_code TEXT,
    solution_code TEXT,
    test_cases JSONB NOT NULL,
    time_limit INTEGER DEFAULT 1000,
    memory_limit INTEGER DEFAULT 256,
    difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category VARCHAR(100),
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coding_questions_question_id ON coding_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_coding_questions_language ON coding_questions(language);
CREATE INDEX IF NOT EXISTS idx_coding_questions_difficulty ON coding_questions(difficulty);

-- =====================================================
-- ASSESSMENT SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB,
    coding_submissions JSONB,
    file_submissions JSONB,
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    percentage_score NUMERIC(5,2) DEFAULT 0,
    time_taken_minutes INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'late', 'disqualified')),
    attempt_number INTEGER DEFAULT 1,
    auto_submitted BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    UNIQUE (assessment_id, student_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment_id ON assessment_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_student_id ON assessment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_status ON assessment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_submitted_at ON assessment_submissions(submitted_at);

-- =====================================================
-- CODING SUBMISSION RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coding_submission_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compilation_error')),
    execution_time INTEGER,
    memory_used INTEGER,
    test_cases_passed INTEGER DEFAULT 0,
    total_test_cases INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coding_submission_results_submission_id ON coding_submission_results(submission_id);
CREATE INDEX IF NOT EXISTS idx_coding_submission_results_question_id ON coding_submission_results(question_id);
CREATE INDEX IF NOT EXISTS idx_coding_submission_results_status ON coding_submission_results(status);

-- =====================================================
-- ASSESSMENT ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    total_students_assigned INTEGER DEFAULT 0,
    total_students_attempted INTEGER DEFAULT 0,
    total_students_completed INTEGER DEFAULT 0,
    average_score NUMERIC(5,2) DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    lowest_score INTEGER DEFAULT 0,
    pass_rate NUMERIC(5,2) DEFAULT 0,
    average_time_taken_minutes INTEGER DEFAULT 0,
    question_analytics JSONB,
    difficulty_analysis JSONB,
    college_performance JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_analytics_assessment_id ON assessment_analytics(assessment_id);

-- =====================================================
-- ASSESSMENT REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('college_level', 'student_level', 'assessment_level', 'question_level')),
    report_name VARCHAR(255) NOT NULL,
    generated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filters JSONB,
    report_data JSONB,
    file_url VARCHAR(500),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_reports_report_type ON assessment_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_generated_by ON assessment_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_generated_at ON assessment_reports(generated_at);

-- =====================================================
-- ASSESSMENT NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('assignment_created', 'assessment_started', 'assessment_ending_soon', 'assessment_completed', 'result_available', 'reminder')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_notifications_assessment_id ON assessment_notifications(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_notifications_user_id ON assessment_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_notifications_notification_type ON assessment_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_assessment_notifications_is_read ON assessment_notifications(is_read);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(10) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    related_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- QUESTION CATEGORIES TABLE (for question bank)
-- =====================================================
CREATE TABLE IF NOT EXISTS question_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES question_categories(id) ON DELETE SET NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_categories_college_id ON question_categories(college_id);
CREATE INDEX IF NOT EXISTS idx_question_categories_created_by ON question_categories(created_by);

-- =====================================================
-- QUESTION TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS question_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_tags_college_id ON question_tags(college_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_created_by ON question_tags(created_by);

-- =====================================================
-- QUESTIONS TABLE (question bank)
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    category_id UUID REFERENCES question_categories(id) ON DELETE SET NULL,
    difficulty_level VARCHAR(10) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    points INTEGER DEFAULT 1,
    options JSONB,
    correct_answer TEXT,
    correct_answers JSONB,
    explanation TEXT,
    tags JSONB,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_college_id ON questions(college_id);
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions(question_type);

-- =====================================================
-- QUESTION ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS question_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_attachments_question_id ON question_attachments(question_id);

-- =====================================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON colleges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON course_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_content_updated_at BEFORE UPDATE ON course_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_question_categories_updated_at BEFORE UPDATE ON question_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables (optional, can be configured per your needs)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
-- Add your RLS policies here based on your security requirements

