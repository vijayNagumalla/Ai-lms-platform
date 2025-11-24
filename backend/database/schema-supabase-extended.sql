-- Extended Supabase Schema - Additional Tables
-- Run this after the main schema-supabase.sql file

-- =====================================================
-- BATCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (college_id, code)
);

CREATE INDEX IF NOT EXISTS idx_batches_college_id ON batches(college_id);
CREATE INDEX IF NOT EXISTS idx_batches_department_id ON batches(department_id);

-- =====================================================
-- CODING PLATFORMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coding_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    profile_url_pattern VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(255),
    scraping_config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STUDENT CODING PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS student_coding_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES coding_platforms(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    profile_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'failed')),
    sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, platform_id)
);

CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_student_id ON student_coding_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_platform_id ON student_coding_profiles(platform_id);
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_username ON student_coding_profiles(username);
CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_sync_status ON student_coding_profiles(sync_status);

-- =====================================================
-- CODING PLATFORM DATA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coding_platform_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES student_coding_profiles(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES coding_platforms(id) ON DELETE CASCADE,
    data_type VARCHAR(30) NOT NULL CHECK (data_type IN ('problems_solved', 'rating', 'ranking', 'badges', 'achievements', 'contest_participation')),
    metric_name VARCHAR(100) NOT NULL,
    metric_value VARCHAR(255),
    numeric_value NUMERIC(10,2),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('school', 'basic', 'easy', 'medium', 'hard')),
    additional_data JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coding_platform_data_profile_id ON coding_platform_data(profile_id);
CREATE INDEX IF NOT EXISTS idx_coding_platform_data_platform_id ON coding_platform_data(platform_id);
CREATE INDEX IF NOT EXISTS idx_coding_platform_data_data_type ON coding_platform_data(data_type);
CREATE INDEX IF NOT EXISTS idx_coding_platform_data_recorded_at ON coding_platform_data(recorded_at);

-- =====================================================
-- CODING ACHIEVEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coding_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES student_coding_profiles(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES coding_platforms(id) ON DELETE CASCADE,
    achievement_type VARCHAR(20) NOT NULL CHECK (achievement_type IN ('badge', 'certificate', 'star', 'medal', 'trophy')),
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    achievement_level VARCHAR(20) CHECK (achievement_level IN ('bronze', 'silver', 'gold', 'platinum')),
    stars_count INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    achievement_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_coding_achievements_profile_id ON coding_achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_coding_achievements_platform_id ON coding_achievements(platform_id);

-- =====================================================
-- CODING PROFILE SYNC LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coding_profile_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES student_coding_profiles(id) ON DELETE CASCADE,
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('manual', 'scheduled', 'bulk')),
    sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('started', 'in_progress', 'completed', 'failed')),
    sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    data_fetched JSONB,
    error_message TEXT,
    records_updated INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_coding_profile_sync_logs_profile_id ON coding_profile_sync_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_coding_profile_sync_logs_sync_status ON coding_profile_sync_logs(sync_status);

-- =====================================================
-- STUDENT RESPONSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS student_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    section_id UUID,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'coding')),
    student_answer TEXT,
    selected_options JSONB,
    time_spent INTEGER DEFAULT 0,
    is_correct BOOLEAN,
    points_earned NUMERIC(10,2) DEFAULT 0,
    auto_saved BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_student_responses_submission_id ON student_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_student_responses_question_id ON student_responses(question_id);

-- =====================================================
-- PROCTORING LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS proctoring_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    violation_type VARCHAR(30) NOT NULL CHECK (violation_type IN ('tab_switch', 'right_click', 'copy_paste', 'dev_tools', 'window_focus', 'fullscreen_exit', 'keyboard_shortcut', 'webcam_disconnect', 'suspicious_activity')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    severity_level VARCHAR(10) DEFAULT 'low' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proctoring_logs_submission_id ON proctoring_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_logs_violation_type ON proctoring_logs(violation_type);
CREATE INDEX IF NOT EXISTS idx_proctoring_logs_timestamp ON proctoring_logs(timestamp);

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    project_type VARCHAR(20) NOT NULL CHECK (project_type IN ('company_specific', 'crt', 'custom')),
    total_hours_required INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    trainers_required INTEGER DEFAULT 1,
    admins_required INTEGER DEFAULT 0,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('online', 'offline', 'hybrid')),
    preferred_timings JSONB,
    project_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    spoc_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'faculty_allocation', 'scheduling', 'admin_allocation', 'live', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_college_id ON projects(college_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- =====================================================
-- ROOMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    building VARCHAR(255),
    floor INTEGER,
    capacity INTEGER NOT NULL,
    room_type VARCHAR(20) DEFAULT 'lecture' CHECK (room_type IN ('lecture', 'lab', 'auditorium', 'seminar')),
    amenities JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (college_id, code)
);

CREATE INDEX IF NOT EXISTS idx_rooms_college_id ON rooms(college_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);

-- =====================================================
-- ADD TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coding_platforms_updated_at BEFORE UPDATE ON coding_platforms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_coding_profiles_updated_at BEFORE UPDATE ON student_coding_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_responses_updated_at BEFORE UPDATE ON student_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

