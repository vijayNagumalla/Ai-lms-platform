import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

// ============================================================
// CALENDAR CONTROLLER
// ============================================================

/**
 * Get calendar events
 */
export const getCalendarEvents = async (req, res) => {
  try {
    const { start_date, end_date, faculty_id, batch_id, college_id, project_id } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT ce.*,
        s.title as session_title,
        s.topic,
        s.mode,
        p.name as project_name,
        b.name as batch_name,
        u.name as faculty_name,
        r.name as room_name
      FROM calendar_events ce
      LEFT JOIN sessions s ON ce.session_id = s.id
      LEFT JOIN projects p ON ce.project_id = p.id
      LEFT JOIN batches b ON ce.batch_id = b.id
      LEFT JOIN users u ON ce.faculty_id = u.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (userRole === 'college-admin') {
      sql += ' AND ce.college_id = ?';
      params.push(req.user.college_id);
    } else if (userRole === 'faculty') {
      sql += ' AND ce.faculty_id = ?';
      params.push(userId);
    } else if (userRole === 'student') {
      sql += ' AND ce.batch_id IN (SELECT batch FROM users WHERE id = ?)';
      params.push(userId);
    }

    if (start_date) {
      sql += ' AND DATE(ce.start_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(ce.end_time) <= ?';
      params.push(end_date);
    }
    if (faculty_id) {
      sql += ' AND ce.faculty_id = ?';
      params.push(faculty_id);
    }
    if (batch_id) {
      sql += ' AND ce.batch_id = ?';
      params.push(batch_id);
    }
    if (college_id) {
      sql += ' AND ce.college_id = ?';
      params.push(college_id);
    }
    if (project_id) {
      sql += ' AND ce.project_id = ?';
      params.push(project_id);
    }

    sql += ' ORDER BY ce.start_time ASC';

    const [events] = await pool.query(sql, params);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error getting calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get calendar events',
      error: error.message
    });
  }
};

/**
 * Get day view
 */
export const getDayView = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT ce.*,
        s.title as session_title,
        s.topic,
        s.mode,
        p.name as project_name,
        b.name as batch_name,
        u.name as faculty_name,
        r.name as room_name
      FROM calendar_events ce
      LEFT JOIN sessions s ON ce.session_id = s.id
      LEFT JOIN projects p ON ce.project_id = p.id
      LEFT JOIN batches b ON ce.batch_id = b.id
      LEFT JOIN users u ON ce.faculty_id = u.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE DATE(ce.start_time) = ?
    `;
    const params = [date];

    // Role-based filtering
    if (userRole === 'college-admin') {
      sql += ' AND ce.college_id = ?';
      params.push(req.user.college_id);
    } else if (userRole === 'faculty') {
      sql += ' AND ce.faculty_id = ?';
      params.push(userId);
    } else if (userRole === 'student') {
      sql += ' AND ce.batch_id IN (SELECT batch FROM users WHERE id = ?)';
      params.push(userId);
    }

    sql += ' ORDER BY ce.start_time ASC';

    const [events] = await pool.query(sql, params);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error getting day view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get day view',
      error: error.message
    });
  }
};

/**
 * Get week view
 */
export const getWeekView = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Calculate week start and end
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let sql = `
      SELECT ce.*,
        s.title as session_title,
        s.topic,
        s.mode,
        p.name as project_name,
        b.name as batch_name,
        u.name as faculty_name,
        r.name as room_name
      FROM calendar_events ce
      LEFT JOIN sessions s ON ce.session_id = s.id
      LEFT JOIN projects p ON ce.project_id = p.id
      LEFT JOIN batches b ON ce.batch_id = b.id
      LEFT JOIN users u ON ce.faculty_id = u.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE DATE(ce.start_time) >= ? AND DATE(ce.start_time) <= ?
    `;
    const params = [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]];

    // Role-based filtering
    if (userRole === 'college-admin') {
      sql += ' AND ce.college_id = ?';
      params.push(req.user.college_id);
    } else if (userRole === 'faculty') {
      sql += ' AND ce.faculty_id = ?';
      params.push(userId);
    } else if (userRole === 'student') {
      sql += ' AND ce.batch_id IN (SELECT batch FROM users WHERE id = ?)';
      params.push(userId);
    }

    sql += ' ORDER BY ce.start_time ASC';

    const [events] = await pool.query(sql, params);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error getting week view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get week view',
      error: error.message
    });
  }
};

/**
 * Get month view
 */
export const getMonthView = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Calculate month start and end
    const monthStart = new Date(date);
    monthStart.setDate(1);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    let sql = `
      SELECT ce.*,
        s.title as session_title,
        s.topic,
        s.mode,
        p.name as project_name,
        b.name as batch_name,
        u.name as faculty_name,
        r.name as room_name
      FROM calendar_events ce
      LEFT JOIN sessions s ON ce.session_id = s.id
      LEFT JOIN projects p ON ce.project_id = p.id
      LEFT JOIN batches b ON ce.batch_id = b.id
      LEFT JOIN users u ON ce.faculty_id = u.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE DATE(ce.start_time) >= ? AND DATE(ce.start_time) <= ?
    `;
    const params = [monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]];

    // Role-based filtering
    if (userRole === 'college-admin') {
      sql += ' AND ce.college_id = ?';
      params.push(req.user.college_id);
    } else if (userRole === 'faculty') {
      sql += ' AND ce.faculty_id = ?';
      params.push(userId);
    } else if (userRole === 'student') {
      sql += ' AND ce.batch_id IN (SELECT batch FROM users WHERE id = ?)';
      params.push(userId);
    }

    sql += ' ORDER BY ce.start_time ASC';

    const [events] = await pool.query(sql, params);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error getting month view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get month view',
      error: error.message
    });
  }
};

