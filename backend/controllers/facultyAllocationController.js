import { pool } from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// ============================================================
// FACULTY ALLOCATION CONTROLLER
// ============================================================

/**
 * Allocate faculty to project
 */
export const allocateFaculty = async (req, res) => {
  try {
    const { id: project_id } = req.params; // Get project_id from URL params
    const { faculty_id, training_type, employment_type } = req.body;
    const userId = req.user.id;

    if (!project_id || !faculty_id || !training_type || !employment_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: project_id, faculty_id, training_type, employment_type'
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

    // Check if faculty exists and is a faculty user
    const [faculty] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND role = "faculty"',
      [faculty_id]
    );
    if (faculty.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Check if already allocated
    const [existing] = await pool.query(
      'SELECT * FROM faculty_allocations WHERE project_id = ? AND faculty_id = ? AND allocation_status != "replaced"',
      [project_id, faculty_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Faculty already allocated to this project'
      });
    }

    // Validate training_type
    const validTrainingTypes = ['technical', 'aptitude', 'verbal', 'softskills'];
    if (!validTrainingTypes.includes(training_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid training_type. Must be one of: technical, aptitude, verbal, softskills'
      });
    }

    const allocationId = crypto.randomUUID();

    // Check if training_type column exists, if not add it
    try {
      const [columns] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'faculty_allocations' 
        AND COLUMN_NAME = 'training_type'
      `);

      if (columns.length === 0) {
        // Column doesn't exist, add it
        await pool.query(`
          ALTER TABLE faculty_allocations 
          ADD COLUMN training_type ENUM('technical', 'aptitude', 'verbal', 'softskills') NULL
        `);
      }
    } catch (error) {
      logger.error('Error checking/adding training_type column:', error);
      // Continue anyway - column might already exist
    }

    await pool.query(
      `INSERT INTO faculty_allocations (
        id, project_id, faculty_id, training_type,
        employment_type, allocation_status, allocated_by,
        allocated_hours, hourly_rate
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, 0, 0)`,
      [allocationId, project_id, faculty_id, training_type, employment_type, userId]
    );

    // Get allocation details
    const [allocations] = await pool.query(
      `SELECT fa.*, u.name as faculty_name, u.email as faculty_email
       FROM faculty_allocations fa
       LEFT JOIN users u ON fa.faculty_id = u.id
       WHERE fa.id = ?`,
      [allocationId]
    );

    res.status(201).json({
      success: true,
      message: 'Faculty allocated successfully',
      data: allocations[0]
    });
  } catch (error) {
    logger.error('Error allocating faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate faculty',
      error: error.message
    });
  }
};

/**
 * Get allocated faculty for a project
 */
export const getProjectFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const [allocations] = await pool.query(
      `SELECT fa.*, 
        u.name as faculty_name, 
        u.email as faculty_email,
        u.phone as faculty_phone,
        fp.rating,
        fp.current_workload_hours,
        fp.max_available_hours
       FROM faculty_allocations fa
       LEFT JOIN users u ON fa.faculty_id = u.id
       LEFT JOIN faculty_profiles fp ON fa.faculty_id = fp.faculty_id
       WHERE fa.project_id = ?
       ORDER BY fa.allocated_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: allocations
    });
  } catch (error) {
    logger.error('Error getting project faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project faculty',
      error: error.message
    });
  }
};

/**
 * Replace faculty
 */
export const replaceFaculty = async (req, res) => {
  try {
    const { allocation_id } = req.params;
    const { new_faculty_id, reason } = req.body;
    const userId = req.user.id;

    if (!new_faculty_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'new_faculty_id and reason are required'
      });
    }

    // Get current allocation
    const [allocations] = await pool.query(
      'SELECT * FROM faculty_allocations WHERE id = ?',
      [allocation_id]
    );
    if (allocations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found'
      });
    }

    const allocation = allocations[0];

    // Check if new faculty exists
    const [newFaculty] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND role = "faculty"',
      [new_faculty_id]
    );
    if (newFaculty.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'New faculty not found'
      });
    }

    // Check new faculty availability
    const [profile] = await pool.query(
      'SELECT * FROM faculty_profiles WHERE faculty_id = ?',
      [new_faculty_id]
    );

    if (profile.length > 0) {
      const currentWorkload = profile[0].current_workload_hours || 0;
      const maxAvailable = profile[0].max_available_hours || 160;

      if (currentWorkload + allocation.allocated_hours > maxAvailable) {
        return res.status(400).json({
          success: false,
          message: 'New faculty workload would exceed maximum available hours'
        });
      }
    }

    // Update old allocation status
    await pool.query(
      `UPDATE faculty_allocations 
       SET allocation_status = 'replaced', 
           replaced_at = NOW(),
           replacement_reason = ?
       WHERE id = ?`,
      [reason, allocation_id]
    );

    // Create replacement log
    const logId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO faculty_replacement_logs (
        id, project_id, old_faculty_id, new_faculty_id, reason, replaced_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [logId, allocation.project_id, allocation.faculty_id, new_faculty_id, reason, userId]
    );

    // Create new allocation
    const newAllocationId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO faculty_allocations (
        id, project_id, faculty_id, allocated_hours, hourly_rate,
        employment_type, allocation_status, allocated_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?)`,
      [
        newAllocationId, allocation.project_id, new_faculty_id,
        allocation.allocated_hours, allocation.hourly_rate,
        allocation.employment_type, userId
      ]
    );

    // Update workloads
    await pool.query(
      `UPDATE faculty_profiles 
       SET current_workload_hours = current_workload_hours - ?
       WHERE faculty_id = ?`,
      [allocation.allocated_hours, allocation.faculty_id]
    );

    await pool.query(
      `UPDATE faculty_profiles 
       SET current_workload_hours = current_workload_hours + ?
       WHERE faculty_id = ?`,
      [allocation.allocated_hours, new_faculty_id]
    );

    // Update all future sessions
    await pool.query(
      `UPDATE sessions 
       SET faculty_id = ?
       WHERE project_id = ? AND faculty_id = ? AND start_time > NOW()`,
      [new_faculty_id, allocation.project_id, allocation.faculty_id]
    );

    // Update calendar events
    await pool.query(
      `UPDATE calendar_events 
       SET faculty_id = ?
       WHERE project_id = ? AND faculty_id = ? AND start_time > NOW()`,
      [new_faculty_id, allocation.project_id, allocation.faculty_id]
    );

    res.json({
      success: true,
      message: 'Faculty replaced successfully',
      data: {
        old_faculty_id: allocation.faculty_id,
        new_faculty_id,
        allocation_id: newAllocationId
      }
    });
  } catch (error) {
    logger.error('Error replacing faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to replace faculty',
      error: error.message
    });
  }
};

/**
 * Get recommended trainers for a project
 */
export const getRecommendedTrainers = async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'project_id is required'
      });
    }

    // Get project details
    const [projects] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [project_id]
    );
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];

    // Get all available faculty
    const [faculty] = await pool.query(
      `SELECT u.*, 
        fp.rating,
        fp.current_workload_hours,
        fp.max_available_hours,
        fp.is_available,
        (fp.max_available_hours - fp.current_workload_hours) as remaining_hours
       FROM users u
       LEFT JOIN faculty_profiles fp ON u.id = fp.faculty_id
       WHERE u.role = 'faculty' 
         AND u.is_active = TRUE
         AND (fp.is_available IS NULL OR fp.is_available = TRUE)
       ORDER BY fp.rating DESC, remaining_hours DESC`
    );

    // Score each faculty member
    const scoredFaculty = faculty.map(f => {
      let score = 0;

      // Rating score (0-40 points)
      const rating = parseFloat(f.rating) || 0;
      score += (rating / 5) * 40;

      // Availability score (0-30 points)
      const remainingHours = f.remaining_hours || 0;
      const maxHours = f.max_available_hours || 160;
      score += (remainingHours / maxHours) * 30;

      // Workload score (0-30 points) - less workload = higher score
      const currentWorkload = f.current_workload_hours || 0;
      score += (1 - currentWorkload / maxHours) * 30;

      return {
        ...f,
        score: Math.round(score * 100) / 100
      };
    }).sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: scoredFaculty.slice(0, 10) // Top 10 recommendations
    });
  } catch (error) {
    logger.error('Error getting recommended trainers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommended trainers',
      error: error.message
    });
  }
};

/**
 * Get faculty profile
 */
export const getFacultyProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Get faculty user
    const [users] = await pool.query(
      'SELECT id, name, email, phone, avatar_url FROM users WHERE id = ? AND role = "faculty"',
      [id]
    );
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Get profile
    const [profiles] = await pool.query(
      'SELECT * FROM faculty_profiles WHERE faculty_id = ?',
      [id]
    );

    // Get skills
    const [skills] = await pool.query(
      'SELECT * FROM faculty_skills WHERE faculty_id = ? ORDER BY proficiency_level DESC',
      [id]
    );

    // Get current allocations
    const [allocations] = await pool.query(
      `SELECT fa.*, p.name as project_name, p.status as project_status
       FROM faculty_allocations fa
       LEFT JOIN projects p ON fa.project_id = p.id
       WHERE fa.faculty_id = ? AND fa.allocation_status = 'confirmed'
       ORDER BY fa.allocated_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        user: users[0],
        profile: profiles[0] || null,
        skills,
        current_allocations: allocations
      }
    });
  } catch (error) {
    logger.error('Error getting faculty profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faculty profile',
      error: error.message
    });
  }
};

/**
 * Update faculty profile
 */
export const updateFacultyProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rating,
      max_available_hours,
      location,
      distance_preference,
      is_available
    } = req.body;

    // Check if profile exists
    const [profiles] = await pool.query(
      'SELECT * FROM faculty_profiles WHERE faculty_id = ?',
      [id]
    );

    if (profiles.length === 0) {
      // Create profile
      const profileId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO faculty_profiles (
          id, faculty_id, rating, max_available_hours, location,
          distance_preference, is_available
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          profileId, id,
          rating || 0,
          max_available_hours || 160,
          location || null,
          distance_preference || 50,
          is_available !== undefined ? is_available : true
        ]
      );
    } else {
      // Update profile
      const updates = [];
      const params = [];

      if (rating !== undefined) {
        updates.push('rating = ?');
        params.push(rating);
      }
      if (max_available_hours !== undefined) {
        updates.push('max_available_hours = ?');
        params.push(max_available_hours);
      }
      if (location !== undefined) {
        updates.push('location = ?');
        params.push(location);
      }
      if (distance_preference !== undefined) {
        updates.push('distance_preference = ?');
        params.push(distance_preference);
      }
      if (is_available !== undefined) {
        updates.push('is_available = ?');
        params.push(is_available);
      }

      if (updates.length > 0) {
        params.push(id);
        await pool.query(
          `UPDATE faculty_profiles SET ${updates.join(', ')} WHERE faculty_id = ?`,
          params
        );
      }
    }

    res.json({
      success: true,
      message: 'Faculty profile updated successfully'
    });
  } catch (error) {
    logger.error('Error updating faculty profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update faculty profile',
      error: error.message
    });
  }
};

/**
 * Check faculty availability
 */
export const checkFacultyAvailability = async (req, res) => {
  try {
    const { faculty_id, start_time, end_time, exclude_session_id } = req.query;

    if (!faculty_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'faculty_id, start_time, and end_time are required'
      });
    }

    // Check for conflicting sessions
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

    const [conflicts] = await pool.query(sql, params);

    res.json({
      success: true,
      data: {
        is_available: conflicts.length === 0,
        conflicts: conflicts
      }
    });
  } catch (error) {
    logger.error('Error checking faculty availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check faculty availability',
      error: error.message
    });
  }
};

