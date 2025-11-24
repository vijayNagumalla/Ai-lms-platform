import { pool } from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import ExcelJS from 'exceljs';

// ============================================================
// ATTENDANCE CONTROLLER
// ============================================================

/**
 * Mark attendance for a session
 */
export const markAttendance = async (req, res) => {
  try {
    const { session_id, attendance_data } = req.body; // attendance_data: [{student_id, status, remarks}]
    const userId = req.user.id;

    if (!session_id || !attendance_data || !Array.isArray(attendance_data)) {
      return res.status(400).json({
        success: false,
        message: 'session_id and attendance_data array are required'
      });
    }

    // Verify session exists and user has permission
    const [sessions] = await pool.query(
      'SELECT * FROM sessions WHERE id = ?',
      [session_id]
    );
    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessions[0];

    // Check if user is the faculty for this session
    if (req.user.role !== 'super-admin' && session.faculty_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned faculty can mark attendance'
      });
    }

    // Get batch students
    const [students] = await pool.query(
      'SELECT id FROM users WHERE batch = ? AND role = "student" AND is_active = TRUE',
      [session.batch_id]
    );

    const studentIds = students.map(s => s.id);
    const markedAttendance = [];

    // Mark attendance for each student
    for (const att of attendance_data) {
      if (!studentIds.includes(att.student_id)) {
        continue; // Skip if student doesn't belong to batch
      }

      const attendanceId = crypto.randomUUID();

      // Use INSERT ... ON DUPLICATE KEY UPDATE
      await pool.query(
        `INSERT INTO attendance (id, session_id, student_id, status, marked_by, remarks)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         marked_by = VALUES(marked_by),
         remarks = VALUES(remarks),
         marked_at = NOW()`,
        [attendanceId, session_id, att.student_id, att.status, userId, att.remarks || null]
      );

      markedAttendance.push({
        student_id: att.student_id,
        status: att.status
      });
    }

    res.json({
      success: true,
      message: `Attendance marked for ${markedAttendance.length} students`,
      data: markedAttendance
    });
  } catch (error) {
    logger.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

/**
 * Get attendance for a session
 */
export const getSessionAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    // Get session details
    const [sessions] = await pool.query(
      `SELECT s.*, b.name as batch_name
       FROM sessions s
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE s.id = ?`,
      [id]
    );
    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Get all students in batch
    const [students] = await pool.query(
      `SELECT u.id, u.name, u.email, u.student_id
       FROM users u
       WHERE u.batch = ? AND u.role = 'student' AND u.is_active = TRUE
       ORDER BY u.name ASC`,
      [sessions[0].batch_id]
    );

    // Get marked attendance
    const [attendance] = await pool.query(
      `SELECT * FROM attendance WHERE session_id = ?`,
      [id]
    );

    const attendanceMap = {};
    attendance.forEach(att => {
      attendanceMap[att.student_id] = att;
    });

    // Combine students with attendance
    const attendanceList = students.map(student => ({
      student_id: student.id,
      student_name: student.name,
      student_email: student.email,
      student_roll: student.student_id,
      status: attendanceMap[student.id]?.status || null,
      marked_at: attendanceMap[student.id]?.marked_at || null,
      remarks: attendanceMap[student.id]?.remarks || null
    }));

    res.json({
      success: true,
      data: {
        session: sessions[0],
        attendance: attendanceList
      }
    });
  } catch (error) {
    logger.error('Error getting session attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session attendance',
      error: error.message
    });
  }
};

/**
 * Bulk upload attendance
 */
export const bulkUploadAttendance = async (req, res) => {
  try {
    const { session_id, file } = req.body;

    if (!session_id || !file) {
      return res.status(400).json({
        success: false,
        message: 'session_id and file are required'
      });
    }

    // Parse Excel file (implementation depends on file upload middleware)
    // This is a placeholder - actual implementation would parse the uploaded file
    res.json({
      success: true,
      message: 'Bulk upload feature - to be implemented with file parsing'
    });
  } catch (error) {
    logger.error('Error bulk uploading attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk upload attendance',
      error: error.message
    });
  }
};

/**
 * Get attendance reports
 */
export const getAttendanceReports = async (req, res) => {
  try {
    const { batch_id, student_id, project_id, start_date, end_date, format = 'json' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        a.*,
        s.title as session_title,
        s.start_time,
        u.name as student_name,
        u.student_id as student_roll,
        b.name as batch_name,
        p.name as project_name
      FROM attendance a
      LEFT JOIN sessions s ON a.session_id = s.id
      LEFT JOIN users u ON a.student_id = u.id
      LEFT JOIN batches b ON u.batch = b.id
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (userRole === 'student') {
      sql += ' AND a.student_id = ?';
      params.push(userId);
    } else if (userRole === 'college-admin') {
      sql += ' AND b.college_id = ?';
      params.push(req.user.college_id);
    }

    if (batch_id) {
      sql += ' AND b.id = ?';
      params.push(batch_id);
    }
    if (student_id) {
      sql += ' AND a.student_id = ?';
      params.push(student_id);
    }
    if (project_id) {
      sql += ' AND s.project_id = ?';
      params.push(project_id);
    }
    if (start_date) {
      sql += ' AND DATE(s.start_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(s.start_time) <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY s.start_time DESC';

    const [attendance] = await pool.query(sql, params);

    if (format === 'excel') {
      // Export to Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Report');

      worksheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Student Name', key: 'student_name', width: 20 },
        { header: 'Student Roll', key: 'student_roll', width: 15 },
        { header: 'Batch', key: 'batch_name', width: 15 },
        { header: 'Project', key: 'project_name', width: 20 },
        { header: 'Session', key: 'session_title', width: 30 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Remarks', key: 'remarks', width: 30 }
      ];

      attendance.forEach(att => {
        worksheet.addRow({
          date: new Date(att.start_time).toLocaleDateString(),
          student_name: att.student_name,
          student_roll: att.student_roll,
          batch_name: att.batch_name,
          project_name: att.project_name,
          session_title: att.session_title,
          status: att.status,
          remarks: att.remarks
        });
      });

      worksheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.xlsx');
      res.send(buffer);
    } else {
      res.json({
        success: true,
        data: attendance
      });
    }
  } catch (error) {
    logger.error('Error getting attendance reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance reports',
      error: error.message
    });
  }
};

/**
 * Get student attendance summary
 */
export const getStudentAttendanceSummary = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { project_id, start_date, end_date } = req.query;

    // Get total sessions
    let sql = `
      SELECT COUNT(*) as total_sessions
      FROM sessions s
      LEFT JOIN users u ON s.batch_id = u.batch
      WHERE u.id = ? AND u.role = 'student'
    `;
    const params = [student_id];

    if (project_id) {
      sql += ' AND s.project_id = ?';
      params.push(project_id);
    }
    if (start_date) {
      sql += ' AND DATE(s.start_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(s.start_time) <= ?';
      params.push(end_date);
    }

    const [totalResult] = await pool.query(sql, params);
    const totalSessions = totalResult[0].total_sessions;

    // Get attendance counts
    sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late
      FROM attendance a
      LEFT JOIN sessions s ON a.session_id = s.id
      WHERE a.student_id = ?
    `;
    const attParams = [student_id];

    if (project_id) {
      sql += ' AND s.project_id = ?';
      attParams.push(project_id);
    }
    if (start_date) {
      sql += ' AND DATE(s.start_time) >= ?';
      attParams.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(s.start_time) <= ?';
      attParams.push(end_date);
    }

    const [attendanceResult] = await pool.query(sql, attParams);
    const attendance = attendanceResult[0];

    const attendancePercentage = totalSessions > 0 
      ? ((attendance.present || 0) / totalSessions * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        total_sessions: totalSessions,
        present: attendance.present || 0,
        absent: attendance.absent || 0,
        late: attendance.late || 0,
        attendance_percentage: parseFloat(attendancePercentage)
      }
    });
  } catch (error) {
    logger.error('Error getting student attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student attendance summary',
      error: error.message
    });
  }
};

