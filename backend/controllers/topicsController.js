import { pool } from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// ============================================================
// TOPICS COVERED CONTROLLER
// ============================================================

/**
 * Add topics covered
 */
export const addTopicsCovered = async (req, res) => {
  try {
    const { session_id, topics } = req.body; // topics: [{topic_name, duration_minutes, description, attachments}]
    const userId = req.user.id;

    if (!session_id || !topics || !Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        message: 'session_id and topics array are required'
      });
    }

    // Verify session exists
    const [sessions] = await pool.query('SELECT * FROM sessions WHERE id = ?', [session_id]);
    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is the faculty for this session
    if (req.user.role !== 'super-admin' && sessions[0].faculty_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned faculty can add topics covered'
      });
    }

    const addedTopics = [];

    for (const topic of topics) {
      const topicId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO topics_covered (
          id, session_id, topic_name, duration_minutes,
          description, attachments, covered_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          topicId, session_id, topic.topic_name, topic.duration_minutes || 0,
          topic.description || null,
          topic.attachments ? JSON.stringify(topic.attachments) : null,
          userId
        ]
      );
      addedTopics.push({ id: topicId, topic_name: topic.topic_name });
    }

    res.status(201).json({
      success: true,
      message: `Added ${addedTopics.length} topics`,
      data: addedTopics
    });
  } catch (error) {
    logger.error('Error adding topics covered:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add topics covered',
      error: error.message
    });
  }
};

/**
 * Get topics for a session
 */
export const getSessionTopics = async (req, res) => {
  try {
    const { id } = req.params;

    const [topics] = await pool.query(
      `SELECT tc.*, u.name as covered_by_name
       FROM topics_covered tc
       LEFT JOIN users u ON tc.covered_by = u.id
       WHERE tc.session_id = ?
       ORDER BY tc.covered_at ASC`,
      [id]
    );

    // Parse attachments JSON
    topics.forEach(topic => {
      if (topic.attachments) {
        try {
          topic.attachments = JSON.parse(topic.attachments);
        } catch (e) {
          topic.attachments = [];
        }
      }
    });

    res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    logger.error('Error getting session topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session topics',
      error: error.message
    });
  }
};

/**
 * Get topics for a project
 */
export const getProjectTopics = async (req, res) => {
  try {
    const { id } = req.params;

    const [topics] = await pool.query(
      `SELECT tc.*, s.title as session_title, s.start_time,
       u.name as covered_by_name
       FROM topics_covered tc
       LEFT JOIN sessions s ON tc.session_id = s.id
       LEFT JOIN users u ON tc.covered_by = u.id
       WHERE s.project_id = ?
       ORDER BY s.start_time ASC, tc.covered_at ASC`,
      [id]
    );

    // Parse attachments JSON
    topics.forEach(topic => {
      if (topic.attachments) {
        try {
          topic.attachments = JSON.parse(topic.attachments);
        } catch (e) {
          topic.attachments = [];
        }
      }
    });

    res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    logger.error('Error getting project topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project topics',
      error: error.message
    });
  }
};

/**
 * Update topics covered
 */
export const updateTopicsCovered = async (req, res) => {
  try {
    const { id } = req.params;
    const { topic_name, duration_minutes, description, attachments } = req.body;

    // Get topic
    const [topics] = await pool.query('SELECT * FROM topics_covered WHERE id = ?', [id]);
    if (topics.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Check permission
    if (req.user.role !== 'super-admin' && topics[0].covered_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update topics you covered'
      });
    }

    const updates = [];
    const params = [];

    if (topic_name !== undefined) {
      updates.push('topic_name = ?');
      params.push(topic_name);
    }
    if (duration_minutes !== undefined) {
      updates.push('duration_minutes = ?');
      params.push(duration_minutes);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (attachments !== undefined) {
      updates.push('attachments = ?');
      params.push(JSON.stringify(attachments));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    await pool.query(
      `UPDATE topics_covered SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Topic updated successfully'
    });
  } catch (error) {
    logger.error('Error updating topics covered:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update topics covered',
      error: error.message
    });
  }
};

