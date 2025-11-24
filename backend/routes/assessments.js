import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateCSRFToken } from '../middleware/csrf.js';
import {
  // Assessment Templates
  createAssessmentTemplate,
  getAssessmentTemplates,
  getAssessmentTemplateById,
  updateAssessmentTemplate,
  deleteAssessmentTemplate,
  
  // Assessment Sections
  createAssessmentSection,
  updateAssessmentSection,
  deleteAssessmentSection,
  
  // Assessment Questions
  addQuestionToAssessment,
  removeQuestionFromAssessment,
  reorderAssessmentQuestions,
  
  // Assessment Assignments
  createAssessmentAssignment,
  getAssessmentAssignments,
  deleteAssessmentAssignment,
  
  // Question Selection Helpers
  getQuestionsForSelection,
  calculateAssessmentPoints,
  
  // Email Notifications
  sendAssessmentNotifications,
  sendAssessmentReminder,
  
  // Student Assessment Functions
  getAssessmentQuestions,
  getAssessmentQuestionsForAdmin,
  getAssessmentSubmission,
  saveAssessmentProgress,
  submitAssessment,
  getAssessmentResults,
  getStudentAttemptInfo,
  getAssessmentAttemptsHistory,
  startAssessmentAttempt,
  
  // Assessment Instances Functions
  getAssessmentInstances,
  createAssessmentInstance,
  
  // Debug Functions
  debugAssessmentData,
  debugUpdateAssignmentDates,
  
  // Assessment Copying Functions
  assignAssessmentToStudents,
  sendAssessmentReminders,
  
  // Retake Assessment Function
  retakeAssessment
} from '../controllers/assessmentController.js';

const router = express.Router();

// =====================================================
// ASSESSMENT TEMPLATES ROUTES
// =====================================================

// Create assessment template (Admin, Faculty)
router.post('/templates', authenticateToken, validateCSRFToken, createAssessmentTemplate);

// Get all assessment templates with filtering and pagination
router.get('/templates', authenticateToken, getAssessmentTemplates);

// Get assessment template by ID with full details
router.get('/templates/:id', authenticateToken, getAssessmentTemplateById);

// Update assessment template
router.put('/templates/:id', authenticateToken, validateCSRFToken, updateAssessmentTemplate);

// Delete assessment template
router.delete('/templates/:id', authenticateToken, validateCSRFToken, deleteAssessmentTemplate);

// =====================================================
// ASSESSMENT SECTIONS ROUTES
// =====================================================

// Create assessment section
router.post('/templates/:assessment_id/sections', authenticateToken, validateCSRFToken, createAssessmentSection);

// Update assessment section
router.put('/templates/:assessment_id/sections/:section_id', authenticateToken, validateCSRFToken, updateAssessmentSection);

// Delete assessment section
router.delete('/templates/:assessment_id/sections/:section_id', authenticateToken, validateCSRFToken, deleteAssessmentSection);

// =====================================================
// ASSESSMENT QUESTIONS ROUTES
// =====================================================

// Add question to assessment
router.post('/templates/:assessment_id/questions', authenticateToken, validateCSRFToken, addQuestionToAssessment);

// Remove question from assessment
router.delete('/templates/:assessment_id/questions/:question_id', authenticateToken, validateCSRFToken, removeQuestionFromAssessment);

// Reorder assessment questions
router.put('/templates/:assessment_id/questions/reorder', authenticateToken, validateCSRFToken, reorderAssessmentQuestions);

// =====================================================
// ASSESSMENT ASSIGNMENTS ROUTES
// =====================================================

// Create assessment assignment
router.post('/templates/:assessment_id/assignments', authenticateToken, validateCSRFToken, createAssessmentAssignment);

// Get assessment assignments
router.get('/templates/:assessment_id/assignments', authenticateToken, getAssessmentAssignments);

// Delete assessment assignment
router.delete('/templates/:assessment_id/assignments/:assignment_id', authenticateToken, validateCSRFToken, deleteAssessmentAssignment);

// =====================================================
// QUESTION SELECTION HELPERS
// =====================================================

// Get questions for selection (filtered by type, category, etc.)
router.get('/questions/selection', authenticateToken, getQuestionsForSelection);

// Calculate total points for assessment
router.get('/templates/:assessment_id/points', authenticateToken, calculateAssessmentPoints);

// =====================================================
// EMAIL NOTIFICATIONS
// =====================================================

// Send email notifications for assessment assignment
router.post('/notifications/send', authenticateToken, validateCSRFToken, sendAssessmentNotifications);

// Send reminder emails for an assessment
router.post('/notifications/reminder/:assessment_id', authenticateToken, validateCSRFToken, sendAssessmentReminder);

// =====================================================
// STUDENT ASSESSMENT ROUTES
// =====================================================

// Get assessment questions for student
router.get('/:assessment_id/questions', authenticateToken, getAssessmentQuestions);

// Get assessment questions for admin (for copying)
router.get('/:assessment_id/questions/admin', authenticateToken, getAssessmentQuestionsForAdmin);

// Get student's assessment submission
router.get('/:assessment_id/submissions/:student_id', authenticateToken, getAssessmentSubmission);

// Save assessment progress (auto-save)
router.post('/:assessment_id/save-progress', authenticateToken, validateCSRFToken, saveAssessmentProgress);

// Start assessment attempt
router.post('/:assessment_id/attempts/start', authenticateToken, validateCSRFToken, startAssessmentAttempt);

// Submit assessment
router.post('/:assessment_id/submit', authenticateToken, validateCSRFToken, submitAssessment);

// Retake assessment
router.post('/:assessment_id/retake', authenticateToken, validateCSRFToken, retakeAssessment);

// Get student's attempt information for an assessment
router.get('/:assessment_id/attempt-info', authenticateToken, getStudentAttemptInfo);

// Get assessment attempts history
router.get('/:assessment_id/attempts-history', authenticateToken, getAssessmentAttemptsHistory);

// Get assessment results
router.get('/:assessment_id/results/:student_id', authenticateToken, getAssessmentResults);

// =====================================================
// ASSESSMENT INSTANCES ROUTES
// =====================================================

// Get assessment instances for student
router.get('/instances', authenticateToken, getAssessmentInstances);

// Create assessment instance
router.post('/instances', authenticateToken, validateCSRFToken, createAssessmentInstance);

// =====================================================
// ASSESSMENT COPYING ROUTES
// =====================================================

// Assign assessment to students
router.post('/:assessmentId/assign', authenticateToken, validateCSRFToken, assignAssessmentToStudents);

// Send assessment reminders
router.post('/reminders', authenticateToken, validateCSRFToken, sendAssessmentReminders);

// =====================================================
// DEBUG ROUTES
// =====================================================

// Debug endpoint to check assessment data
router.get('/debug/:assessment_id', authenticateToken, debugAssessmentData);

// Debug endpoint to manually update assignment dates
router.post('/debug/:assessment_id/update-dates', authenticateToken, validateCSRFToken, debugUpdateAssignmentDates);

export default router; 