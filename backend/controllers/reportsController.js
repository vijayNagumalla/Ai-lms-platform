import { pool } from '../config/database.js';
import logger from '../utils/logger.js';
import ExcelJS from 'exceljs';

// ============================================================
// REPORTS & ANALYTICS CONTROLLER
// ============================================================

/**
 * Get project progress report
 */
export const getProjectProgressReport = async (req, res) => {
  try {
    const { project_id, college_id, start_date, end_date } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        p.id,
        p.name as project_name,
        p.status,
        p.total_hours_required,
        p.start_date,
        p.end_date,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions,
        SUM(CASE WHEN s.status = 'completed' THEN s.duration_minutes ELSE 0 END) / 60.0 as hours_delivered,
        COUNT(DISTINCT fa.id) as allocated_trainers,
        COUNT(DISTINCT aa.id) as allocated_admins
      FROM projects p
      LEFT JOIN sessions s ON p.id = s.project_id
      LEFT JOIN faculty_allocations fa ON p.id = fa.project_id AND fa.allocation_status = 'confirmed'
      LEFT JOIN admin_allocations aa ON p.id = aa.project_id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (userRole === 'college-admin') {
      sql += ' AND p.college_id = ?';
      params.push(req.user.college_id);
    } else if (userRole === 'faculty') {
      sql += ' AND EXISTS (SELECT 1 FROM faculty_allocations fa2 WHERE fa2.project_id = p.id AND fa2.faculty_id = ?)';
      params.push(userId);
    }

    if (project_id) {
      sql += ' AND p.id = ?';
      params.push(project_id);
    }
    if (college_id) {
      sql += ' AND p.college_id = ?';
      params.push(college_id);
    }
    if (start_date) {
      sql += ' AND p.start_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND p.end_date <= ?';
      params.push(end_date);
    }

    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const [projects] = await pool.query(sql, params);

    // Calculate progress percentage
    const reports = projects.map(project => ({
      ...project,
      progress_percentage: project.total_hours_required > 0
        ? ((project.hours_delivered / project.total_hours_required) * 100).toFixed(2)
        : 0,
      completion_rate: project.total_sessions > 0
        ? ((project.completed_sessions / project.total_sessions) * 100).toFixed(2)
        : 0
    }));

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    logger.error('Error getting project progress report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project progress report',
      error: error.message
    });
  }
};

/**
 * Get trainer utilization report
 */
export const getTrainerUtilizationReport = async (req, res) => {
  try {
    const { faculty_id, start_date, end_date } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        u.id as faculty_id,
        u.name as faculty_name,
        u.email as faculty_email,
        fp.rating,
        fp.max_available_hours,
        fp.current_workload_hours,
        COUNT(DISTINCT fa.project_id) as active_projects,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions,
        SUM(CASE WHEN s.status = 'completed' THEN s.duration_minutes ELSE 0 END) / 60.0 as hours_worked
      FROM users u
      LEFT JOIN faculty_profiles fp ON u.id = fp.faculty_id
      LEFT JOIN faculty_allocations fa ON u.id = fa.faculty_id AND fa.allocation_status = 'confirmed'
      LEFT JOIN sessions s ON u.id = s.faculty_id
      WHERE u.role = 'faculty' AND u.is_active = TRUE
    `;
    const params = [];

    // Role-based filtering
    if (userRole === 'faculty') {
      sql += ' AND u.id = ?';
      params.push(userId);
    }

    if (faculty_id) {
      sql += ' AND u.id = ?';
      params.push(faculty_id);
    }
    if (start_date) {
      sql += ' AND DATE(s.start_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(s.start_time) <= ?';
      params.push(end_date);
    }

    sql += ' GROUP BY u.id ORDER BY hours_worked DESC';

    const [trainers] = await pool.query(sql, params);

    // Calculate utilization percentage
    const reports = trainers.map(trainer => ({
      ...trainer,
      utilization_percentage: trainer.max_available_hours > 0
        ? ((trainer.hours_worked / trainer.max_available_hours) * 100).toFixed(2)
        : 0,
      remaining_hours: (trainer.max_available_hours || 160) - (trainer.hours_worked || 0)
    }));

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    logger.error('Error getting trainer utilization report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer utilization report',
      error: error.message
    });
  }
};

/**
 * Get college-wise attendance report
 */
export const getCollegeAttendanceReport = async (req, res) => {
  try {
    const { college_id, start_date, end_date, format = 'json' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        c.id as college_id,
        c.name as college_name,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT a.id) as attendance_records,
        COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as present_count,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.id END) as absent_count,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.id END) as late_count,
        COUNT(DISTINCT a.student_id) as unique_students
      FROM colleges c
      LEFT JOIN projects p ON c.id = p.college_id
      LEFT JOIN sessions s ON p.id = s.project_id
      LEFT JOIN attendance a ON s.id = a.session_id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (userRole === 'college-admin') {
      sql += ' AND c.id = ?';
      params.push(req.user.college_id);
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
      sql += ' AND DATE(s.start_time) <= ?';
      params.push(end_date);
    }

    sql += ' GROUP BY c.id ORDER BY c.name ASC';

    const [colleges] = await pool.query(sql, params);

    // Calculate attendance percentage
    const reports = colleges.map(college => ({
      ...college,
      attendance_percentage: college.attendance_records > 0
        ? ((college.present_count / college.attendance_records) * 100).toFixed(2)
        : 0
    }));

    if (format === 'excel') {
      // Export to Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('College Attendance Report');

      worksheet.columns = [
        { header: 'College Name', key: 'college_name', width: 30 },
        { header: 'Total Sessions', key: 'total_sessions', width: 15 },
        { header: 'Attendance Records', key: 'attendance_records', width: 20 },
        { header: 'Present', key: 'present_count', width: 12 },
        { header: 'Absent', key: 'absent_count', width: 12 },
        { header: 'Late', key: 'late_count', width: 12 },
        { header: 'Unique Students', key: 'unique_students', width: 15 },
        { header: 'Attendance %', key: 'attendance_percentage', width: 15 }
      ];

      reports.forEach(college => {
        worksheet.addRow({
          college_name: college.college_name,
          total_sessions: college.total_sessions,
          attendance_records: college.attendance_records,
          present_count: college.present_count,
          absent_count: college.absent_count,
          late_count: college.late_count,
          unique_students: college.unique_students,
          attendance_percentage: `${college.attendance_percentage}%`
        });
      });

      worksheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=college_attendance_report.xlsx');
      res.send(buffer);
    } else {
      res.json({
        success: true,
        data: reports
      });
    }
  } catch (error) {
    logger.error('Error getting college attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get college attendance report',
      error: error.message
    });
  }
};

/**
 * Get invoice summary report
 */
export const getInvoiceSummaryReport = async (req, res) => {
  try {
    const { faculty_id, college_id, start_date, end_date } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        i.*,
        u.name as faculty_name,
        c.name as college_name,
        COUNT(ii.id) as item_count
      FROM invoices i
      LEFT JOIN users u ON i.faculty_id = u.id
      LEFT JOIN colleges c ON i.college_id = c.id
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (userRole === 'faculty') {
      sql += ' AND i.faculty_id = ?';
      params.push(userId);
    } else if (userRole === 'college-admin') {
      sql += ' AND i.college_id = ?';
      params.push(req.user.college_id);
    }

    if (faculty_id) {
      sql += ' AND i.faculty_id = ?';
      params.push(faculty_id);
    }
    if (college_id) {
      sql += ' AND i.college_id = ?';
      params.push(college_id);
    }
    if (start_date) {
      sql += ' AND i.billing_period_start >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND i.billing_period_end <= ?';
      params.push(end_date);
    }

    sql += ' GROUP BY i.id ORDER BY i.invoice_date DESC';

    const [invoices] = await pool.query(sql, params);

    // Calculate totals
    const totals = invoices.reduce((acc, invoice) => {
      acc.total_invoices += 1;
      acc.total_hours += invoice.total_hours || 0;
      acc.total_subtotal += parseFloat(invoice.subtotal) || 0;
      acc.total_tds += parseFloat(invoice.tds_amount) || 0;
      acc.total_net_payable += parseFloat(invoice.net_payable) || 0;
      return acc;
    }, {
      total_invoices: 0,
      total_hours: 0,
      total_subtotal: 0,
      total_tds: 0,
      total_net_payable: 0
    });

    res.json({
      success: true,
      data: {
        invoices,
        totals
      }
    });
  } catch (error) {
    logger.error('Error getting invoice summary report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice summary report',
      error: error.message
    });
  }
};

