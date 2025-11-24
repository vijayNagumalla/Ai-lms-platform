import { pool } from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// ============================================================
// PROJECT MANAGEMENT CONTROLLER
// ============================================================

// ============================================================
// 1. PROJECT CRUD OPERATIONS
// ============================================================

/**
 * Create a new project
 */
export const createProject = async (req, res) => {
  try {
    const {
      name,
      college_id,
      project_type,
      total_hours_required,
      start_date,
      end_date,
      trainers_required = 1,
      admins_required = 0,
      mode,
      preferred_timings,
      project_manager_id,
      spoc_id,
      description,
      department_ids = [],
      batch_ids = []
    } = req.body;

    // Validation
    if (!name || !college_id || !project_type || !total_hours_required || !start_date || !end_date || !mode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, college_id, project_type, total_hours_required, start_date, end_date, mode'
      });
    }

    // Validate dates
    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Check if college exists
    const [colleges] = await pool.query('SELECT id FROM colleges WHERE id = ? AND is_active = TRUE', [college_id]);
    if (colleges.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    const projectId = crypto.randomUUID();
    const userId = req.user.id;

    // Create project
    await pool.query(
      `INSERT INTO projects (
        id, name, college_id, project_type, total_hours_required,
        start_date, end_date, trainers_required, admins_required,
        mode, preferred_timings, project_manager_id, spoc_id,
        description, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [
        projectId, name, college_id, project_type, total_hours_required,
        start_date, end_date, trainers_required, admins_required,
        mode, preferred_timings ? JSON.stringify(preferred_timings) : null,
        project_manager_id || null, spoc_id || null, description || null, userId
      ]
    );

    // Add departments
    // Note: Frontend sends college_departments IDs, but project_departments references departments table
    // We need to check if the ID exists in departments, or if it's a college_departments ID, 
    // we should either create it in departments or use college_departments directly
    if (department_ids && department_ids.length > 0) {
      for (const deptId of department_ids) {
        // First check if it exists in departments table
        const [deptCheck] = await pool.query(
          'SELECT id FROM departments WHERE id = ? AND is_active = TRUE',
          [deptId]
        );

        let actualDeptId = deptId;

        // If not found in departments, check if it's a college_departments ID
        if (deptCheck.length === 0) {
          const [collegeDept] = await pool.query(
            'SELECT id, name, code, description FROM college_departments WHERE id = ? AND is_active = TRUE',
            [deptId]
          );

          if (collegeDept.length > 0) {
            // Check if a corresponding department exists with same name/code for this college
            const [existingDept] = await pool.query(
              'SELECT id FROM departments WHERE college_id = ? AND (name = ? OR code = ?) AND is_active = TRUE',
              [college_id, collegeDept[0].name, collegeDept[0].code]
            );

            if (existingDept.length > 0) {
              actualDeptId = existingDept[0].id;
            } else {
              // Create corresponding department entry
              const newDeptId = crypto.randomUUID();
              await pool.query(
                'INSERT INTO departments (id, college_id, name, code, description, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
                [newDeptId, college_id, collegeDept[0].name, collegeDept[0].code, collegeDept[0].description || null]
              );
              actualDeptId = newDeptId;
            }
          } else {
            logger.warn(`Department ID ${deptId} not found in departments or college_departments tables`);
            continue; // Skip this department
          }
        }

        const deptAllocId = crypto.randomUUID();
        await pool.query(
          'INSERT INTO project_departments (id, project_id, department_id) VALUES (?, ?, ?)',
          [deptAllocId, projectId, actualDeptId]
        );
      }
    }

    // Add batches
    if (batch_ids && batch_ids.length > 0) {
      for (const batchId of batch_ids) {
        const batchAllocId = crypto.randomUUID();
        await pool.query(
          'INSERT INTO project_batches (id, project_id, batch_id) VALUES (?, ?, ?)',
          [batchAllocId, projectId, batchId]
        );
      }
    }

    // Get created project
    const [projects] = await pool.query(
      `SELECT p.*, 
        c.name as college_name,
        u1.name as project_manager_name,
        u2.name as spoc_name
      FROM projects p
      LEFT JOIN colleges c ON p.college_id = c.id
      LEFT JOIN users u1 ON p.project_manager_id = u1.id
      LEFT JOIN users u2 ON p.spoc_id = u2.id
      WHERE p.id = ?`,
      [projectId]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: projects[0]
    });
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
};

/**
 * Get all projects with filters
 */
export const getProjects = async (req, res) => {
  try {
    const { college_id, status, project_type, search, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT p.*, 
        c.name as college_name,
        u1.name as project_manager_name,
        u2.name as spoc_name,
        COUNT(DISTINCT fa.id) as allocated_trainers_count,
        COUNT(DISTINCT s.id) as sessions_count
      FROM projects p
      LEFT JOIN colleges c ON p.college_id = c.id
      LEFT JOIN users u1 ON p.project_manager_id = u1.id
      LEFT JOIN users u2 ON p.spoc_id = u2.id
      LEFT JOIN faculty_allocations fa ON p.id = fa.project_id AND fa.allocation_status = 'confirmed'
      LEFT JOIN sessions s ON p.id = s.project_id
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

    // Additional filters
    if (college_id) {
      sql += ' AND p.college_id = ?';
      params.push(college_id);
    }
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    if (project_type) {
      sql += ' AND p.project_type = ?';
      params.push(project_type);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [projects] = await pool.query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(DISTINCT p.id) as total FROM projects p WHERE 1=1';
    const countParams = [];

    if (userRole === 'college-admin') {
      countSql += ' AND p.college_id = ?';
      countParams.push(req.user.college_id);
    } else if (userRole === 'faculty') {
      countSql += ' AND EXISTS (SELECT 1 FROM faculty_allocations fa2 WHERE fa2.project_id = p.id AND fa2.faculty_id = ?)';
      countParams.push(userId);
    }

    if (college_id) {
      countSql += ' AND p.college_id = ?';
      countParams.push(college_id);
    }
    if (status) {
      countSql += ' AND p.status = ?';
      countParams.push(status);
    }
    if (project_type) {
      countSql += ' AND p.project_type = ?';
      countParams.push(project_type);
    }
    if (search) {
      countSql += ' AND (p.name LIKE ? OR c.name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projects',
      error: error.message
    });
  }
};

/**
 * Get project by ID
 */
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT p.*, 
        c.name as college_name,
        u1.name as project_manager_name,
        u2.name as spoc_name
      FROM projects p
      LEFT JOIN colleges c ON p.college_id = c.id
      LEFT JOIN users u1 ON p.project_manager_id = u1.id
      LEFT JOIN users u2 ON p.spoc_id = u2.id
      WHERE p.id = ?
    `;
    const params = [id];

    // Role-based access
    if (userRole === 'college-admin') {
      sql += ' AND p.college_id = ?';
      params.push(req.user.college_id);
    } else if (userRole === 'faculty') {
      sql += ' AND EXISTS (SELECT 1 FROM faculty_allocations fa WHERE fa.project_id = p.id AND fa.faculty_id = ?)';
      params.push(userId);
    }

    const [projects] = await pool.query(sql, params);

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];

    // Get departments
    const [departments] = await pool.query(
      `SELECT d.* FROM departments d
       INNER JOIN project_departments pd ON d.id = pd.department_id
       WHERE pd.project_id = ?`,
      [id]
    );

    // Get batches
    const [batches] = await pool.query(
      `SELECT b.* FROM batches b
       INNER JOIN project_batches pb ON b.id = pb.batch_id
       WHERE pb.project_id = ?`,
      [id]
    );

    // Get faculty allocations
    const [facultyAllocations] = await pool.query(
      `SELECT fa.*, u.name as faculty_name, u.email as faculty_email
       FROM faculty_allocations fa
       LEFT JOIN users u ON fa.faculty_id = u.id
       WHERE fa.project_id = ?`,
      [id]
    );

    // Get admin allocations
    const [adminAllocations] = await pool.query(
      `SELECT aa.*, u.name as admin_name
       FROM admin_allocations aa
       LEFT JOIN users u ON aa.admin_id = u.id
       WHERE aa.project_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...project,
        departments,
        batches,
        faculty_allocations: facultyAllocations,
        admin_allocations: adminAllocations
      }
    });
  } catch (error) {
    logger.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project',
      error: error.message
    });
  }
};

/**
 * Update project
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has permission
    if (userRole !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can update projects'
      });
    }

    const {
      name,
      project_type,
      total_hours_required,
      start_date,
      end_date,
      trainers_required,
      admins_required,
      mode,
      preferred_timings,
      project_manager_id,
      spoc_id,
      description,
      status
    } = req.body;

    // Check if project exists
    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];

    // Validate status transition
    if (status && status !== project.status) {
      const validTransitions = {
        'draft': ['faculty_allocation'],
        'faculty_allocation': ['scheduling', 'draft'],
        'scheduling': ['admin_allocation', 'faculty_allocation'],
        'admin_allocation': ['live', 'scheduling'],
        'live': ['completed'],
        'completed': [],
        'cancelled': []
      };

      if (!validTransitions[project.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${project.status} to ${status}`
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (project_type !== undefined) {
      updates.push('project_type = ?');
      params.push(project_type);
    }
    if (total_hours_required !== undefined) {
      updates.push('total_hours_required = ?');
      params.push(total_hours_required);
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(end_date);
    }
    if (trainers_required !== undefined) {
      updates.push('trainers_required = ?');
      params.push(trainers_required);
    }
    if (admins_required !== undefined) {
      updates.push('admins_required = ?');
      params.push(admins_required);
    }
    if (mode !== undefined) {
      updates.push('mode = ?');
      params.push(mode);
    }
    if (preferred_timings !== undefined) {
      updates.push('preferred_timings = ?');
      params.push(JSON.stringify(preferred_timings));
    }
    if (project_manager_id !== undefined) {
      updates.push('project_manager_id = ?');
      params.push(project_manager_id);
    }
    if (spoc_id !== undefined) {
      updates.push('spoc_id = ?');
      params.push(spoc_id);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);

    await pool.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated project
    const [updatedProjects] = await pool.query(
      `SELECT p.*, 
        c.name as college_name,
        u1.name as project_manager_name,
        u2.name as spoc_name
      FROM projects p
      LEFT JOIN colleges c ON p.college_id = c.id
      LEFT JOIN users u1 ON p.project_manager_id = u1.id
      LEFT JOIN users u2 ON p.spoc_id = u2.id
      WHERE p.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProjects[0]
    });
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
};

/**
 * Delete project
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    if (userRole !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can delete projects'
      });
    }

    // Check if project exists
    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if project has active sessions
    const [sessions] = await pool.query(
      'SELECT COUNT(*) as count FROM sessions WHERE project_id = ? AND status IN ("scheduled", "ongoing")',
      [id]
    );

    if (sessions[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete project with active sessions'
      });
    }

    // Delete project (cascade will handle related records)
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
};

/**
 * Update project status
 */
export const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['draft', 'faculty_allocation', 'scheduling', 'admin_allocation', 'live', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get current project
    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];

    // Validate status transition
    const validTransitions = {
      'draft': ['faculty_allocation'],
      'faculty_allocation': ['scheduling', 'draft'],
      'scheduling': ['admin_allocation', 'faculty_allocation'],
      'admin_allocation': ['live', 'scheduling'],
      'live': ['completed'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[project.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${project.status} to ${status}`
      });
    }

    await pool.query('UPDATE projects SET status = ? WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: 'Project status updated successfully',
      data: { id, status }
    });
  } catch (error) {
    logger.error('Error updating project status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project status',
      error: error.message
    });
  }
};

/**
 * Add departments to project
 */
export const addDepartmentsToProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_ids } = req.body;

    if (!department_ids || !Array.isArray(department_ids) || department_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'department_ids array is required'
      });
    }

    // Check if project exists
    const [projects] = await pool.query('SELECT college_id FROM projects WHERE id = ?', [id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const collegeId = projects[0].college_id;

    // Verify departments belong to the college
    const placeholders = department_ids.map(() => '?').join(',');
    const [departments] = await pool.query(
      `SELECT id FROM departments WHERE id IN (${placeholders}) AND college_id = ?`,
      [...department_ids, collegeId]
    );

    if (departments.length !== department_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some departments do not belong to the project college'
      });
    }

    // Add departments
    for (const deptId of department_ids) {
      const deptAllocId = crypto.randomUUID();
      await pool.query(
        'INSERT IGNORE INTO project_departments (id, project_id, department_id) VALUES (?, ?, ?)',
        [deptAllocId, id, deptId]
      );
    }

    res.json({
      success: true,
      message: 'Departments added to project successfully'
    });
  } catch (error) {
    logger.error('Error adding departments to project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add departments',
      error: error.message
    });
  }
};

/**
 * Add batches to project
 */
export const addBatchesToProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_ids } = req.body;

    if (!batch_ids || !Array.isArray(batch_ids) || batch_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'batch_ids array is required'
      });
    }

    // Check if project exists
    const [projects] = await pool.query('SELECT college_id FROM projects WHERE id = ?', [id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const collegeId = projects[0].college_id;

    // Verify batches belong to the college
    const placeholders = batch_ids.map(() => '?').join(',');
    const [batches] = await pool.query(
      `SELECT id FROM batches WHERE id IN (${placeholders}) AND college_id = ?`,
      [...batch_ids, collegeId]
    );

    if (batches.length !== batch_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some batches do not belong to the project college'
      });
    }

    // Add batches
    for (const batchId of batch_ids) {
      const batchAllocId = crypto.randomUUID();
      await pool.query(
        'INSERT IGNORE INTO project_batches (id, project_id, batch_id) VALUES (?, ?, ?)',
        [batchAllocId, id, batchId]
      );
    }

    res.json({
      success: true,
      message: 'Batches added to project successfully'
    });
  } catch (error) {
    logger.error('Error adding batches to project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add batches',
      error: error.message
    });
  }
};

