import express from 'express';
import {
  getAnalyticsData,
  getCollegesForAnalytics,
  getDepartmentsForAnalytics,
  getStudentsForAnalytics,
  exportAnalyticsData,
  testAnalyticsConnection,
  // New course analytics endpoints
  getCourseAnalyticsData,
  getFacultyForAnalytics,
  getAssessmentTypes,
  getCourseCategories,
  // Save view functionality
  saveAnalyticsView,
  getSavedAnalyticsViews,
  getSavedAnalyticsView,
  // Chart annotations
  addChartAnnotation,
  getChartAnnotations,
  // Assessment details
  getAssessmentDetails,
  // Student submissions
  getAssessmentStudentSubmissions
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Test connection
router.get('/test', testAnalyticsConnection);

// Assessment analytics
router.get('/data', getAnalyticsData);
router.get('/assessment/:assessmentId', getAssessmentDetails);
router.get('/assessment/:assessmentId/submissions', getAssessmentStudentSubmissions);



// Course analytics
router.get('/course-data', getCourseAnalyticsData);

// Filter data endpoints
router.get('/colleges', getCollegesForAnalytics);
router.get('/departments', getDepartmentsForAnalytics);
router.get('/students', getStudentsForAnalytics);
router.get('/faculty', getFacultyForAnalytics);
router.get('/assessment-types', getAssessmentTypes);
router.get('/course-categories', getCourseCategories);

// Export functionality
router.post('/export', exportAnalyticsData);

// Save view functionality
router.post('/views', saveAnalyticsView);
router.get('/views', getSavedAnalyticsViews);
router.get('/views/:viewId', getSavedAnalyticsView);

// Chart annotations
router.post('/annotations', addChartAnnotation);
router.get('/annotations', getChartAnnotations);

export default router; 