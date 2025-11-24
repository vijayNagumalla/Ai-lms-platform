import { pool } from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import ExcelJS from 'exceljs';

// ============================================================
// SCHEDULING CONTROLLER
// ============================================================

/**
 * Create a session
 */
export const createSession = async (req, res) => {
  try {
    const {
      project_id,
      batch_id,
      faculty_id,
      title,
      topic,
      start_time,
      end_time,
      mode,
      room_id,
      meeting_link,
      is_recurring,
      recurrence_pattern
    } = req.body;

    // Validation
    if (!project_id || !batch_id || !faculty_id || !title || !start_time || !end_time || !mode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate dates
    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Calculate duration
    const start = new Date(start_time);
    const end = new Date(end_time);
    const durationMinutes = Math.round((end - start) / (1000 * 60));

    // Check conflicts
    const conflicts = await detectConflicts({
      faculty_id,
      batch_id,
      room_id,
      start_time,
      end_time,
      exclude_session_id: null
    });

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Conflicts detected',
        conflicts
      });
    }

    const sessionId = crypto.randomUUID();
    const userId = req.user.id;

    await pool.query(
      `INSERT INTO sessions (
        id, project_id, batch_id, faculty_id, title, topic,
        start_time, end_time, duration_minutes, mode,
        room_id, meeting_link, is_recurring, recurrence_pattern,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
      [
        sessionId, project_id, batch_id, faculty_id, title, topic || null,
        start_time, end_time, durationMinutes, mode,
        room_id || null, meeting_link || null,
        is_recurring || false, recurrence_pattern ? JSON.stringify(recurrence_pattern) : null,
        userId
      ]
    );

    // Create calendar event
    await createCalendarEvent(sessionId, project_id, batch_id, faculty_id, title, start_time, end_time);

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { id: sessionId }
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message
    });
  }
};

/**
 * Get sessions with filters
 */
export const getSessions = async (req, res) => {
  try {
    const { project_id, batch_id, faculty_id, college_id, start_date, end_date, status, page = 1, limit = 50 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT s.*,
        p.name as project_name,
        b.name as batch_name,
        u.name as faculty_name,
        c.name as college_name,
        r.name as room_name
      FROM sessions s
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN users u ON s.faculty_id = u.id
      LEFT JOIN colleges c ON b.college_id = c.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (userRole === 'college-admin') {
      sql += ' AND c.id = ?';
      params.push(req.user.college_id);
    } else if (userRole === 'faculty') {
      sql += ' AND s.faculty_id = ?';
      params.push(userId);
    } else if (userRole === 'student') {
      sql += ' AND s.batch_id IN (SELECT batch FROM users WHERE id = ?)';
      params.push(userId);
    }

    if (project_id) {
      sql += ' AND s.project_id = ?';
      params.push(project_id);
    }
    if (batch_id) {
      sql += ' AND s.batch_id = ?';
      params.push(batch_id);
    }
    if (faculty_id) {
      sql += ' AND s.faculty_id = ?';
      params.push(faculty_id);
    }
    if (college_id) {
      sql += ' AND c.id = ?';
      params.push(college_id);
    }
    if (start_date) {
      sql += ' AND DATE(s.start_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(s.end_time) <= ?';
      params.push(end_date);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY s.start_time ASC';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [sessions] = await pool.query(sql, params);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions',
      error: error.message
    });
  }
};

/**
 * Auto-generate schedule for a project
 */
export const autoGenerateSchedule = async (req, res) => {
  try {
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'project_id is required'
      });
    }

    // Get project details
    const [projects] = await pool.query(
      `SELECT p.*, c.id as college_id
       FROM projects p
       LEFT JOIN colleges c ON p.college_id = c.id
       WHERE p.id = ?`,
      [project_id]
    );
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];

    // Get allocated faculty
    const [allocations] = await pool.query(
      'SELECT * FROM faculty_allocations WHERE project_id = ? AND allocation_status = "confirmed"',
      [project_id]
    );
    if (allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No faculty allocated to this project'
      });
    }

    // Get batches
    const [batches] = await pool.query(
      `SELECT b.* FROM batches b
       INNER JOIN project_batches pb ON b.id = pb.batch_id
       WHERE pb.project_id = ?`,
      [project_id]
    );
    if (batches.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No batches assigned to this project'
      });
    }

    const preferredTimings = project.preferred_timings ? JSON.parse(project.preferred_timings) : { start: '09:00', end: '17:00' };
    const sessionDuration = 2; // hours
    const sessionsPerFaculty = Math.ceil(project.total_hours_required / (allocations.length * sessionDuration));

    const createdSessions = [];

    // Generate sessions for each faculty-batch combination
    for (const allocation of allocations) {
      for (const batch of batches) {
        let sessionCount = 0;
        let currentDate = new Date(project.start_date);

        while (sessionCount < sessionsPerFaculty && currentDate <= new Date(project.end_date)) {
          // Skip weekends
          if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Check for holidays
          const [holidays] = await pool.query(
            'SELECT * FROM college_holidays WHERE college_id = ? AND holiday_date = ?',
            [project.college_id, currentDate.toISOString().split('T')[0]]
          );
          if (holidays.length > 0) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Create session time
          const startTime = new Date(currentDate);
          const [startHour, startMinute] = preferredTimings.start.split(':');
          startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

          const endTime = new Date(startTime);
          endTime.setHours(endTime.getHours() + sessionDuration);

          // Check conflicts
          const conflicts = await detectConflicts({
            faculty_id: allocation.faculty_id,
            batch_id: batch.id,
            room_id: null,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            exclude_session_id: null
          });

          if (conflicts.length === 0) {
            const sessionId = crypto.randomUUID();
            const durationMinutes = sessionDuration * 60;

            await pool.query(
              `INSERT INTO sessions (
                id, project_id, batch_id, faculty_id, title,
                start_time, end_time, duration_minutes, mode,
                status, created_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
              [
                sessionId, project_id, batch.id, allocation.faculty_id,
                `${project.name} - Session ${sessionCount + 1}`,
                startTime.toISOString(), endTime.toISOString(),
                durationMinutes, project.mode, req.user.id
              ]
            );

            // Create calendar event
            await createCalendarEvent(
              sessionId, project_id, batch.id, allocation.faculty_id,
              `${project.name} - Session ${sessionCount + 1}`,
              startTime.toISOString(), endTime.toISOString()
            );

            createdSessions.push({ id: sessionId, start_time: startTime, end_time: endTime });
            sessionCount++;
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    res.json({
      success: true,
      message: `Generated ${createdSessions.length} sessions`,
      data: createdSessions
    });
  } catch (error) {
    logger.error('Error auto-generating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-generate schedule',
      error: error.message
    });
  }
};

/**
 * Check for conflicts
 */
export const checkConflicts = async (req, res) => {
  try {
    const { faculty_id, batch_id, room_id, start_time, end_time, exclude_session_id } = req.query;

    const conflicts = await detectConflicts({
      faculty_id,
      batch_id,
      room_id,
      start_time,
      end_time,
      exclude_session_id
    });

    res.json({
      success: true,
      data: {
        has_conflicts: conflicts.length > 0,
        conflicts
      }
    });
  } catch (error) {
    logger.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check conflicts',
      error: error.message
    });
  }
};

/**
 * Export sessions to Excel
 */
export const exportSessionsToExcel = async (req, res) => {
  try {
    const { project_id, start_date, end_date } = req.query;

    let sql = `
      SELECT 
        DATE(s.start_time) as date,
        DAYNAME(s.start_time) as day,
        c.name as college,
        d.name as department,
        b.name as batch,
        u.name as trainer,
        TIME(s.start_time) as start_time,
        TIME(s.end_time) as end_time,
        s.duration_minutes as duration,
        s.topic,
        s.mode,
        r.name as room,
        s.title as remarks
      FROM sessions s
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN colleges c ON b.college_id = c.id
      LEFT JOIN departments d ON b.college_id = d.college_id
      LEFT JOIN users u ON s.faculty_id = u.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (project_id) {
      sql += ' AND s.project_id = ?';
      params.push(project_id);
    }
    if (start_date) {
      sql += ' AND DATE(s.start_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(s.end_time) <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY s.start_time ASC';

    const [sessions] = await pool.query(sql, params);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sessions');

    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Day', key: 'day', width: 10 },
      { header: 'College', key: 'college', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Batch', key: 'batch', width: 15 },
      { header: 'Trainer', key: 'trainer', width: 20 },
      { header: 'Start Time', key: 'start_time', width: 12 },
      { header: 'End Time', key: 'end_time', width: 12 },
      { header: 'Duration', key: 'duration', width: 10 },
      { header: 'Topic', key: 'topic', width: 30 },
      { header: 'Mode', key: 'mode', width: 10 },
      { header: 'Room', key: 'room', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 }
    ];

    // Add data
    sessions.forEach(session => {
      worksheet.addRow({
        date: session.date,
        day: session.day,
        college: session.college,
        department: session.department,
        batch: session.batch,
        trainer: session.trainer,
        start_time: session.start_time,
        end_time: session.end_time,
        duration: `${Math.floor(session.duration / 60)}h ${session.duration % 60}m`,
        topic: session.topic,
        mode: session.mode,
        room: session.room,
        remarks: session.remarks
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sessions.xlsx');
    res.send(buffer);
  } catch (error) {
    logger.error('Error exporting sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export sessions',
      error: error.message
    });
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Detect conflicts for a session
 */
async function detectConflicts({ faculty_id, batch_id, room_id, start_time, end_time, exclude_session_id }) {
  const conflicts = [];

  // Faculty conflict
  if (faculty_id) {
    let sql = `
      SELECT * FROM sessions
      WHERE faculty_id = ?
        AND status IN ('scheduled', 'ongoing')
        AND (
          (start_time <= ? AND end_time >= ?)
          OR (start_time <= ? AND end_time >= ?)
          OR (start_time >= ? AND end_time <= ?)
        )
    `;
    const params = [faculty_id, start_time, start_time, end_time, end_time, start_time, end_time];

    if (exclude_session_id) {
      sql += ' AND id != ?';
      params.push(exclude_session_id);
    }

    const [facultyConflicts] = await pool.query(sql, params);
    if (facultyConflicts.length > 0) {
      conflicts.push({
        type: 'faculty',
        message: 'Faculty has conflicting session',
        conflicts: facultyConflicts
      });
    }
  }

  // Batch conflict
  if (batch_id) {
    let sql = `
      SELECT * FROM sessions
      WHERE batch_id = ?
        AND status IN ('scheduled', 'ongoing')
        AND (
          (start_time <= ? AND end_time >= ?)
          OR (start_time <= ? AND end_time >= ?)
          OR (start_time >= ? AND end_time <= ?)
        )
    `;
    const params = [batch_id, start_time, start_time, end_time, end_time, start_time, end_time];

    if (exclude_session_id) {
      sql += ' AND id != ?';
      params.push(exclude_session_id);
    }

    const [batchConflicts] = await pool.query(sql, params);
    if (batchConflicts.length > 0) {
      conflicts.push({
        type: 'batch',
        message: 'Batch has conflicting session',
        conflicts: batchConflicts
      });
    }
  }

  // Room conflict
  if (room_id) {
    let sql = `
      SELECT * FROM sessions
      WHERE room_id = ?
        AND status IN ('scheduled', 'ongoing')
        AND (
          (start_time <= ? AND end_time >= ?)
          OR (start_time <= ? AND end_time >= ?)
          OR (start_time >= ? AND end_time <= ?)
        )
    `;
    const params = [room_id, start_time, start_time, end_time, end_time, start_time, end_time];

    if (exclude_session_id) {
      sql += ' AND id != ?';
      params.push(exclude_session_id);
    }

    const [roomConflicts] = await pool.query(sql, params);
    if (roomConflicts.length > 0) {
      conflicts.push({
        type: 'room',
        message: 'Room is already booked',
        conflicts: roomConflicts
      });
    }
  }

  return conflicts;
}

/**
 * Create calendar event
 */
async function createCalendarEvent(sessionId, projectId, batchId, facultyId, title, startTime, endTime) {
  try {
    // Get college_id from batch
    const [batches] = await pool.query('SELECT college_id FROM batches WHERE id = ?', [batchId]);
    if (batches.length === 0) return;

    const collegeId = batches[0].college_id;
    const eventId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO calendar_events (
        id, session_id, project_id, batch_id, faculty_id, college_id,
        title, start_time, end_time, color_code, event_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'session')`,
      [eventId, sessionId, projectId, batchId, facultyId, collegeId, title, startTime, endTime, '#3B82F6']
    );
  } catch (error) {
    logger.error('Error creating calendar event:', error);
  }
}

