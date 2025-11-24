import { pool } from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// ============================================================
// ADMIN ALLOCATION CONTROLLER
// ============================================================

/**
 * Allocate admin to project
 */
export const allocateAdmin = async (req, res) => {
  try {
    const { project_id, admin_id, admin_role } = req.body;
    const userId = req.user.id;

    if (!project_id || !admin_id || !admin_role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: project_id, admin_id, admin_role'
      });
    }

    // Validate admin_role
    const validRoles = ['attendance_admin', 'logistics_admin', 'reporting_admin'];
    if (!validRoles.includes(admin_role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid admin_role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Check if project exists
    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [project_id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if admin exists and is an admin user
    const [admins] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND role IN ("super-admin", "college-admin")',
      [admin_id]
    );
    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Check if already allocated
    const [existing] = await pool.query(
      'SELECT * FROM admin_allocations WHERE project_id = ? AND admin_id = ? AND admin_role = ?',
      [project_id, admin_id, admin_role]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin already allocated to this project with this role'
      });
    }

    const allocationId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO admin_allocations (
        id, project_id, admin_id, admin_role, allocated_by
      ) VALUES (?, ?, ?, ?, ?)`,
      [allocationId, project_id, admin_id, admin_role, userId]
    );

    // Get allocation details
    const [allocations] = await pool.query(
      `SELECT aa.*, u.name as admin_name, u.email as admin_email
       FROM admin_allocations aa
       LEFT JOIN users u ON aa.admin_id = u.id
       WHERE aa.id = ?`,
      [allocationId]
    );

    res.status(201).json({
      success: true,
      message: 'Admin allocated successfully',
      data: allocations[0]
    });
  } catch (error) {
    logger.error('Error allocating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate admin',
      error: error.message
    });
  }
};

/**
 * Get allocated admins for a project
 */
export const getProjectAdmins = async (req, res) => {
  try {
    const { id } = req.params;

    const [allocations] = await pool.query(
      `SELECT aa.*, 
        u.name as admin_name, 
        u.email as admin_email,
        u.phone as admin_phone
       FROM admin_allocations aa
       LEFT JOIN users u ON aa.admin_id = u.id
       WHERE aa.project_id = ?
       ORDER BY aa.allocated_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: allocations
    });
  } catch (error) {
    logger.error('Error getting project admins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project admins',
      error: error.message
    });
  }
};

/**
 * Remove admin allocation
 */
export const removeAdminAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if allocation exists
    const [allocations] = await pool.query(
      'SELECT * FROM admin_allocations WHERE id = ?',
      [id]
    );
    if (allocations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin allocation not found'
      });
    }

    await pool.query('DELETE FROM admin_allocations WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Admin allocation removed successfully'
    });
  } catch (error) {
    logger.error('Error removing admin allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove admin allocation',
      error: error.message
    });
  }
};

/**
 * Get admin workload
 */
export const getAdminWorkload = async (req, res) => {
  try {
    const { admin_id } = req.query;

    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: 'admin_id is required'
      });
    }

    // Get all allocations for admin
    const [allocations] = await pool.query(
      `SELECT aa.*, 
        p.name as project_name,
        p.status as project_status,
        p.start_date,
        p.end_date
       FROM admin_allocations aa
       LEFT JOIN projects p ON aa.project_id = p.id
       WHERE aa.admin_id = ?
       ORDER BY p.start_date DESC`,
      [admin_id]
    );

    // Count by role
    const roleCounts = {
      attendance_admin: allocations.filter(a => a.admin_role === 'attendance_admin').length,
      logistics_admin: allocations.filter(a => a.admin_role === 'logistics_admin').length,
      reporting_admin: allocations.filter(a => a.admin_role === 'reporting_admin').length
    };

    res.json({
      success: true,
      data: {
        total_allocations: allocations.length,
        role_counts: roleCounts,
        allocations: allocations
      }
    });
  } catch (error) {
    logger.error('Error getting admin workload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin workload',
      error: error.message
    });
  }
};

