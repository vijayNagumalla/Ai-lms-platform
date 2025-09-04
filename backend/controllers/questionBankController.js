import { pool } from '../config/database.js';
import crypto from 'crypto';

// =====================================================
// QUESTION CATEGORIES MANAGEMENT
// =====================================================

// Create question category
export const createQuestionCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      parent_id,
      color,
      icon
    } = req.body;

    const created_by = req.user.id;
    const college_id = req.user.college_id;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category name already exists for this college
    const [existing] = await pool.execute(
      'SELECT id FROM question_categories WHERE name = ? AND college_id = ?',
      [name, college_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    // Insert category - ensure all parameters are properly handled
    const [result] = await pool.execute(
      `INSERT INTO question_categories (
        name, description, parent_id, color, icon, created_by, college_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        description || null, 
        parent_id || null, 
        color || '#3B82F6', 
        icon || null, 
        created_by, 
        college_id || null
      ]
    );

    // Since we're using UUIDs, we need to get the created category by name and created_by
    const [categories] = await pool.execute(
      'SELECT * FROM question_categories WHERE name = ? AND created_by = ? ORDER BY created_at DESC LIMIT 1',
      [name, created_by]
    );

    res.status(201).json({
      success: true,
      message: 'Question category created successfully',
      data: categories[0]
    });
  } catch (error) {
    console.error('Create question category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get question categories
export const getQuestionCategories = async (req, res) => {
  try {
    const { parent_id, include_questions } = req.query;
    const conditions = [];
    const params = [];

    // Role-based filtering
    if (req.user.role === 'college-admin') {
      conditions.push('college_id = ?');
      params.push(req.user.college_id);
    } else if (req.user.role === 'faculty') {
      conditions.push('(college_id = ? OR is_public = TRUE)');
      params.push(req.user.college_id);
    }

    if (parent_id) {
      conditions.push('parent_id = ?');
      params.push(parent_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get categories
    const [categories] = await pool.execute(
      `SELECT 
        qc.*,
        u.name as creator_name,
        (SELECT COUNT(*) FROM question_categories WHERE parent_id = qc.id) as subcategory_count,
        (SELECT COUNT(*) FROM questions WHERE category_id = qc.id OR subcategory_id = qc.id) as question_count
      FROM question_categories qc
      LEFT JOIN users u ON qc.created_by = u.id
      ${whereClause}
      ORDER BY qc.name`,
      params
    );

    // Include questions if requested
    if (include_questions === 'true') {
      for (let category of categories) {
        const [questions] = await pool.execute(
          'SELECT id, title, question_type, difficulty_level FROM questions WHERE category_id = ? AND status = "active"',
          [category.id]
        );
        category.questions = questions;
      }
    }

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get question categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update question category
export const updateQuestionCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id, color, icon } = req.body;

    // Check if category exists and user has permission
    const [categories] = await pool.execute(
      'SELECT * FROM question_categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question category not found'
      });
    }

    const category = categories[0];

    // Check permissions
    if (req.user.role !== 'super-admin' && 
        category.created_by !== req.user.id &&
        (req.user.role === 'college-admin' && category.college_id !== req.user.college_id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this category'
      });
    }

    // Update category
    const [result] = await pool.execute(
      `UPDATE question_categories SET
        name = ?, description = ?, parent_id = ?, color = ?, icon = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [name, description, parent_id, color, icon, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question category not found'
      });
    }

    // Get updated category
    const [updatedCategories] = await pool.execute(
      'SELECT * FROM question_categories WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Question category updated successfully',
      data: updatedCategories[0]
    });
  } catch (error) {
    console.error('Update question category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete question category
export const deleteQuestionCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists and user has permission
    const [categories] = await pool.execute(
      'SELECT * FROM question_categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question category not found'
      });
    }

    const category = categories[0];

    // Check permissions
    if (req.user.role !== 'super-admin' && 
        category.created_by !== req.user.id &&
        (req.user.role === 'college-admin' && category.college_id !== req.user.college_id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this category'
      });
    }

    // Check if category has questions
    const [questions] = await pool.execute(
      'SELECT COUNT(*) as count FROM questions WHERE category_id = ?',
      [id]
    );

    if (questions[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing questions. Move or delete the questions first.'
      });
    }

    // Check if category has subcategories
    const [subcategories] = await pool.execute(
      'SELECT COUNT(*) as count FROM question_categories WHERE parent_id = ?',
      [id]
    );

    if (subcategories[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Delete subcategories first.'
      });
    }

    // Delete category
    await pool.execute('DELETE FROM question_categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Question category deleted successfully'
    });
  } catch (error) {
    console.error('Delete question category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// =====================================================
// QUESTION TAGS MANAGEMENT
// =====================================================

// Create question tag
export const createQuestionTag = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const created_by = req.user.id;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    // Check if tag already exists
    const [existing] = await pool.execute(
      'SELECT id FROM question_tags WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tag name already exists'
      });
    }

    // Insert tag - ensure all parameters are properly handled
    const [result] = await pool.execute(
      'INSERT INTO question_tags (name, description, color, created_by) VALUES (?, ?, ?, ?)',
      [name, description || null, color || '#6B7280', created_by]
    );

    // Since we're using UUIDs, we need to get the created tag by name and created_by
    const [tags] = await pool.execute(
      'SELECT * FROM question_tags WHERE name = ? AND created_by = ? ORDER BY created_at DESC LIMIT 1',
      [name, created_by]
    );

    res.status(201).json({
      success: true,
      message: 'Question tag created successfully',
      data: tags[0]
    });
  } catch (error) {
    console.error('Create question tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get question tags
export const getQuestionTags = async (req, res) => {
  try {
    const [tags] = await pool.execute(
      `SELECT 
        qt.*,
        u.name as creator_name,
        (SELECT COUNT(*) FROM questions WHERE JSON_CONTAINS(tags, CONCAT('"', qt.name, '"'))) as usage_count
      FROM question_tags qt
      LEFT JOIN users u ON qt.created_by = u.id
      ORDER BY qt.name`
    );

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Get question tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// =====================================================
// QUESTIONS MANAGEMENT
// =====================================================

// Create question
export const createQuestion = async (req, res) => {
  try {
    const {
      title,
      content,
      question_type,
      difficulty_level,
      points,
      time_limit_seconds,
      category_id,
      subcategory_id,
      status,
      tags,
      options,
      correct_answer,
      correct_answers,
      explanation,
      hints,
      metadata,
      // Advanced fields
      acceptable_answers, // short answer
      rubric, // essay
      coding_details, // coding
      blanks // fill in the blanks
    } = req.body;

    const created_by = req.user.id;
    const college_id = req.user.college_id;
    const department = req.user.department;

    // Validate required fields
    if (!content || !question_type) {
      return res.status(400).json({
        success: false,
        message: 'Content and question type are required'
      });
    }

    // Title is mandatory only for coding questions
    if (question_type === 'coding' && (!title || !title.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Title is required for coding questions'
      });
    }

    let _options = options;
    let _correct_answer = correct_answer;
    let _correct_answers = correct_answers;
    let _metadata = metadata || {};

    // Handle both singular and plural correct answer fields
    if (correct_answers && Array.isArray(correct_answers)) {
      _correct_answers = correct_answers;
      // For single choice and true/false, use the first answer as correct_answer
      if (question_type === 'single_choice' || question_type === 'true_false') {
        _correct_answer = correct_answers[0];
      }
    }

    // Type-specific validation and mapping
    switch (question_type) {
      case 'multiple_choice':
        if (!_options || !Array.isArray(_options) || _options.length < 2) {
          return res.status(400).json({ success: false, message: 'Multiple choice questions require at least 2 options' });
        }
        if (!_correct_answers || !Array.isArray(_correct_answers) || _correct_answers.length === 0) {
          return res.status(400).json({ success: false, message: 'Correct answers are required for multiple choice questions' });
        }
        break;
      case 'single_choice':
        if (!_options || !Array.isArray(_options) || _options.length < 2) {
          return res.status(400).json({ success: false, message: 'Single choice questions require at least 2 options' });
        }
        if (!_correct_answer && (!_correct_answers || !Array.isArray(_correct_answers) || _correct_answers.length === 0)) {
          return res.status(400).json({ success: false, message: 'Correct answer is required for single choice questions' });
        }
        break;
      case 'true_false':
        if (_correct_answer !== 'true' && _correct_answer !== 'false') {
          return res.status(400).json({ success: false, message: 'Correct answer must be true or false for True/False questions' });
        }
        _options = ['True', 'False'];
        break;
      case 'short_answer':
        if (!acceptable_answers || !Array.isArray(acceptable_answers) || acceptable_answers.length === 0) {
          return res.status(400).json({ success: false, message: 'Short answer questions require at least one acceptable answer' });
        }
        _correct_answers = acceptable_answers;
        break;
      case 'essay':
        if (!rubric) {
          return res.status(400).json({ success: false, message: 'Essay questions require a rubric/guidelines' });
        }
        _metadata = { ..._metadata, rubric };
        break;
      case 'coding':
        if (!coding_details) {
          return res.status(400).json({ success: false, message: 'Coding details are required for coding questions' });
        }
        
        // Check for multi-language structure (starter_codes, solution_codes)
        const hasStarterCode = coding_details.starter_codes && 
          Object.keys(coding_details.starter_codes).length > 0 && 
          Object.values(coding_details.starter_codes).some(code => code && code.trim());
        
        const hasSolutionCode = coding_details.solution_codes && 
          Object.keys(coding_details.solution_codes).length > 0 && 
          Object.values(coding_details.solution_codes).some(code => code && code.trim());
        
        // Check for single-language structure (starter_code, solution_code) - legacy support
        const hasLegacyStarterCode = coding_details.starter_code && coding_details.starter_code.trim();
        const hasLegacySolutionCode = coding_details.solution_code && coding_details.solution_code.trim();
        
        if (!hasStarterCode && !hasLegacyStarterCode) {
          return res.status(400).json({ success: false, message: 'Coding questions require starter code for at least one language' });
        }
        
        if (!hasSolutionCode && !hasLegacySolutionCode) {
          return res.status(400).json({ success: false, message: 'Coding questions require solution code for at least one language' });
        }
        
        if (!Array.isArray(coding_details.test_cases) || coding_details.test_cases.length === 0) {
          return res.status(400).json({ success: false, message: 'Coding questions require at least one test case' });
        }
        
        _metadata = { ..._metadata, ...coding_details };
        break;
      case 'fill_blanks':
        if (!blanks || !Array.isArray(blanks) || blanks.length === 0) {
          return res.status(400).json({ success: false, message: 'Fill in the blanks questions require at least one blank' });
        }
        _correct_answers = blanks;
        break;
      // Add more types as needed
    }

    // Log user and insert values for debugging
    console.log('User:', req.user);
    console.log('Insert values:', {
      title, content, question_type, difficulty_level, points,
      time_limit_seconds: time_limit_seconds || null,
      category_id: category_id || null,
      tags: JSON.stringify(tags || []),
      options: JSON.stringify(_options || []),
      correct_answer: JSON.stringify(_correct_answer || null),
      explanation: explanation || null,
      hints: JSON.stringify(hints || []),
      metadata: JSON.stringify(_metadata || {}),
      created_by, college_id: college_id || null, department: department || null
    });
    // Insert question
    const [result] = await pool.execute(
      `INSERT INTO questions (
        title, content, question_type, difficulty_level, points,
        time_limit_seconds, category_id, subcategory_id, status, tags, options, correct_answer, correct_answers,
        explanation, hints, metadata, created_by, college_id, department
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, content, question_type, difficulty_level, points,
        time_limit_seconds || null, category_id || null, subcategory_id || null, status || 'draft', JSON.stringify(tags || []),
        JSON.stringify(_options || []), JSON.stringify(_correct_answer || null), JSON.stringify(_correct_answers || null),
        explanation || null, JSON.stringify(hints || []), JSON.stringify(_metadata || {}),
        created_by, college_id || null, department || null
      ]
    );

    // Since we're using UUIDs, we need to get the created question by content and created_by
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE content = ? AND created_by = ? ORDER BY created_at DESC LIMIT 1',
      [content, created_by]
    );

    if (questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve created question'
      });
    }

    const questionId = questions[0].id;

    // If coding, insert into coding_questions table for each language
    if (question_type === 'coding' && coding_details) {
      const languages = coding_details.languages || [];
      
      // If no languages specified, try to get from starter_codes or solution_codes
      if (languages.length === 0) {
        if (coding_details.starter_codes) {
          languages.push(...Object.keys(coding_details.starter_codes));
        }
        if (coding_details.solution_codes) {
          languages.push(...Object.keys(coding_details.solution_codes));
        }
        // Remove duplicates
        const uniqueLanguages = [...new Set(languages)];
        languages.length = 0;
        languages.push(...uniqueLanguages);
      }
      
      // If still no languages, use default
      if (languages.length === 0) {
        languages.push('javascript');
      }
      
      for (const language of languages) {
        const starterCode = coding_details.starter_codes?.[language] || coding_details.starter_code || '';
        const solutionCode = coding_details.solution_codes?.[language] || coding_details.solution_code || '';
        
        // Generate UUID for coding_questions id
        const codingQuestionId = crypto.randomUUID();
        
        await pool.execute(
          `INSERT INTO coding_questions (
            id, question_id, language, starter_code, solution_code, test_cases, time_limit, memory_limit, difficulty, category, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            codingQuestionId,
            questionId,
            language,
            starterCode,
            solutionCode,
            JSON.stringify(coding_details.test_cases || []),
            coding_details.time_limit || 1000,
            coding_details.memory_limit || 256,
            coding_details.difficulty || 'medium',
            coding_details.category || null,
            JSON.stringify(coding_details.tags || [])
          ]
        );
      }
    }

    // Parse and return all fields
    let q = questions[0];
    q.tags = (typeof q.tags === 'string' && q.tags.trim().length > 0) ? JSON.parse(q.tags) : [];
    q.options = (typeof q.options === 'string' && q.options.trim().length > 0) ? JSON.parse(q.options) : null;
    q.correct_answer = (typeof q.correct_answer === 'string' && q.correct_answer.trim().length > 0) ? JSON.parse(q.correct_answer) : null;
    q.correct_answers = (typeof q.correct_answers === 'string' && q.correct_answers.trim().length > 0) ? JSON.parse(q.correct_answers) : null;
    q.hints = (typeof q.hints === 'string' && q.hints.trim().length > 0) ? JSON.parse(q.hints) : [];
    q.metadata = (typeof q.metadata === 'string' && q.metadata.trim().length > 0) ? JSON.parse(q.metadata) : {};

    // If coding, add coding_details
    if (question_type === 'coding') {
      const [codingRows] = await pool.execute('SELECT * FROM coding_questions WHERE question_id = ?', [questionId]);
      if (codingRows.length > 0) {
        // Convert to multi-language structure
        q.coding_details = {
          languages: codingRows.map(row => row.language),
          starter_codes: {},
          solution_codes: {},
          test_cases: codingRows[0] ? (typeof codingRows[0].test_cases === 'string' ? JSON.parse(codingRows[0].test_cases) : codingRows[0].test_cases) : [],
          time_limit: codingRows[0]?.time_limit || 1000,
          memory_limit: codingRows[0]?.memory_limit || 256,
          difficulty: codingRows[0]?.difficulty || 'medium',
          category: codingRows[0]?.category || null,
          tags: codingRows[0] ? (typeof codingRows[0].tags === 'string' ? JSON.parse(codingRows[0].tags) : codingRows[0].tags) : []
        };
        
        // Populate starter_codes and solution_codes for each language
        codingRows.forEach(row => {
          q.coding_details.starter_codes[row.language] = row.starter_code || '';
          q.coding_details.solution_codes[row.language] = row.solution_code || '';
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: q
    });
  } catch (error) {
    console.error('Create question error:', error);
    if (error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: error.stack
    });
  }
};

// Get questions with advanced filtering
export const getQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      question_type,
      difficulty_level,
      category_id,
      tags,
      status,
      created_by,
      college_id,
      department,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    // Build WHERE conditions
    if (search) {
      conditions.push('(q.title LIKE ? OR q.content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (question_type) {
      conditions.push('q.question_type = ?');
      params.push(question_type);
    }

    if (difficulty_level) {
      conditions.push('q.difficulty_level = ?');
      params.push(difficulty_level);
    }

    if (category_id) {
      conditions.push('(q.category_id = ? OR q.subcategory_id = ?)');
      params.push(category_id, category_id);
    }

    if (tags) {
      const tagArray = tags.split(',');
      const tagConditions = tagArray.map(() => 'JSON_CONTAINS(q.tags, ?)');
      conditions.push(`(${tagConditions.join(' OR ')})`);
      params.push(...tagArray.map(tag => `"${tag}"`));
    }

    if (status && status !== 'all') {
      conditions.push('q.status = ?');
      params.push(status);
    }

    if (created_by) {
      conditions.push('q.created_by = ?');
      params.push(created_by);
    }

    if (college_id) {
      conditions.push('q.college_id = ?');
      params.push(college_id);
    }

    if (department) {
      conditions.push('q.department = ?');
      params.push(department);
    }

    // Role-based filtering
    if (req.user.role === 'super-admin') {
      // Super admin can see all questions
      // No additional conditions needed
    } else if (req.user.role === 'college-admin') {
      conditions.push('(q.college_id = ? OR q.is_public = TRUE)');
      params.push(req.user.college_id);
    } else if (req.user.role === 'faculty') {
      conditions.push('(q.college_id = ? OR q.created_by = ? OR q.is_public = TRUE)');
      params.push(req.user.college_id, req.user.id);
    } else {
      // For other roles (like students), show only public questions
      conditions.push('q.is_public = TRUE');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'difficulty_level', 'usage_count', 'average_score'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM questions q ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // Get questions with pagination
    const [questions] = await pool.query(
      `SELECT 
        q.*,
        u.name as creator_name,
        u.email as creator_email,
        qc.name as category_name,
        qc.color as category_color
      FROM questions q
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN question_categories qc ON q.category_id = qc.id
      ${whereClause}
      ORDER BY q.${sortField} ${sortOrder}
      LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    // Parse JSON fields (MySQL2 driver may have already parsed them)
    questions.forEach(q => {
      try {
        q.tags = q.tags ? (typeof q.tags === 'string' ? JSON.parse(q.tags) : q.tags) : [];
      } catch (e) {
        console.warn('Failed to parse tags for question', q.id, e.message);
        q.tags = [];
      }
      
      try {
        q.options = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null;
      } catch (e) {
        console.warn('Failed to parse options for question', q.id, e.message);
        q.options = null;
      }
      
      try {
        q.correct_answer = q.correct_answer ? (typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : q.correct_answer) : null;
      } catch (e) {
        console.warn('Failed to parse correct_answer for question', q.id, e.message);
        q.correct_answer = null;
      }
      
      try {
        q.correct_answers = q.correct_answers ? (typeof q.correct_answers === 'string' ? JSON.parse(q.correct_answers) : q.correct_answers) : null;
      } catch (e) {
        console.warn('Failed to parse correct_answers for question', q.id, e.message);
        q.correct_answers = null;
      }
      
      try {
        q.hints = q.hints ? (typeof q.hints === 'string' ? JSON.parse(q.hints) : q.hints) : [];
      } catch (e) {
        console.warn('Failed to parse hints for question', q.id, e.message);
        q.hints = [];
      }
      
      try {
        q.metadata = q.metadata ? (typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata) : {};
      } catch (e) {
        console.warn('Failed to parse metadata for question', q.id, e.message);
        q.metadata = {};
      }
      
      try {
        q.coding_details = q.coding_details ? (typeof q.coding_details === 'string' ? JSON.parse(q.coding_details) : q.coding_details) : null;
      } catch (e) {
        console.warn('Failed to parse coding_details for question', q.id, e.message);
        q.coding_details = null;
      }
      
      try {
        q.blanks = q.blanks ? (typeof q.blanks === 'string' ? JSON.parse(q.blanks) : q.blanks) : null;
      } catch (e) {
        console.warn('Failed to parse blanks for question', q.id, e.message);
        q.blanks = null;
      }
    });

    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get question by ID
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [questions] = await pool.execute(
      `SELECT 
        q.*,
        u.name as creator_name,
        u.email as creator_email,
        qc.name as category_name,
        qc.color as category_color
      FROM questions q
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN question_categories qc ON q.category_id = qc.id
      WHERE q.id = ?`,
      [id]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const question = questions[0];

    // Parse JSON fields (MySQL2 driver may have already parsed them)
    question.tags = question.tags ? (typeof question.tags === 'string' ? JSON.parse(question.tags) : question.tags) : [];
    question.options = question.options ? (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) : null;
    question.correct_answer = question.correct_answer ? (typeof question.correct_answer === 'string' ? JSON.parse(question.correct_answer) : question.correct_answer) : null;
    question.correct_answers = question.correct_answers ? (typeof question.correct_answers === 'string' ? JSON.parse(question.correct_answers) : question.correct_answers) : null;
    question.hints = question.hints ? (typeof question.hints === 'string' ? JSON.parse(question.hints) : question.hints) : [];
    question.metadata = question.metadata ? (typeof question.metadata === 'string' ? JSON.parse(question.metadata) : question.metadata) : {};

    // If coding question, fetch coding details from coding_questions table
    if (question.question_type === 'coding') {
      const [codingRows] = await pool.execute('SELECT * FROM coding_questions WHERE question_id = ?', [id]);
      if (codingRows.length > 0) {
        // Convert to multi-language structure
        question.coding_details = {
          languages: codingRows.map(row => row.language),
          starter_codes: {},
          solution_codes: {},
          test_cases: codingRows[0] ? (typeof codingRows[0].test_cases === 'string' ? JSON.parse(codingRows[0].test_cases) : codingRows[0].test_cases) : [],
          time_limit: codingRows[0]?.time_limit || 1000,
          memory_limit: codingRows[0]?.memory_limit || 256,
          difficulty: codingRows[0]?.difficulty || 'medium',
          category: codingRows[0]?.category || null,
          tags: codingRows[0] ? (typeof codingRows[0].tags === 'string' ? JSON.parse(codingRows[0].tags) : codingRows[0].tags) : []
        };
        
        // Populate starter_codes and solution_codes for each language
        codingRows.forEach(row => {
          question.coding_details.starter_codes[row.language] = row.starter_code || '';
          question.coding_details.solution_codes[row.language] = row.solution_code || '';
        });
      } else {
        // Fallback to metadata if no coding_questions entries found
        question.coding_details = question.metadata || {
          languages: [],
          starter_codes: {},
          solution_codes: {},
          test_cases: []
        };
      }
    }

    // Get attachments
    const [attachments] = await pool.execute(
      'SELECT * FROM question_attachments WHERE question_id = ?',
      [id]
    );

    question.attachments = attachments;

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Get question by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update question
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      question_type,
      difficulty_level,
      points,
      time_limit_seconds,
      category_id,
      subcategory_id,
      tags,
      options,
      correct_answer,
      correct_answers,
      explanation,
      hints,
      metadata,
      status,
      // Advanced fields
      acceptable_answers, // short answer
      rubric, // essay
      coding_details, // coding
      blanks // fill in the blanks
    } = req.body;

    // Check if question exists and user has permission
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE id = ?',
      [id]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const question = questions[0];

    // Check permissions
    if (req.user.role !== 'super-admin' && 
        question.created_by !== req.user.id &&
        (req.user.role === 'college-admin' && question.college_id !== req.user.college_id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this question'
      });
    }

    // Validate coding questions if question_type is being updated to coding or if it's already coding
    if ((question_type === 'coding' || question.question_type === 'coding') && coding_details) {
      // Check for multi-language structure (starter_codes, solution_codes)
      const hasStarterCode = coding_details.starter_codes && 
        Object.keys(coding_details.starter_codes).length > 0 && 
        Object.values(coding_details.starter_codes).some(code => code && code.trim());
      
      const hasSolutionCode = coding_details.solution_codes && 
        Object.keys(coding_details.solution_codes).length > 0 && 
        Object.values(coding_details.solution_codes).some(code => code && code.trim());
      
      // Check for single-language structure (starter_code, solution_code) - legacy support
      const hasLegacyStarterCode = coding_details.starter_code && coding_details.starter_code.trim();
      const hasLegacySolutionCode = coding_details.solution_code && coding_details.solution_code.trim();
      
      if (!hasStarterCode && !hasLegacyStarterCode) {
        return res.status(400).json({ success: false, message: 'Coding questions require starter code for at least one language' });
      }
      
      if (!hasSolutionCode && !hasLegacySolutionCode) {
        return res.status(400).json({ success: false, message: 'Coding questions require solution code for at least one language' });
      }
      
      if (!Array.isArray(coding_details.test_cases) || coding_details.test_cases.length === 0) {
        return res.status(400).json({ success: false, message: 'Coding questions require at least one test case' });
      }
    }

    // Build dynamic UPDATE query based on provided fields
    const updateFields = [];
    const updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }
    if (question_type !== undefined) {
      updateFields.push('question_type = ?');
      updateValues.push(question_type);
    }
    if (difficulty_level !== undefined) {
      updateFields.push('difficulty_level = ?');
      updateValues.push(difficulty_level);
    }
    if (points !== undefined) {
      updateFields.push('points = ?');
      updateValues.push(points);
    }
    if (time_limit_seconds !== undefined) {
      updateFields.push('time_limit_seconds = ?');
      updateValues.push(time_limit_seconds);
    }
    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateValues.push(category_id);
    }
    if (subcategory_id !== undefined) {
      updateFields.push('subcategory_id = ?');
      updateValues.push(subcategory_id);
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(tags));
    }
    if (options !== undefined) {
      updateFields.push('options = ?');
      updateValues.push(JSON.stringify(options));
    }
    if (correct_answer !== undefined) {
      updateFields.push('correct_answer = ?');
      updateValues.push(JSON.stringify(correct_answer));
    }
    if (correct_answers !== undefined) {
      updateFields.push('correct_answers = ?');
      updateValues.push(JSON.stringify(correct_answers));
    }
    if (explanation !== undefined) {
      updateFields.push('explanation = ?');
      updateValues.push(explanation);
    }
    if (hints !== undefined) {
      updateFields.push('hints = ?');
      updateValues.push(JSON.stringify(hints));
    }
    if (metadata !== undefined) {
      updateFields.push('metadata = ?');
      updateValues.push(JSON.stringify(metadata));
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    // Handle coding_details by merging with metadata
    if (coding_details !== undefined) {
      const currentMetadata = metadata || question.metadata || {};
      const updatedMetadata = { ...currentMetadata, ...coding_details };
      updateFields.push('metadata = ?');
      updateValues.push(JSON.stringify(updatedMetadata));
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Add the WHERE clause parameter
    updateValues.push(id);
    
    // Execute the dynamic UPDATE query
    const [result] = await pool.execute(
      `UPDATE questions SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // If coding details were provided, update coding_questions table
    if (coding_details !== undefined) {
      // Delete existing coding entries for this question
      await pool.execute('DELETE FROM coding_questions WHERE question_id = ?', [id]);
      
      // Insert new coding entries for each language
      const languages = coding_details.languages || [];
      
      // If no languages specified, try to get from starter_codes or solution_codes
      if (languages.length === 0) {
        if (coding_details.starter_codes) {
          languages.push(...Object.keys(coding_details.starter_codes));
        }
        if (coding_details.solution_codes) {
          languages.push(...Object.keys(coding_details.solution_codes));
        }
        // Remove duplicates
        const uniqueLanguages = [...new Set(languages)];
        languages.length = 0;
        languages.push(...uniqueLanguages);
      }
      
      // If still no languages, use default
      if (languages.length === 0) {
        languages.push('javascript');
      }
      
      for (const language of languages) {
        const starterCode = coding_details.starter_codes?.[language] || coding_details.starter_code || '';
        const solutionCode = coding_details.solution_codes?.[language] || coding_details.solution_code || '';
        
        // Generate UUID for coding_questions id
        const codingQuestionId = crypto.randomUUID();
        
        await pool.execute(
          `INSERT INTO coding_questions (
            id, question_id, language, starter_code, solution_code, test_cases, time_limit, memory_limit, difficulty, category, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            codingQuestionId,
            id,
            language,
            starterCode,
            solutionCode,
            JSON.stringify(coding_details.test_cases || []),
            coding_details.time_limit || 1000,
            coding_details.memory_limit || 256,
            coding_details.difficulty || 'medium',
            coding_details.category || null,
            JSON.stringify(coding_details.tags || [])
          ]
        );
      }
    }

    // Get updated question
    const [updatedQuestions] = await pool.execute(
      'SELECT * FROM questions WHERE id = ?',
      [id]
    );

    // Parse JSON fields for the response
    let updatedQuestion = updatedQuestions[0];
    updatedQuestion.tags = (typeof updatedQuestion.tags === 'string' && updatedQuestion.tags.trim().length > 0) ? JSON.parse(updatedQuestion.tags) : [];
    updatedQuestion.options = (typeof updatedQuestion.options === 'string' && updatedQuestion.options.trim().length > 0) ? JSON.parse(updatedQuestion.options) : null;
    updatedQuestion.correct_answer = (typeof updatedQuestion.correct_answer === 'string' && updatedQuestion.correct_answer.trim().length > 0) ? JSON.parse(updatedQuestion.correct_answer) : null;
    updatedQuestion.correct_answers = (typeof updatedQuestion.correct_answers === 'string' && updatedQuestion.correct_answers.trim().length > 0) ? JSON.parse(updatedQuestion.correct_answers) : null;
    updatedQuestion.hints = (typeof updatedQuestion.hints === 'string' && updatedQuestion.hints.trim().length > 0) ? JSON.parse(updatedQuestion.hints) : [];
    updatedQuestion.metadata = (typeof updatedQuestion.metadata === 'string' && updatedQuestion.metadata.trim().length > 0) ? JSON.parse(updatedQuestion.metadata) : {};

    // If coding, add coding_details
    if (updatedQuestion.question_type === 'coding') {
      const [codingRows] = await pool.execute('SELECT * FROM coding_questions WHERE question_id = ?', [id]);
      if (codingRows.length > 0) {
        // Convert to multi-language structure
        updatedQuestion.coding_details = {
          languages: codingRows.map(row => row.language),
          starter_codes: {},
          solution_codes: {},
          test_cases: codingRows[0] ? (typeof codingRows[0].test_cases === 'string' ? JSON.parse(codingRows[0].test_cases) : codingRows[0].test_cases) : [],
          time_limit: codingRows[0]?.time_limit || 1000,
          memory_limit: codingRows[0]?.memory_limit || 256,
          difficulty: codingRows[0]?.difficulty || 'medium',
          category: codingRows[0]?.category || null,
          tags: codingRows[0] ? (typeof codingRows[0].tags === 'string' ? JSON.parse(codingRows[0].tags) : codingRows[0].tags) : []
        };
        
        // Populate starter_codes and solution_codes for each language
        codingRows.forEach(row => {
          updatedQuestion.coding_details.starter_codes[row.language] = row.starter_code || '';
          updatedQuestion.coding_details.solution_codes[row.language] = row.solution_code || '';
        });
      }
    }

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete question
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if question exists and user has permission
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE id = ?',
      [id]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const question = questions[0];

    // Check permissions
    if (req.user.role !== 'super-admin' && 
        question.created_by !== req.user.id &&
        (req.user.role === 'college-admin' && question.college_id !== req.user.college_id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this question'
      });
    }

    // Check if question is used in assessments
    const [usage] = await pool.execute(
      'SELECT COUNT(*) as count FROM assessment_questions WHERE question_id = ?',
      [id]
    );

    if (usage[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete question that is used in assessments. Archive it instead.'
      });
    }

    // Delete question (cascade will handle attachments)
    await pool.execute('DELETE FROM questions WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// =====================================================
// QUESTION ATTACHMENTS
// =====================================================

// Upload question attachment
export const uploadQuestionAttachment = async (req, res) => {
  try {
    const { question_id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if question exists and user has permission
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE id = ?',
      [question_id]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const question = questions[0];

    // Check permissions
    if (req.user.role !== 'super-admin' && 
        question.created_by !== req.user.id &&
        (req.user.role === 'college-admin' && question.college_id !== req.user.college_id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload attachments for this question'
      });
    }

    // Save attachment record
    const [result] = await pool.execute(
      `INSERT INTO question_attachments (
        question_id, file_name, file_path, file_type, file_size, mime_type
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        question_id, file.originalname, file.path, file.mimetype,
        file.size, file.mimetype
      ]
    );

    const attachmentId = result.insertId;

    // Get the created attachment
    const [attachments] = await pool.execute(
      'SELECT * FROM question_attachments WHERE id = ?',
      [attachmentId]
    );

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: attachments[0]
    });
  } catch (error) {
    console.error('Upload question attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete question attachment
export const deleteQuestionAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if attachment exists
    const [attachments] = await pool.execute(
      `SELECT qa.*, q.created_by, q.college_id 
       FROM question_attachments qa
       LEFT JOIN questions q ON qa.question_id = q.id
       WHERE qa.id = ?`,
      [id]
    );

    if (attachments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    const attachment = attachments[0];

    // Check permissions
    if (req.user.role !== 'super-admin' && 
        attachment.created_by !== req.user.id &&
        (req.user.role === 'college-admin' && attachment.college_id !== req.user.college_id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this attachment'
      });
    }

    // Delete attachment
    await pool.execute('DELETE FROM question_attachments WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Delete question attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// =====================================================
// QUESTION ANALYTICS
// =====================================================

// Get question analytics
export const getQuestionAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if question exists and user has permission
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE id = ?',
      [id]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const question = questions[0];

    // Check permissions
    if (req.user.role !== 'super-admin' && 
        question.created_by !== req.user.id &&
        (req.user.role === 'college-admin' && question.college_id !== req.user.college_id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view analytics for this question'
      });
    }

    // Get question analytics
    const [analytics] = await pool.execute(
      `SELECT 
        qa.total_attempts,
        qa.correct_attempts,
        qa.average_time_seconds,
        qa.difficulty_index,
        qa.discrimination_index,
        qa.usage_count,
        qa.last_used
      FROM question_analytics qa
      WHERE qa.question_id = ?`,
      [id]
    );

    // Get usage in assessments
    const [assessmentUsage] = await pool.execute(
      `SELECT 
        at.id,
        at.title,
        COUNT(aq.id) as usage_count
      FROM assessment_templates at
      INNER JOIN assessment_questions aq ON at.id = aq.assessment_id
      WHERE aq.question_id = ?
      GROUP BY at.id`,
      [id]
    );

    // Get recent performance
    const [recentPerformance] = await pool.execute(
      `SELECT 
        sa.is_correct,
        sa.points_earned,
        sa.time_spent_seconds,
        aa.created_at
      FROM student_answers sa
      INNER JOIN assessment_attempts aa ON sa.attempt_id = aa.id
      WHERE sa.question_id = ? AND aa.status = 'graded'
      ORDER BY aa.created_at DESC
      LIMIT 50`,
      [id]
    );

    const analyticsData = {
      question_id: id,
      analytics: analytics[0] || {
        total_attempts: 0,
        correct_attempts: 0,
        average_time_seconds: 0,
        difficulty_index: 0,
        discrimination_index: 0,
        usage_count: 0
      },
      assessment_usage: assessmentUsage,
      recent_performance: recentPerformance
    };

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Get question analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};