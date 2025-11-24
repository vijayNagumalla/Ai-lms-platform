import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { validateCSRFToken } from '../middleware/csrf.js';
import { requestSizeLimit } from '../middleware/requestSizeLimit.js';
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
  getQuestionAnalytics,
  
  // Bulk Upload
  downloadQuestionTemplate,
  previewBulkUploadQuestions,
  bulkUploadQuestions
} from '../controllers/questionBankController.js';

const router = express.Router();

// CRITICAL FIX: Configure multer for file uploads with size limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for regular uploads
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Separate multer config for bulk upload (larger file size)
const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for bulk uploads
  },
  fileFilter: (req, file, cb) => {
    // Only allow Excel files for bulk upload
    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed for bulk upload'), false);
    }
  }
});

// =====================================================
// QUESTION CATEGORIES ROUTES
// =====================================================

// Create question category (Admin, Faculty)
router.post('/categories', authenticateToken, validateCSRFToken, createQuestionCategory);

// Get question categories (All authenticated users)
router.get('/categories', authenticateToken, getQuestionCategories);

// Update question category (Admin, Faculty - owner)
router.put('/categories/:id', authenticateToken, validateCSRFToken, updateQuestionCategory);

// Delete question category (Admin, Faculty - owner)
router.delete('/categories/:id', authenticateToken, validateCSRFToken, deleteQuestionCategory);

// =====================================================
// QUESTION TAGS ROUTES
// =====================================================

// Create question tag (Admin, Faculty)
router.post('/tags', authenticateToken, validateCSRFToken, createQuestionTag);

// Get question tags (All authenticated users)
router.get('/tags', authenticateToken, getQuestionTags);

// =====================================================
// QUESTIONS ROUTES
// =====================================================

// Create question (Admin, Faculty)
router.post('/questions', authenticateToken, validateCSRFToken, createQuestion);

// Get questions with filtering (All authenticated users)
router.get('/questions', authenticateToken, getQuestions);

// Get question by ID (All authenticated users)
router.get('/questions/:id', authenticateToken, getQuestionById);

// Update question (Admin, Faculty - owner)
router.put('/questions/:id', authenticateToken, validateCSRFToken, updateQuestion);

// Delete question (Admin, Faculty - owner)
router.delete('/questions/:id', authenticateToken, validateCSRFToken, deleteQuestion);

// =====================================================
// QUESTION ATTACHMENTS ROUTES
// =====================================================

// Upload question attachment (Admin, Faculty - owner)
// CRITICAL FIX: Add request size validation and file upload middleware
router.post('/questions/:question_id/attachments', 
  authenticateToken, 
  validateCSRFToken, 
  requestSizeLimit('10mb'),
  upload.single('file'),
  uploadQuestionAttachment
);

// Delete question attachment (Admin, Faculty - owner)
router.delete('/attachments/:id', authenticateToken, validateCSRFToken, deleteQuestionAttachment);

// =====================================================
// QUESTION ANALYTICS ROUTES
// =====================================================

// Get question analytics (Admin, Faculty - owner)
router.get('/questions/:id/analytics', authenticateToken, getQuestionAnalytics);

// =====================================================
// BULK UPLOAD ROUTES
// =====================================================

// Download question template (Admin, Faculty)
router.get('/questions/template/:type', authenticateToken, downloadQuestionTemplate);

// Preview bulk upload questions (Admin, Faculty) - Parse and return preview without inserting
router.post('/questions/bulk-upload/preview',
  authenticateToken,
  validateCSRFToken,
  requestSizeLimit('50mb'),
  bulkUpload.single('file'),
  previewBulkUploadQuestions
);

// Bulk upload questions (Admin, Faculty) - After confirmation
router.post('/questions/bulk-upload',
  authenticateToken,
  validateCSRFToken,
  requestSizeLimit('50mb'),
  bulkUpload.single('file'),
  bulkUploadQuestions
);

export default router; 