import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  // Question Categories
  createQuestionCategory,
  getQuestionCategories,
  updateQuestionCategory,
  deleteQuestionCategory,
  
  // Question Tags
  createQuestionTag,
  getQuestionTags,
  
  // Questions
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  
  // Question Attachments
  uploadQuestionAttachment,
  deleteQuestionAttachment,
  
  // Question Analytics
  getQuestionAnalytics
} from '../controllers/questionBankController.js';

const router = express.Router();

// =====================================================
// QUESTION CATEGORIES ROUTES
// =====================================================

// Create question category (Admin, Faculty)
router.post('/categories', authenticateToken, createQuestionCategory);

// Get question categories (All authenticated users)
router.get('/categories', authenticateToken, getQuestionCategories);

// Update question category (Admin, Faculty - owner)
router.put('/categories/:id', authenticateToken, updateQuestionCategory);

// Delete question category (Admin, Faculty - owner)
router.delete('/categories/:id', authenticateToken, deleteQuestionCategory);

// =====================================================
// QUESTION TAGS ROUTES
// =====================================================

// Create question tag (Admin, Faculty)
router.post('/tags', authenticateToken, createQuestionTag);

// Get question tags (All authenticated users)
router.get('/tags', authenticateToken, getQuestionTags);

// =====================================================
// QUESTIONS ROUTES
// =====================================================

// Create question (Admin, Faculty)
router.post('/questions', authenticateToken, createQuestion);

// Get questions with filtering (All authenticated users)
router.get('/questions', authenticateToken, getQuestions);

// Get question by ID (All authenticated users)
router.get('/questions/:id', authenticateToken, getQuestionById);

// Update question (Admin, Faculty - owner)
router.put('/questions/:id', authenticateToken, updateQuestion);

// Delete question (Admin, Faculty - owner)
router.delete('/questions/:id', authenticateToken, deleteQuestion);

// =====================================================
// QUESTION ATTACHMENTS ROUTES
// =====================================================

// Upload question attachment (Admin, Faculty - owner)
router.post('/questions/:question_id/attachments', authenticateToken, uploadQuestionAttachment);

// Delete question attachment (Admin, Faculty - owner)
router.delete('/attachments/:id', authenticateToken, deleteQuestionAttachment);

// =====================================================
// QUESTION ANALYTICS ROUTES
// =====================================================

// Get question analytics (Admin, Faculty - owner)
router.get('/questions/:id/analytics', authenticateToken, getQuestionAnalytics);

export default router; 