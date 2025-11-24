import { pool } from '../config/database.js';

// Attendance Management Controllers

// Get attendance sessions
export const getAttendanceSessions = async (req, res) => {
  try {
    const { classId, courseId, instructorId, date, status } = req.query;
    
    let query = `
      SELECT 
        as.id,
        as.class_id,
        c.class_name,
        c.class_code,
        as.course_id,
        co.title as course_name,
        co.code as course_code,
        as.instructor_id,
        u.name as instructor_name,
        as.session_date,
        as.start_time,
        as.end_time,
        as.room_id,
        r.name as room_name,
        as.attendance_method,
        as.status,
        as.total_students,
        as.present_count,
        as.absent_count,
        as.late_count,
        as.created_at
      FROM attendance_sessions as
      LEFT JOIN classes c ON as.class_id = c.id
      LEFT JOIN courses co ON as.course_id = co.id
      LEFT JOIN users u ON as.instructor_id = u.id
      LEFT JOIN rooms r ON as.room_id = r.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (classId) {
      query += ' AND as.class_id = ?';
      params.push(classId);
    }
    
    if (courseId) {
      query += ' AND as.course_id = ?';
      params.push(courseId);
    }
    
    if (instructorId) {
      query += ' AND as.instructor_id = ?';
      params.push(instructorId);
    }
    
    if (date) {
      query += ' AND as.session_date = ?';
      params.push(date);
    }
    
    if (status) {
      query += ' AND as.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY as.session_date DESC, as.start_time DESC';
    
    const [sessions] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: sessions
    });
    
  } catch (error) {
    console.error('Error getting attendance sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance sessions'
    });
  }
};

// Create attendance session
export const createAttendanceSession = async (req, res) => {
  try {
    const {
      classId,
      courseId,
      instructorId,
      sessionDate,
      startTime,
      endTime,
      roomId,
      attendanceMethod = 'manual'
    } = req.body;
    
    // MEDIUM FIX: Use configurable QR code expiry from appConfig
    const appConfig = (await import('../config/appConfig.js')).default;
    const qrCodeExpiryMinutes = appConfig.attendance.qrCodeExpiryMinutes;
    const qrCodeExpiry = new Date();
    qrCodeExpiry.setMinutes(qrCodeExpiry.getMinutes() + qrCodeExpiryMinutes);
    
    // Generate unique QR code token
    const { v4: uuidv4 } = await import('uuid');
    const qrCodeToken = uuidv4();
    
    const [result] = await pool.execute(`
      INSERT INTO attendance_sessions (
        id, class_id, course_id, instructor_id, session_date, start_time, end_time, 
        room_id, attendance_method, status, qr_code, qr_expires_at, created_at
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, NOW())
    `, [classId, courseId, instructorId, sessionDate, startTime, endTime, roomId, attendanceMethod, qrCodeToken, qrCodeExpiry]);
    
    res.json({
      success: true,
      data: {
        id: result.insertId,
        qrCode: qrCodeToken,
        qrExpiresAt: qrCodeExpiry,
        message: 'Attendance session created successfully'
      }
    });
    
  } catch (error) {
    console.error('Error creating attendance session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create attendance session'
    });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { sessionId, studentId, status, notes, method = 'manual', qrCodeToken, gpsLocation } = req.body;
    const markedBy = req.user.id;
    
    // MEDIUM FIX: Validate GPS location if provided (for GPS-based attendance)
    if (method === 'gps' && gpsLocation) {
      const appConfig = (await import('../config/appConfig.js')).default;
      const { latitude, longitude, accuracy } = gpsLocation;
      
      // Validate GPS coordinates
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
          latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Invalid GPS coordinates',
          code: 'ATT_GPS_INVALID'
        });
      }
      
      // MEDIUM FIX: Check GPS accuracy to detect potential spoofing
      if (accuracy && accuracy > appConfig.attendance.gpsAccuracyThreshold) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `GPS accuracy too low (${accuracy}m). Please ensure location services are enabled and accurate.`,
          code: 'ATT_GPS_LOW_ACCURACY',
          accuracy,
          threshold: appConfig.attendance.gpsAccuracyThreshold
        });
      }
      
      // MEDIUM FIX: Additional validation - check if coordinates are suspicious (0,0 or very round numbers)
      if ((latitude === 0 && longitude === 0) || 
          (Math.abs(latitude) < 0.0001 && Math.abs(longitude) < 0.0001)) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Invalid GPS location detected. Please ensure location services are properly configured.',
          code: 'ATT_GPS_SUSPICIOUS'
        });
      }
    }
    
    // CRITICAL FIX: Validate that student is enrolled in the class/course before marking attendance
    const [sessionInfo] = await connection.execute(
      `SELECT as.id, as.class_id, as.course_id, c.name as class_name, co.title as course_title
       FROM attendance_sessions as
       LEFT JOIN classes c ON as.class_id = c.id
       LEFT JOIN courses co ON as.course_id = co.id
       WHERE as.id = ?`,
      [sessionId]
    );
    
    if (sessionInfo.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }
    
    const session = sessionInfo[0];
    
    // CRITICAL FIX: Check if student is enrolled in the course
    if (session.course_id) {
      const [enrollment] = await connection.execute(
        `SELECT id FROM course_enrollments 
         WHERE course_id = ? AND student_id = ? AND status = 'active'`,
        [session.course_id, studentId]
      );
      
      if (enrollment.length === 0) {
        await connection.rollback();
        connection.release();
        const { createErrorResponse, getStatusCode } = await import('../utils/errorCodes.js');
        return res.status(getStatusCode('ATTENDANCE_NOT_ENROLLED')).json(
          createErrorResponse('ATTENDANCE_NOT_ENROLLED')
        );
      }
    }
    
    // CRITICAL FIX: Validate QR code if provided (for QR code attendance)
    if (method === 'qr' && qrCodeToken) {
      const [sessionCheck] = await connection.execute(
        `SELECT id, qr_code, qr_expires_at, status 
         FROM attendance_sessions 
         WHERE id = ? AND qr_code = ?`,
        [sessionId, qrCodeToken]
      );
      
      if (sessionCheck.length === 0 || !sessionCheck[0].qr_code) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code token'
        });
      }
      
      // MEDIUM FIX: Check QR code expiration
      const expiresAt = new Date(sessionCheck[0].qr_expires_at);
      if (expiresAt < new Date()) {
        await connection.rollback();
        connection.release();
        const { createErrorResponse, getStatusCode } = await import('../utils/errorCodes.js');
        return res.status(getStatusCode('ATTENDANCE_QR_EXPIRED')).json(
          createErrorResponse('ATTENDANCE_QR_EXPIRED')
        );
      }
      
      // MEDIUM FIX: Check if session is still active
      if (sessionCheck[0].status !== 'active' && sessionCheck[0].status !== 'scheduled') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Attendance session is not active'
        });
      }
      
      // MEDIUM FIX: Check if QR code has already been used (one-time use)
      const [qrUsage] = await connection.execute(
        `SELECT COUNT(*) as usage_count 
         FROM attendance_records 
         WHERE session_id = ? AND qr_code_used = ?`,
        [sessionId, qrCodeToken]
      );
      
      if (qrUsage[0].usage_count > 0) {
        await connection.rollback();
        connection.release();
        const { createErrorResponse, getStatusCode } = await import('../utils/errorCodes.js');
        return res.status(getStatusCode('ATTENDANCE_QR_ALREADY_USED')).json(
          createErrorResponse('ATTENDANCE_QR_ALREADY_USED')
        );
      }
    }
    
    // CRITICAL SECURITY FIX: Use SELECT FOR UPDATE to prevent race conditions
    // Lock the attendance record to prevent concurrent modifications
    const [existing] = await connection.execute(
      'SELECT id FROM attendance_records WHERE session_id = ? AND student_id = ? FOR UPDATE',
      [sessionId, studentId]
    );
    
    if (existing.length > 0) {
      // Update existing record
      await connection.execute(`
        UPDATE attendance_records 
        SET status = ?, marked_by = ?, method = ?, notes = ?, marked_at = NOW()
        WHERE session_id = ? AND student_id = ?
      `, [status, markedBy, method, notes, sessionId, studentId]);
    } else {
      // Create new record
      // MEDIUM FIX: Store QR code token if used for one-time use tracking
      const qrCodeUsed = (method === 'qr' && qrCodeToken) ? qrCodeToken : null;
      await connection.execute(`
        INSERT INTO attendance_records (
          id, session_id, student_id, status, marked_by, method, notes, qr_code_used, created_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [sessionId, studentId, status, markedBy, method, notes, qrCodeUsed]);
    }
    
    // CRITICAL SECURITY FIX: Update session counts using aggregated query to prevent race conditions
    // Use subqueries within the same transaction to ensure consistency
    await connection.execute(`
      UPDATE attendance_sessions 
      SET 
        present_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = ? AND status = 'present'),
        absent_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = ? AND status = 'absent'),
        late_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = ? AND status = 'late')
      WHERE id = ?
    `, [sessionId, sessionId, sessionId, sessionId]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Attendance marked successfully'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  } finally {
    connection.release();
  }
};

// Get attendance records for a session
export const getAttendanceRecords = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const [records] = await pool.execute(`
      SELECT 
        ar.id,
        ar.student_id,
        u.name as student_name,
        u.email as student_email,
        u.student_id as student_number,
        ar.status,
        ar.marked_at,
        ar.method,
        ar.notes,
        u2.name as marked_by_name
      FROM attendance_records ar
      LEFT JOIN users u ON ar.student_id = u.id
      LEFT JOIN users u2 ON ar.marked_by = u2.id
      WHERE ar.session_id = ?
      ORDER BY ar.marked_at DESC
    `, [sessionId]);
    
    res.json({
      success: true,
      data: records
    });
    
  } catch (error) {
    console.error('Error getting attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance records'
    });
  }
};

// Course Management Controllers

// Get courses with enhanced data
export const getCourses = async (req, res) => {
  try {
    const { collegeId, departmentId, instructorId, status = 'active' } = req.query;
    
    let query = `
      SELECT 
        c.id,
        c.title,
        c.code,
        c.description,
        c.credits,
        c.duration_weeks,
        c.max_students,
        c.is_active,
        c.is_published,
        c.thumbnail_url,
        c.created_at,
        co.name as college_name,
        d.name as department_name,
        u.name as instructor_name,
        u.email as instructor_email,
        COUNT(ce.id) as enrolled_students,
        AVG(ce.rating) as average_rating
      FROM courses c
      LEFT JOIN colleges co ON c.college_id = co.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (collegeId) {
      query += ' AND c.college_id = ?';
      params.push(collegeId);
    }
    
    if (departmentId) {
      query += ' AND c.department_id = ?';
      params.push(departmentId);
    }
    
    if (instructorId) {
      query += ' AND c.instructor_id = ?';
      params.push(instructorId);
    }
    
    if (status === 'active') {
      query += ' AND c.is_active = TRUE';
    } else if (status === 'published') {
      query += ' AND c.is_published = TRUE';
    }
    
    query += ' GROUP BY c.id ORDER BY c.created_at DESC';
    
    const [courses] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: courses
    });
    
  } catch (error) {
    console.error('Error getting courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses'
    });
  }
};

// Create course
export const createCourse = async (req, res) => {
  try {
    const {
      title,
      code,
      description,
      collegeId,
      departmentId,
      instructorId,
      credits = 3,
      durationWeeks = 16,
      maxStudents = 50
    } = req.body;
    
    const [result] = await pool.execute(`
      INSERT INTO courses (
        id, title, code, description, college_id, department_id, instructor_id,
        credits, duration_weeks, max_students, is_active, is_published, created_at
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE, NOW())
    `, [title, code, description, collegeId, departmentId, instructorId, credits, durationWeeks, maxStudents]);
    
    res.json({
      success: true,
      data: {
        id: result.insertId,
        message: 'Course created successfully'
      }
    });
    
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
};

// Class Scheduling Controllers

// Get classes
export const getClasses = async (req, res) => {
  try {
    const { courseId, instructorId, semester, status } = req.query;
    
    let query = `
      SELECT 
        cl.id,
        cl.class_name,
        cl.class_code,
        cl.semester,
        cl.academic_year,
        cl.max_students,
        cl.current_enrollment,
        cl.status,
        cl.start_date,
        cl.end_date,
        cl.created_at,
        c.title as course_name,
        c.code as course_code,
        u.name as instructor_name,
        u.email as instructor_email
      FROM classes cl
      LEFT JOIN courses c ON cl.course_id = c.id
      LEFT JOIN users u ON cl.instructor_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (courseId) {
      query += ' AND cl.course_id = ?';
      params.push(courseId);
    }
    
    if (instructorId) {
      query += ' AND cl.instructor_id = ?';
      params.push(instructorId);
    }
    
    if (semester) {
      query += ' AND cl.semester = ?';
      params.push(semester);
    }
    
    if (status) {
      query += ' AND cl.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY cl.created_at DESC';
    
    const [classes] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: classes
    });
    
  } catch (error) {
    console.error('Error getting classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get classes'
    });
  }
};

// Get class schedules
export const getClassSchedules = async (req, res) => {
  try {
    const { classId, dayOfWeek, roomId } = req.query;
    
    let query = `
      SELECT 
        cs.id,
        cs.class_id,
        cl.class_name,
        cl.class_code,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cs.room_id,
        r.name as room_name,
        r.capacity as room_capacity,
        cs.schedule_type,
        cs.is_recurring,
        cs.start_date,
        cs.end_date
      FROM class_schedules cs
      LEFT JOIN classes cl ON cs.class_id = cl.id
      LEFT JOIN rooms r ON cs.room_id = r.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (classId) {
      query += ' AND cs.class_id = ?';
      params.push(classId);
    }
    
    if (dayOfWeek) {
      query += ' AND cs.day_of_week = ?';
      params.push(dayOfWeek);
    }
    
    if (roomId) {
      query += ' AND cs.room_id = ?';
      params.push(roomId);
    }
    
    query += ' ORDER BY cs.day_of_week, cs.start_time';
    
    const [schedules] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: schedules
    });
    
  } catch (error) {
    console.error('Error getting class schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get class schedules'
    });
  }
};

// Faculty Status Management Controllers

// Get faculty status
export const getFacultyStatus = async (req, res) => {
  try {
    const { facultyId, status } = req.query;
    
    let query = `
      SELECT 
        fs.id,
        fs.faculty_id,
        u.name as faculty_name,
        u.email as faculty_email,
        u.department,
        fs.status,
        fs.last_seen,
        fs.device_type,
        fs.browser,
        fs.location_type,
        fs.building,
        fs.room,
        fs.coordinates,
        fs.updated_at
      FROM faculty_status fs
      LEFT JOIN users u ON fs.faculty_id = u.id
      WHERE u.role = 'faculty' AND u.is_active = TRUE
    `;
    
    const params = [];
    
    if (facultyId) {
      query += ' AND fs.faculty_id = ?';
      params.push(facultyId);
    }
    
    if (status) {
      query += ' AND fs.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY fs.last_seen DESC';
    
    const [facultyStatus] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: facultyStatus
    });
    
  } catch (error) {
    console.error('Error getting faculty status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faculty status'
    });
  }
};

// Update faculty status
export const updateFacultyStatus = async (req, res) => {
  try {
    const { facultyId, status, deviceType, browser, locationType, building, room, coordinates } = req.body;
    
    // Check if status exists
    const [existing] = await pool.execute(
      'SELECT id FROM faculty_status WHERE faculty_id = ?',
      [facultyId]
    );
    
    if (existing.length > 0) {
      // Update existing status
      await pool.execute(`
        UPDATE faculty_status 
        SET status = ?, device_type = ?, browser = ?, location_type = ?, 
            building = ?, room = ?, coordinates = ?, last_seen = NOW(), updated_at = NOW()
        WHERE faculty_id = ?
      `, [status, deviceType, browser, locationType, building, room, JSON.stringify(coordinates), facultyId]);
    } else {
      // Create new status
      await pool.execute(`
        INSERT INTO faculty_status (
          id, faculty_id, status, device_type, browser, location_type, 
          building, room, coordinates, last_seen, created_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [facultyId, status, deviceType, browser, locationType, building, room, JSON.stringify(coordinates)]);
    }
    
    res.json({
      success: true,
      message: 'Faculty status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating faculty status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update faculty status'
    });
  }
};

// Get faculty availability
export const getFacultyAvailability = async (req, res) => {
  try {
    const { facultyId } = req.query;
    
    let query = `
      SELECT 
        fa.id,
        fa.faculty_id,
        u.name as faculty_name,
        fa.day_of_week,
        fa.start_time,
        fa.end_time,
        fa.availability_type,
        fa.is_available,
        fa.notes
      FROM faculty_availability fa
      LEFT JOIN users u ON fa.faculty_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (facultyId) {
      query += ' AND fa.faculty_id = ?';
      params.push(facultyId);
    }
    
    query += ' ORDER BY fa.day_of_week, fa.start_time';
    
    console.log('Faculty availability query:', query);
    console.log('Faculty availability params:', params);
    
    const [availability] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: availability
    });
    
  } catch (error) {
    console.error('Error getting faculty availability:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get faculty availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get faculty workload
export const getFacultyWorkload = async (req, res) => {
  try {
    const { facultyId, semester, academicYear } = req.query;
    
    let query = `
      SELECT 
        fw.id,
        fw.faculty_id,
        u.name as faculty_name,
        u.department,
        fw.semester,
        fw.academic_year,
        fw.teaching_hours,
        fw.research_hours,
        fw.admin_hours,
        fw.total_hours,
        fw.max_hours,
        fw.workload_percentage,
        fw.courses_count,
        fw.students_count,
        fw.projects_count
      FROM faculty_workload fw
      LEFT JOIN users u ON fw.faculty_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (facultyId) {
      query += ' AND fw.faculty_id = ?';
      params.push(facultyId);
    }
    
    if (semester) {
      query += ' AND fw.semester = ?';
      params.push(semester);
    }
    
    if (academicYear) {
      query += ' AND fw.academic_year = ?';
      params.push(academicYear);
    }
    
    query += ' ORDER BY fw.academic_year DESC, fw.semester';
    
    const [workload] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: workload
    });
    
  } catch (error) {
    console.error('Error getting faculty workload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faculty workload'
    });
  }
};

// Get rooms
export const getRooms = async (req, res) => {
  try {
    const { building, roomType, isActive = true } = req.query;
    
    let query = `
      SELECT 
        id,
        name,
        code,
        building,
        floor,
        capacity,
        room_type,
        equipment,
        is_active,
        created_at
      FROM rooms
      WHERE 1=1
    `;
    
    const params = [];
    
    if (building) {
      query += ' AND building = ?';
      params.push(building);
    }
    
    if (roomType) {
      query += ' AND room_type = ?';
      params.push(roomType);
    }
    
    if (isActive !== 'all') {
      query += ' AND is_active = ?';
      params.push(isActive === 'true');
    }
    
    query += ' ORDER BY building, name';
    
    const [rooms] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: rooms
    });
    
  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rooms'
    });
  }
};

// Get departments
export const getDepartments = async (req, res) => {
  try {
    const { collegeId } = req.query;
    
    let query = `
      SELECT 
        d.id,
        d.name,
        d.code,
        d.description,
        d.is_active,
        d.created_at,
        c.name as college_name
      FROM departments d
      LEFT JOIN colleges c ON d.college_id = c.id
      WHERE d.is_active = TRUE
    `;
    
    const params = [];
    
    if (collegeId) {
      query += ' AND d.college_id = ?';
      params.push(collegeId);
    }
    
    query += ' ORDER BY d.name';
    
    const [departments] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: departments
    });
    
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get departments'
    });
  }
};
