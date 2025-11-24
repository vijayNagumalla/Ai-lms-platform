import { pool } from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// ============================================================
// FEEDBACK CONTROLLER
// ============================================================

/**
 * Submit feedback
 */
export const submitFeedback = async (req, res) => {
  try {
    const {
      project_id,
      session_id,
      feedback_type,
      to_user_id,
      to_batch_id,
      rating_overall,
      rating_professionalism,
      rating_content_relevance,
      rating_communication,
      textual_feedback,
      suggestions,
      is_anonymous
    } = req.body;

    const fromUserId = req.user.id;

    if (!feedback_type) {
      return res.status(400).json({
        success: false,
        message: 'feedback_type is required'
      });
    }

    const feedbackId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO feedback (
        id, project_id, session_id, feedback_type, from_user_id,
        to_user_id, to_batch_id, rating_overall, rating_professionalism,
        rating_content_relevance, rating_communication,
        textual_feedback, suggestions, is_anonymous
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feedbackId, project_id || null, session_id || null, feedback_type, fromUserId,
        to_user_id || null, to_batch_id || null,
        rating_overall || null, rating_professionalism || null,
        rating_content_relevance || null, rating_communication || null,
        textual_feedback || null, suggestions || null, is_anonymous || false
      ]
    );

    // Update faculty rating if feedback is for faculty
    if (to_user_id && rating_overall) {
      await updateFacultyRating(to_user_id);
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { id: feedbackId }
    });
  } catch (error) {
    logger.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

/**
 * Get feedback with filters
 */
export const getFeedback = async (req, res) => {
  try {
    const { project_id, faculty_id, feedback_type, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT f.*,
        u1.name as from_user_name,
        u2.name as to_user_name,
        b.name as batch_name,
        p.name as project_name
      FROM feedback f
      LEFT JOIN users u1 ON f.from_user_id = u1.id
      LEFT JOIN users u2 ON f.to_user_id = u2.id
      LEFT JOIN batches b ON f.to_batch_id = b.id
      LEFT JOIN projects p ON f.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (userRole === 'faculty') {
      sql += ' AND f.to_user_id = ?';
      params.push(userId);
    } else if (userRole === 'student') {
      sql += ' AND f.from_user_id = ?';
      params.push(userId);
    } else if (userRole === 'college-admin') {
      sql += ' AND EXISTS (SELECT 1 FROM projects p2 WHERE p2.id = f.project_id AND p2.college_id = ?)';
      params.push(req.user.college_id);
    }

    if (project_id) {
      sql += ' AND f.project_id = ?';
      params.push(project_id);
    }
    if (faculty_id) {
      sql += ' AND f.to_user_id = ?';
      params.push(faculty_id);
    }
    if (feedback_type) {
      sql += ' AND f.feedback_type = ?';
      params.push(feedback_type);
    }

    sql += ' ORDER BY f.submitted_at DESC';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [feedback] = await pool.query(sql, params);

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Error getting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback',
      error: error.message
    });
  }
};

/**
 * Get feedback analytics
 */
export const getFeedbackAnalytics = async (req, res) => {
  try {
    const { faculty_id, project_id, start_date, end_date } = req.query;

    let sql = `
      SELECT 
        AVG(rating_overall) as avg_overall_rating,
        AVG(rating_professionalism) as avg_professionalism,
        AVG(rating_content_relevance) as avg_content_relevance,
        AVG(rating_communication) as avg_communication,
        COUNT(*) as total_feedback
      FROM feedback
      WHERE rating_overall IS NOT NULL
    `;
    const params = [];

    if (faculty_id) {
      sql += ' AND to_user_id = ?';
      params.push(faculty_id);
    }
    if (project_id) {
      sql += ' AND project_id = ?';
      params.push(project_id);
    }
    if (start_date) {
      sql += ' AND DATE(submitted_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(submitted_at) <= ?';
      params.push(end_date);
    }

    const [analytics] = await pool.query(sql, params);

    res.json({
      success: true,
      data: analytics[0] || {
        avg_overall_rating: 0,
        avg_professionalism: 0,
        avg_content_relevance: 0,
        avg_communication: 0,
        total_feedback: 0
      }
    });
  } catch (error) {
    logger.error('Error getting feedback analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback analytics',
      error: error.message
    });
  }
};

/**
 * Update faculty rating based on feedback
 */
async function updateFacultyRating(facultyId) {
  try {
    const [feedback] = await pool.query(
      `SELECT AVG(rating_overall) as avg_rating, COUNT(*) as count
       FROM feedback
       WHERE to_user_id = ? AND rating_overall IS NOT NULL`,
      [facultyId]
    );

    if (feedback[0] && feedback[0].count > 0) {
      await pool.query(
        `UPDATE faculty_profiles
         SET rating = ?, total_ratings = ?
         WHERE faculty_id = ?`,
        [feedback[0].avg_rating, feedback[0].count, facultyId]
      );
    }
  } catch (error) {
    logger.error('Error updating faculty rating:', error);
  }
}

