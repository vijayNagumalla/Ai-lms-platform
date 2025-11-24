# Project Management System - Complete Design Document

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Design (ERD)](#database-design-erd)
4. [Module Specifications](#module-specifications)
5. [API Specifications](#api-specifications)
6. [UI/UX Design](#uiux-design)
7. [Workflows & Sequence Diagrams](#workflows--sequence-diagrams)
8. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
9. [Tech Stack](#tech-stack)
10. [Implementation Plan](#implementation-plan)

---

## System Overview

### Purpose
A comprehensive Project Management System for Training/LMS Platform that manages:
- Training projects across multiple colleges
- Faculty allocation and scheduling
- Class scheduling with conflict detection
- Attendance tracking
- Feedback collection
- Invoice generation
- Reports and analytics

### User Roles
1. **Super Admin** (Training Company)
2. **Client Admin** (College)
3. **Faculty/Trainer**
4. **Students**

---

## Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Super    │  │ College  │  │ Faculty  │  │ Student  │   │
│  │ Admin    │  │ Admin    │  │ Portal   │  │ Portal   │   │
│  │ Portal   │  │ Portal   │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │   Services   │  │  Middleware  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Calendar   │  │  Scheduler   │  │  Conflict    │      │
│  │   Engine     │  │   Engine     │  │  Detection   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Invoice    │  │ Notification │  │   Reports    │      │
│  │   Generator  │  │   Service    │  │   Engine     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (MySQL)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Projects │  │ Sessions │  │ Faculty  │  │ Invoices │  │
│  │ Tables   │  │ Tables   │  │ Tables   │  │ Tables   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Email   │  │   SMS    │  │ WhatsApp │                 │
│  │ Service  │  │ Service  │  │  Service │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Design (ERD)

### Core Tables

#### 1. Projects Table
```sql
CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    college_id VARCHAR(36) NOT NULL,
    project_type ENUM('company_specific', 'crt', 'custom') NOT NULL,
    total_hours_required INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    trainers_required INT DEFAULT 1,
    admins_required INT DEFAULT 0,
    mode ENUM('online', 'offline', 'hybrid') NOT NULL,
    preferred_timings JSON, -- {start: "09:00", end: "17:00"}
    project_manager_id VARCHAR(36),
    spoc_id VARCHAR(36),
    description TEXT,
    status ENUM('draft', 'faculty_allocation', 'scheduling', 'admin_allocation', 'live', 'completed', 'cancelled') DEFAULT 'draft',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (project_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (spoc_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_college_id (college_id),
    INDEX idx_status (status),
    INDEX idx_project_type (project_type),
    INDEX idx_dates (start_date, end_date)
);
```

#### 2. Project Departments (Many-to-Many)
```sql
CREATE TABLE project_departments (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_dept (project_id, department_id),
    INDEX idx_project_id (project_id),
    INDEX idx_department_id (department_id)
);
```

#### 3. Project Batches (Many-to-Many)
```sql
CREATE TABLE project_batches (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    batch_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_batch (project_id, batch_id),
    INDEX idx_project_id (project_id),
    INDEX idx_batch_id (batch_id)
);
```

#### 4. Faculty Allocation
```sql
CREATE TABLE faculty_allocations (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    faculty_id VARCHAR(36) NOT NULL,
    allocated_hours INT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    employment_type ENUM('full_time', 'freelancer') NOT NULL,
    allocation_status ENUM('pending', 'confirmed', 'replaced', 'completed') DEFAULT 'pending',
    allocated_by VARCHAR(36) NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    replaced_at TIMESTAMP NULL,
    replacement_reason TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_allocation_status (allocation_status)
);
```

#### 5. Faculty Replacement Log
```sql
CREATE TABLE faculty_replacement_logs (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    old_faculty_id VARCHAR(36) NOT NULL,
    new_faculty_id VARCHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    replaced_by VARCHAR(36) NOT NULL,
    replaced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (old_faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (new_faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (replaced_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_old_faculty_id (old_faculty_id),
    INDEX idx_new_faculty_id (new_faculty_id)
);
```

#### 6. Faculty Skills & Profile
```sql
CREATE TABLE faculty_skills (
    id VARCHAR(36) PRIMARY KEY,
    faculty_id VARCHAR(36) NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    years_of_experience INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_skill_name (skill_name)
);

CREATE TABLE faculty_profiles (
    id VARCHAR(36) PRIMARY KEY,
    faculty_id VARCHAR(36) NOT NULL UNIQUE,
    rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
    total_ratings INT DEFAULT 0,
    current_workload_hours INT DEFAULT 0,
    max_available_hours INT DEFAULT 160, -- per month
    location VARCHAR(255),
    distance_preference INT DEFAULT 50, -- km
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_rating (rating),
    INDEX idx_is_available (is_available)
);
```

#### 7. Sessions/Classes
```sql
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    batch_id VARCHAR(36) NOT NULL,
    faculty_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    topic TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    mode ENUM('online', 'offline', 'hybrid') NOT NULL,
    room_id VARCHAR(36),
    meeting_link VARCHAR(500), -- For online/hybrid
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSON, -- {type: 'daily/weekly/monthly', interval: 1, endDate: '...'}
    parent_session_id VARCHAR(36), -- For recurring sessions
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_batch_id (batch_id),
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_status (status),
    INDEX idx_dates (start_time, end_time)
);
```

#### 8. Rooms
```sql
CREATE TABLE rooms (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    building VARCHAR(255),
    floor INT,
    capacity INT NOT NULL,
    room_type ENUM('lecture', 'lab', 'auditorium', 'seminar') DEFAULT 'lecture',
    amenities JSON, -- ["Projector", "Whiteboard", "Computers"]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_code (college_id, code),
    INDEX idx_college_id (college_id),
    INDEX idx_is_active (is_active)
);
```

#### 9. College Holidays
```sql
CREATE TABLE college_holidays (
    id VARCHAR(36) PRIMARY KEY,
    college_id VARCHAR(36) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(255) NOT NULL,
    holiday_type ENUM('holiday', 'exam', 'event') DEFAULT 'holiday',
    description TEXT,
    is_recurring_yearly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_college_holiday (college_id, holiday_date),
    INDEX idx_college_id (college_id),
    INDEX idx_holiday_date (holiday_date)
);
```

#### 10. Attendance
```sql
CREATE TABLE attendance (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    marked_by VARCHAR(36) NOT NULL, -- Faculty who marked
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_student (session_id, student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_marked_at (marked_at)
);
```

#### 11. Topics Covered
```sql
CREATE TABLE topics_covered (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    topic_name VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    description TEXT,
    attachments JSON, -- [{name: "...", url: "...", type: "pdf/ppt"}]
    covered_by VARCHAR(36) NOT NULL, -- Faculty
    covered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (covered_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_covered_by (covered_by),
    INDEX idx_covered_at (covered_at)
);
```

#### 12. Feedback
```sql
CREATE TABLE feedback (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36),
    session_id VARCHAR(36),
    feedback_type ENUM('student_to_faculty', 'faculty_to_batch', 'college_to_company', 'end_of_course') NOT NULL,
    from_user_id VARCHAR(36) NOT NULL,
    to_user_id VARCHAR(36), -- Faculty being rated
    to_batch_id VARCHAR(36), -- Batch being rated
    rating_overall DECIMAL(3,2), -- 1.00 to 5.00
    rating_professionalism DECIMAL(3,2),
    rating_content_relevance DECIMAL(3,2),
    rating_communication DECIMAL(3,2),
    textual_feedback TEXT,
    suggestions TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    INDEX idx_project_id (project_id),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_from_user_id (from_user_id),
    INDEX idx_to_user_id (to_user_id),
    INDEX idx_submitted_at (submitted_at)
);
```

#### 13. Admin Allocations
```sql
CREATE TABLE admin_allocations (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    admin_id VARCHAR(36) NOT NULL,
    admin_role ENUM('attendance_admin', 'logistics_admin', 'reporting_admin') NOT NULL,
    allocated_by VARCHAR(36) NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_admin_role (project_id, admin_id, admin_role),
    INDEX idx_project_id (project_id),
    INDEX idx_admin_id (admin_id)
);
```

#### 14. Invoices
```sql
CREATE TABLE invoices (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    faculty_id VARCHAR(36) NOT NULL,
    college_id VARCHAR(36) NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    total_hours INT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tds_percentage DECIMAL(5,2) DEFAULT 0.00,
    tds_amount DECIMAL(10,2) DEFAULT 0.00,
    net_payable DECIMAL(10,2) NOT NULL,
    employment_type ENUM('full_time', 'freelancer') NOT NULL,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    pdf_url VARCHAR(500),
    qr_code_url VARCHAR(500),
    bank_details JSON, -- {account_number, ifsc, bank_name, branch}
    notes TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_college_id (college_id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_billing_period (billing_period_start, billing_period_end),
    INDEX idx_status (status)
);
```

#### 15. Invoice Items
```sql
CREATE TABLE invoice_items (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36),
    hours INT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    session_date DATE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_project_id (project_id)
);
```

#### 16. Notifications
```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('email', 'sms', 'whatsapp', 'in_app') NOT NULL,
    category ENUM('trainer_assigned', 'trainer_replaced', 'attendance_pending', 'schedule_updated', 'invoice_generated', 'feedback_request', 'session_reminder', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50), -- 'project', 'session', 'invoice', etc.
    related_entity_id VARCHAR(36),
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_is_read (is_read),
    INDEX idx_sent_at (sent_at)
);
```

#### 17. Calendar Events (Denormalized for Performance)
```sql
CREATE TABLE calendar_events (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    batch_id VARCHAR(36) NOT NULL,
    faculty_id VARCHAR(36) NOT NULL,
    college_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    color_code VARCHAR(7), -- Hex color
    event_type ENUM('session', 'holiday', 'exam', 'event') DEFAULT 'session',
    is_conflict BOOLEAN DEFAULT FALSE,
    conflict_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_batch_id (batch_id),
    INDEX idx_college_id (college_id),
    INDEX idx_project_id (project_id),
    INDEX idx_dates (start_time, end_time)
);
```

---

## Module Specifications

### 1. Calendar & Scheduling Engine

#### Features
- **Views**: Day, Week, Month, Year
- **Drag & Drop**: Reschedule sessions
- **Conflict Detection**:
  - Faculty time overlap
  - Batch time overlap
  - Room double-booking
  - College holiday/exam conflicts
- **Filters**: Trainer, College, Project, Batch
- **Color Coding**: By project type, status, or priority
- **Tooltips**: Show session details on hover
- **Integration**: Google Calendar, Outlook Calendar (iCal export)

#### Conflict Detection Algorithm
```javascript
async function detectConflicts(session) {
    const conflicts = [];
    
    // 1. Faculty conflict
    const facultyConflicts = await checkFacultyAvailability(
        session.faculty_id, 
        session.start_time, 
        session.end_time,
        session.id // exclude current session
    );
    
    // 2. Batch conflict
    const batchConflicts = await checkBatchAvailability(
        session.batch_id,
        session.start_time,
        session.end_time,
        session.id
    );
    
    // 3. Room conflict
    if (session.room_id) {
        const roomConflicts = await checkRoomAvailability(
            session.room_id,
            session.start_time,
            session.end_time,
            session.id
        );
    }
    
    // 4. College holiday conflict
    const holidayConflicts = await checkCollegeHolidays(
        session.college_id,
        session.start_time
    );
    
    return conflicts;
}
```

#### RBAC Visibility
- **Super Admin**: All events across all colleges
- **College Admin**: Only their college's events
- **Faculty**: Only their assigned sessions
- **Students**: Only their batch sessions

---

### 2. Project Creation Module

#### Fields
- Project Name (required)
- Select College (required, dynamic dropdown)
- Project Type: Company Specific / CRT / Custom (required)
- Total Hours Required (required, > 0)
- Select Departments (multi-select, must belong to college)
- Select Batches (multi-select, based on selected college)
- Start Date (required)
- End Date (required, must be > Start Date)
- Trainers Required (default: 1)
- Admins Required (default: 0)
- Mode: Online/Offline/Hybrid (required)
- Preferred Timings: Start Time, End Time
- Project Manager / SPOC (optional, user selection)
- Description (optional)

#### Validation Rules
1. End Date > Start Date
2. Total Hours must fit within timeline (consider working days)
3. Departments must belong to selected college
4. Batches must belong to selected college
5. Project must not overlap with existing commitments (optional validation)

#### Workflow States
```
Draft → Faculty Allocation → Scheduling → Admin Allocation → Live → Completed
```

#### State Transitions
- **Draft**: Initial state, can edit all fields
- **Faculty Allocation**: Assign trainers, cannot change core details
- **Scheduling**: Create sessions, cannot change dates/hours
- **Admin Allocation**: Assign admins
- **Live**: Project is active, sessions ongoing
- **Completed**: All sessions completed, final reports generated

---

### 3. Faculty Allocation Module

#### Trainer Selection Criteria
1. **Availability**: Check calendar for free slots
2. **Skills**: Match project requirements
3. **Workload**: Current hours < max available hours
4. **Distance/Location**: For offline mode, check proximity
5. **Rating & Experience**: Higher rated trainers preferred

#### Faculty Profile Display
- Skills/Subjects (tags)
- Past performance rating (average)
- Current workload (hours/month)
- Upcoming sessions (next 7 days)
- Remaining hours availability
- Employment type (Full-time/Freelancer)
- Hourly rate

#### Smart Recommendation Engine
```javascript
async function recommendTrainers(project) {
    const candidates = await getAvailableTrainers({
        skills: project.required_skills,
        availability: project.preferred_timings,
        location: project.college.location,
        mode: project.mode
    });
    
    // Score each candidate
    return candidates.map(trainer => ({
        ...trainer,
        score: calculateScore(trainer, project)
    })).sort((a, b) => b.score - a.score);
}

function calculateScore(trainer, project) {
    let score = 0;
    
    // Skill match (40%)
    score += (trainer.skillMatch / project.requiredSkills.length) * 40;
    
    // Rating (30%)
    score += (trainer.rating / 5) * 30;
    
    // Availability (20%)
    score += (trainer.availableHours / project.totalHours) * 20;
    
    // Workload (10%) - less workload = higher score
    score += (1 - trainer.currentWorkload / trainer.maxWorkload) * 10;
    
    return score;
}
```

---

### 4. Faculty Replacement Module

#### Workflow
1. Select project → View Faculty Allocation
2. Click "Replace Trainer" on specific allocation
3. System detects:
   - Future classes of existing trainer
   - Remaining hours to be covered
4. Show available replacement trainers (filtered by availability)
5. Select new trainer
6. System auto-updates:
   - All future sessions (reassign faculty_id)
   - Calendar events
   - Notifications sent
7. Audit log entry created

#### Audit Log Fields
- Old trainer ID
- New trainer ID
- Reason (required)
- Replaced by (admin user)
- Timestamp
- Project ID

---

### 5. Class Scheduling Module

#### Auto-Generation Algorithm
```javascript
async function autoGenerateSchedule(project) {
    const schedule = [];
    const {
        totalHours,
        startDate,
        endDate,
        preferredTimings,
        batches,
        faculty
    } = project;
    
    // Calculate working days (exclude holidays)
    const workingDays = getWorkingDays(startDate, endDate, project.college_id);
    
    // Calculate sessions needed
    const sessionDuration = 2; // hours per session
    const sessionsNeeded = Math.ceil(totalHours / sessionDuration);
    const sessionsPerWeek = Math.ceil(sessionsNeeded / (workingDays.length / 7));
    
    // Generate sessions
    for (const batch of batches) {
        let sessionCount = 0;
        for (const day of workingDays) {
            if (sessionCount >= sessionsNeeded) break;
            
            // Check faculty availability
            const availableSlots = await getFacultyAvailableSlots(
                faculty.id,
                day,
                preferredTimings
            );
            
            for (const slot of availableSlots) {
                if (sessionCount >= sessionsNeeded) break;
                
                // Check room availability (if offline)
                let roomId = null;
                if (project.mode === 'offline' || project.mode === 'hybrid') {
                    roomId = await findAvailableRoom(
                        project.college_id,
                        slot.start,
                        slot.end,
                        batch.size
                    );
                }
                
                // Create session
                const session = await createSession({
                    project_id: project.id,
                    batch_id: batch.id,
                    faculty_id: faculty.id,
                    start_time: slot.start,
                    end_time: slot.end,
                    room_id: roomId,
                    mode: project.mode
                });
                
                schedule.push(session);
                sessionCount++;
            }
        }
    }
    
    return schedule;
}
```

#### Manual Edit
- Drag & drop to reschedule
- Edit individual session details
- Bulk edit multiple sessions
- Delete sessions (with confirmation)

#### Recurring Sessions
- Daily, Weekly, Monthly patterns
- Set end date or number of occurrences
- Exclude specific dates

#### Excel Export Format
| Date | Day | College | Department | Batch | Trainer | Start Time | End Time | Duration | Topic | Mode | Room | Remarks |
|------|-----|---------|------------|-------|---------|------------|----------|----------|-------|------|------|---------|

---

### 6. Attendance Module

#### Attendance Flow
1. Faculty opens session details
2. System shows all students in the batch
3. Faculty marks attendance:
   - Present (default)
   - Absent
   - Late (with late time)
4. Auto-capture:
   - Session metadata
   - Marking timestamp
   - Faculty ID

#### Bulk Upload
- Excel template with columns: Student ID, Status, Remarks
- Validation: Student must belong to batch
- Import preview before confirmation

#### Reports
- **Batch-wise**: Summary by batch
- **Student-wise**: Individual attendance percentage
- **Monthly**: Attendance report for month
- **Project-wise**: Overall attendance for project

---

### 7. Feedback Module

#### Feedback Types
1. **Student → Faculty**: After each session or end of course
2. **Faculty → Batch**: Overall batch performance
3. **College → Training Company**: End of project
4. **End-of-Course**: Comprehensive feedback form

#### Questions Structure
- Rating-based (1-5 scale):
  - Overall rating
  - Professionalism
  - Content relevance
  - Communication
- Textual feedback:
  - What went well?
  - What could be improved?
  - Suggestions
- Optional fields:
  - Anonymous submission

#### Analytics Dashboard
- Faculty rating trends
- Student satisfaction scores
- Batch feedback summary
- College feedback summary
- Comparison charts

---

### 8. Topics Covered Module

#### Fields
- Date (auto-filled from session)
- Session ID (auto-linked)
- Topics Covered (multi-select or text input)
- Duration (minutes)
- Remarks (optional)
- Attachments (PDFs, PPTs, images)

#### Reports
- Topics coverage vs syllabus (progress tracking)
- Topics by session
- Topics by project
- Missing topics alert

---

### 9. Admin Allocation Module

#### Admin Roles
1. **Attendance Admin**: Mark attendance, generate reports
2. **Logistics Admin**: Manage rooms, equipment, materials
3. **Reporting Admin**: Generate and distribute reports

#### Selection Criteria
- Availability
- Current workload
- Skills/Experience
- Location (for offline)

---

### 10. Automated Monthly Invoice Generation

#### Billing Logic
- **Period**: 1st to 25th of each month
- **Calculation**: Hours × Trainer Rate
- **TDS**: 
  - Freelancer: 10% TDS
  - Full-time: No TDS
- **Generation Date**: 25th of every month (automated cron job)

#### Invoice Format
```
┌─────────────────────────────────────────┐
│  [Company Logo]                         │
│                                         │
│  INVOICE #INV-2024-001                  │
│  Date: 25/01/2024                       │
│                                         │
│  Trainer Details:                       │
│  Name: John Doe                         │
│  Email: john@example.com                │
│  Employee Type: Freelancer              │
│                                         │
│  College: ABC College                   │
│                                         │
│  Billing Period: 01/01/2024 - 25/01/2024│
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Project    | Hours | Rate | Amount│ │
│  ├───────────────────────────────────┤ │
│  │ Project A  |  40   | 1000 | 40000 │ │
│  │ Project B  |  20   | 1000 | 20000 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Subtotal: 60,000                       │
│  TDS (10%): 6,000                      │
│  Net Payable: 54,000                    │
│                                         │
│  Bank Details:                          │
│  Account: 1234567890                   │
│  IFSC: ABCD0123456                     │
│  Bank: ABC Bank                        │
│                                         │
│  [QR Code for Payment]                 │
└─────────────────────────────────────────┘
```

#### Automation
- Cron job runs on 25th at 00:00
- Generates PDF invoices
- Stores in database
- Sends emails to:
  - Trainer
  - Finance team
  - Super Admin

---

### 11. Notifications Module

#### Notification Types
- **Email**: HTML templates
- **SMS**: Text messages (via SMS gateway)
- **WhatsApp**: Messages (via WhatsApp Business API)
- **In-App**: Real-time notifications

#### Triggers
1. Trainer assigned → Email + In-App
2. Trainer replaced → Email + SMS + In-App
3. Attendance pending → In-App reminder (1 hour before)
4. Schedule updated → Email + In-App
5. Invoice generated → Email + WhatsApp
6. New feedback request → Email + In-App

#### Templates
```javascript
const notificationTemplates = {
    trainer_assigned: {
        email: {
            subject: 'You have been assigned to a new project',
            body: 'Dear {{trainer_name}}, you have been assigned to {{project_name}}...'
        },
        sms: 'You have been assigned to project {{project_name}}. Check your dashboard for details.',
        whatsapp: '🎓 New Assignment!\n\nYou have been assigned to {{project_name}}...'
    },
    // ... more templates
};
```

---

### 12. Reports & Analytics

#### Reports Available
1. **Project Progress**: Completion %, hours delivered, sessions completed
2. **Trainer Utilization**: Hours worked, projects assigned, availability
3. **College-wise Attendance**: Attendance % by college, batch, student
4. **Student Progress**: Attendance, feedback given, performance
5. **Feedback Analytics**: Ratings, trends, comparisons
6. **Invoice Summary**: Total invoices, amounts, payment status

#### Export Formats
- Excel (.xlsx)
- CSV
- PDF

#### Role-Based Visibility
- **Super Admin**: All reports
- **College**: Only their data
- **Faculty**: Only their sessions
- **Students**: Only their performance

---

## API Specifications

### Base URL
```
/api/v1/project-management
```

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Projects
```
POST   /projects                    - Create project
GET    /projects                    - List projects (with filters)
GET    /projects/:id                - Get project details
PUT    /projects/:id                - Update project
DELETE /projects/:id                - Delete project
PATCH  /projects/:id/status         - Update project status
GET    /projects/:id/departments    - Get project departments
POST   /projects/:id/departments    - Add departments to project
GET    /projects/:id/batches         - Get project batches
POST   /projects/:id/batches        - Add batches to project
```

#### Faculty Allocation
```
POST   /projects/:id/faculty        - Allocate faculty to project
GET    /projects/:id/faculty        - Get allocated faculty
PUT    /faculty-allocations/:id     - Update allocation
DELETE /faculty-allocations/:id     - Remove allocation
POST   /faculty-allocations/:id/replace - Replace faculty
GET    /faculty/recommendations     - Get recommended trainers
GET    /faculty/:id/profile         - Get faculty profile
PUT    /faculty/:id/profile         - Update faculty profile
GET    /faculty/:id/availability    - Check faculty availability
```

#### Sessions
```
POST   /sessions                    - Create session
GET    /sessions                    - List sessions (with filters)
GET    /sessions/:id                - Get session details
PUT    /sessions/:id                - Update session
DELETE /sessions/:id                - Delete session
POST   /sessions/bulk               - Create multiple sessions
POST   /sessions/:id/reschedule     - Reschedule session
GET    /sessions/conflicts          - Check for conflicts
POST   /sessions/auto-generate      - Auto-generate schedule
GET    /sessions/export             - Export to Excel
```

#### Calendar
```
GET    /calendar                    - Get calendar events
GET    /calendar/day/:date          - Get day view
GET    /calendar/week/:date         - Get week view
GET    /calendar/month/:date        - Get month view
GET    /calendar/year/:year         - Get year view
GET    /calendar/conflicts           - Get conflicts
POST   /calendar/events             - Create calendar event
PUT    /calendar/events/:id         - Update event
DELETE /calendar/events/:id         - Delete event
GET    /calendar/export/ical        - Export to iCal
```

#### Attendance
```
POST   /attendance                  - Mark attendance
GET    /attendance/session/:id      - Get attendance for session
PUT    /attendance/:id              - Update attendance
POST   /attendance/bulk-upload      - Bulk upload attendance
GET    /attendance/reports          - Get attendance reports
GET    /attendance/student/:id      - Get student attendance
GET    /attendance/batch/:id        - Get batch attendance
```

#### Feedback
```
POST   /feedback                    - Submit feedback
GET    /feedback                    - List feedback (with filters)
GET    /feedback/:id                - Get feedback details
GET    /feedback/analytics          - Get feedback analytics
GET    /feedback/faculty/:id        - Get feedback for faculty
GET    /feedback/project/:id        - Get feedback for project
```

#### Topics Covered
```
POST   /topics-covered              - Add topics covered
GET    /topics-covered/session/:id  - Get topics for session
PUT    /topics-covered/:id          - Update topics
DELETE /topics-covered/:id          - Delete topics
GET    /topics-covered/project/:id  - Get topics for project
GET    /topics-covered/reports      - Get coverage reports
```

#### Invoices
```
GET    /invoices                    - List invoices
GET    /invoices/:id                - Get invoice details
GET    /invoices/:id/pdf            - Download invoice PDF
POST   /invoices/generate           - Manually generate invoice
GET    /invoices/faculty/:id        - Get invoices for faculty
GET    /invoices/reports             - Get invoice reports
```

#### Notifications
```
GET    /notifications               - Get notifications
GET    /notifications/unread         - Get unread notifications
PUT    /notifications/:id/read      - Mark as read
PUT    /notifications/read-all      - Mark all as read
POST   /notifications/send          - Send notification
```

#### Reports
```
GET    /reports/project-progress     - Project progress report
GET    /reports/trainer-utilization  - Trainer utilization report
GET    /reports/attendance           - Attendance report
GET    /reports/feedback             - Feedback report
GET    /reports/invoice-summary      - Invoice summary report
GET    /reports/export               - Export report
```

---

## UI/UX Design

### Navigation Structure

#### Super Admin Panel
```
Dashboard
├── Projects
│   ├── All Projects
│   ├── Create Project
│   └── Project Analytics
├── Calendar
│   ├── Day View
│   ├── Week View
│   ├── Month View
│   └── Year View
├── Faculty
│   ├── All Faculty
│   ├── Faculty Allocation
│   ├── Faculty Profiles
│   └── Faculty Replacement
├── Scheduling
│   ├── Auto-Generate
│   ├── Manual Schedule
│   └── Conflict Resolution
├── Attendance
│   ├── Mark Attendance
│   ├── Attendance Reports
│   └── Bulk Upload
├── Feedback
│   ├── View Feedback
│   └── Feedback Analytics
├── Invoices
│   ├── All Invoices
│   ├── Generate Invoice
│   └── Invoice Reports
├── Reports
│   ├── Project Reports
│   ├── Trainer Reports
│   └── Attendance Reports
└── Settings
    ├── Colleges
    ├── Rooms
    └── Holidays
```

#### College Admin Panel
```
Dashboard
├── My Projects
│   ├── View Projects
│   └── Request Changes
├── Calendar
│   └── My College Calendar
├── Faculty
│   └── Assigned Faculty
├── Attendance
│   └── Attendance Reports
├── Feedback
│   └── View Feedback
└── Reports
    └── College Reports
```

#### Faculty Portal
```
Dashboard
├── My Schedule
│   ├── Calendar View
│   └── List View
├── My Projects
│   └── Project Details
├── Attendance
│   └── Mark Attendance
├── Topics Covered
│   └── Update Topics
├── Feedback
│   └── View My Feedback
└── Invoices
    └── My Invoices
```

#### Student Portal
```
Dashboard
├── My Schedule
│   └── Batch Schedule
├── Attendance
│   └── My Attendance
├── Topics Covered
│   └── Course Topics
└── Feedback
    └── Give Feedback
```

### Component List

#### Common Components
- `CalendarView` - Calendar component with day/week/month/year views
- `ProjectCard` - Project information card
- `SessionCard` - Session information card
- `FacultyCard` - Faculty profile card
- `AttendanceTable` - Attendance marking table
- `FeedbackForm` - Feedback submission form
- `InvoiceView` - Invoice display component
- `ReportChart` - Chart component for reports
- `FilterPanel` - Filter sidebar
- `ConflictAlert` - Conflict warning component

---

## Workflows & Sequence Diagrams

### Project Creation Workflow
```
User → Create Project Form
  → Validate Input
  → Check Conflicts
  → Create Project (Status: Draft)
  → Add Departments
  → Add Batches
  → Update Status: Faculty Allocation
  → Notify Super Admin
```

### Faculty Assignment Workflow
```
Admin → Select Project
  → View Recommended Trainers
  → Select Trainer
  → Check Availability
  → Allocate Faculty
  → Update Project Status: Scheduling
  → Notify Faculty
  → Notify College Admin
```

### Scheduling Workflow
```
Admin → Select Project
  → Choose: Auto-Generate or Manual
  → If Auto:
    → Calculate Sessions Needed
    → Check Faculty Availability
    → Check Room Availability
    → Check Holidays
    → Generate Sessions
  → If Manual:
    → Create Session Form
    → Check Conflicts
    → Create Session
  → Update Calendar
  → Notify Faculty & Students
```

### Attendance Flow
```
Faculty → Open Session
  → View Student List
  → Mark Attendance (Present/Absent/Late)
  → Save Attendance
  → Update Attendance Statistics
  → Notify Students (if absent)
```

### Invoice Generation Workflow (Automated)
```
Cron Job (25th of Month)
  → Get All Active Projects
  → For Each Faculty:
    → Calculate Hours (1st-25th)
    → Get Hourly Rate
    → Calculate TDS (if freelancer)
    → Generate Invoice
    → Create PDF
    → Store in Database
    → Send Email to Faculty
    → Send Email to Finance
    → Send Email to Super Admin
```

---

## Role-Based Access Control (RBAC)

### Permission Matrix

| Module | Super Admin | College Admin | Faculty | Student |
|--------|-------------|---------------|---------|---------|
| **Projects** |
| Create Project | ✅ | ❌ | ❌ | ❌ |
| View All Projects | ✅ | ❌ | ❌ | ❌ |
| View Own Projects | ✅ | ✅ | ❌ | ❌ |
| Edit Project | ✅ | ❌ | ❌ | ❌ |
| Delete Project | ✅ | ❌ | ❌ | ❌ |
| **Calendar** |
| View All Calendar | ✅ | ❌ | ❌ | ❌ |
| View College Calendar | ✅ | ✅ | ❌ | ❌ |
| View Own Schedule | ✅ | ✅ | ✅ | ✅ |
| Edit Calendar | ✅ | ❌ | ❌ | ❌ |
| **Faculty Allocation** |
| Allocate Faculty | ✅ | ❌ | ❌ | ❌ |
| View Allocations | ✅ | ✅ | ✅ | ❌ |
| Replace Faculty | ✅ | ❌ | ❌ | ❌ |
| **Sessions** |
| Create Sessions | ✅ | ❌ | ❌ | ❌ |
| View All Sessions | ✅ | ❌ | ❌ | ❌ |
| View Own Sessions | ✅ | ✅ | ✅ | ✅ |
| Edit Sessions | ✅ | ❌ | ❌ | ❌ |
| **Attendance** |
| Mark Attendance | ✅ | ❌ | ✅ | ❌ |
| View All Attendance | ✅ | ✅ | ✅ | ❌ |
| View Own Attendance | ✅ | ✅ | ✅ | ✅ |
| **Feedback** |
| View All Feedback | ✅ | ✅ | ❌ | ❌ |
| View Own Feedback | ✅ | ✅ | ✅ | ❌ |
| Submit Feedback | ✅ | ✅ | ✅ | ✅ |
| **Invoices** |
| View All Invoices | ✅ | ❌ | ❌ | ❌ |
| View Own Invoices | ✅ | ❌ | ✅ | ❌ |
| Generate Invoices | ✅ | ❌ | ❌ | ❌ |
| **Reports** |
| View All Reports | ✅ | ❌ | ❌ | ❌ |
| View College Reports | ✅ | ✅ | ❌ | ❌ |
| View Own Reports | ✅ | ✅ | ✅ | ✅ |

---

## Tech Stack

### Frontend
- **Framework**: React 18+
- **State Management**: React Context API / Redux
- **UI Library**: Tailwind CSS + Headless UI
- **Calendar**: FullCalendar / React Big Calendar
- **Charts**: Chart.js / Recharts
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Date Handling**: date-fns / Day.js

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **ORM**: mysql2 (raw queries) or Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **PDF Generation**: PDFKit
- **Excel**: ExcelJS
- **Email**: Nodemailer
- **SMS**: Twilio / AWS SNS
- **WhatsApp**: Twilio WhatsApp API
- **Scheduling**: node-cron

### Infrastructure
- **Caching**: Redis (optional)
- **Message Queue**: Bull / BullMQ (for background jobs)
- **File Storage**: AWS S3 / Local storage
- **Containerization**: Docker
- **Orchestration**: Kubernetes (optional)
- **Monitoring**: Winston (logging)

### Security
- **HTTPS**: Required
- **CORS**: Configured for frontend domain
- **Rate Limiting**: express-rate-limit
- **Input Validation**: express-validator
- **SQL Injection**: Parameterized queries
- **XSS**: Sanitize user input

---

## Implementation Plan

### Phase 1: Database & Core Infrastructure (Week 1-2)
1. Create all database tables
2. Set up migration system
3. Create base controllers and routes
4. Implement authentication middleware
5. Set up RBAC system

### Phase 2: Project Management Core (Week 3-4)
1. Project CRUD operations
2. Project workflow states
3. Project-department-batch relationships
4. Basic validation

### Phase 3: Faculty Management (Week 5-6)
1. Faculty profiles and skills
2. Faculty allocation
3. Recommendation engine
4. Faculty replacement with audit logging

### Phase 4: Scheduling Engine (Week 7-8)
1. Calendar views (day/week/month/year)
2. Session CRUD
3. Conflict detection algorithm
4. Auto-generation algorithm
5. Drag & drop functionality

### Phase 5: Attendance & Topics (Week 9)
1. Attendance marking
2. Bulk upload
3. Topics covered module
4. Reports

### Phase 6: Feedback System (Week 10)
1. Feedback forms
2. Feedback submission
3. Analytics dashboard

### Phase 7: Invoice System (Week 11)
1. Invoice generation logic
2. PDF generation
3. Automated cron job
4. Email notifications

### Phase 8: Notifications (Week 12)
1. Email templates
2. SMS integration
3. WhatsApp integration
4. In-app notifications

### Phase 9: Reports & Analytics (Week 13)
1. All report types
2. Export functionality
3. Dashboard charts

### Phase 10: Testing & Optimization (Week 14)
1. Unit tests
2. Integration tests
3. Performance optimization
4. Security audit

---

## Conclusion

This document provides a complete blueprint for the Project Management System. All modules, workflows, APIs, and UI components are specified. The system is designed to be scalable, secure, and user-friendly for all four user roles.

**Next Steps**:
1. Review and approve design
2. Set up development environment
3. Begin Phase 1 implementation
4. Regular progress reviews

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-27  
**Status**: Design Complete - Ready for Implementation

