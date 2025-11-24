import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectStatus,
  addDepartmentsToProject,
  addBatchesToProject
} from '../controllers/projectManagementController.js';
import {
  allocateFaculty,
  getProjectFaculty,
  replaceFaculty,
  getRecommendedTrainers,
  getFacultyProfile,
  updateFacultyProfile,
  checkFacultyAvailability
} from '../controllers/facultyAllocationController.js';
import {
  createSession,
  getSessions,
  autoGenerateSchedule,
  checkConflicts,
  exportSessionsToExcel
} from '../controllers/schedulingController.js';
import {
  markAttendance,
  getSessionAttendance,
  bulkUploadAttendance,
  getAttendanceReports,
  getStudentAttendanceSummary
} from '../controllers/attendanceController.js';
import {
  submitFeedback,
  getFeedback,
  getFeedbackAnalytics
} from '../controllers/feedbackController.js';
import {
  addTopicsCovered,
  getSessionTopics,
  getProjectTopics,
  updateTopicsCovered
} from '../controllers/topicsController.js';
import {
  generateInvoice,
  getInvoices
} from '../controllers/invoiceController.js';
import {
  getCalendarEvents,
  getDayView,
  getWeekView,
  getMonthView
} from '../controllers/calendarController.js';
import {
  allocateAdmin,
  getProjectAdmins,
  removeAdminAllocation,
  getAdminWorkload
} from '../controllers/adminAllocationController.js';
import {
  getProjectProgressReport,
  getTrainerUtilizationReport,
  getCollegeAttendanceReport,
  getInvoiceSummaryReport
} from '../controllers/reportsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================================
// PROJECT ROUTES
// ============================================================
router.post('/projects', authorizeRoles('super-admin'), createProject);
router.get('/projects', getProjects);
router.get('/projects/:id', getProjectById);
router.put('/projects/:id', authorizeRoles('super-admin'), updateProject);
router.delete('/projects/:id', authorizeRoles('super-admin'), deleteProject);
router.patch('/projects/:id/status', authorizeRoles('super-admin'), updateProjectStatus);
router.post('/projects/:id/departments', authorizeRoles('super-admin'), addDepartmentsToProject);
router.post('/projects/:id/batches', authorizeRoles('super-admin'), addBatchesToProject);

// ============================================================
// FACULTY ALLOCATION ROUTES
// ============================================================
router.post('/projects/:id/faculty', authorizeRoles('super-admin'), allocateFaculty);
router.get('/projects/:id/faculty', getProjectFaculty);
router.post('/faculty-allocations/:allocation_id/replace', authorizeRoles('super-admin'), replaceFaculty);
router.get('/faculty/recommendations', authorizeRoles('super-admin'), getRecommendedTrainers);
router.get('/faculty/:id/profile', getFacultyProfile);
router.put('/faculty/:id/profile', authorizeRoles('super-admin', 'faculty'), updateFacultyProfile);
router.get('/faculty/:id/availability', checkFacultyAvailability);

// ============================================================
// SESSION/SCHEDULING ROUTES
// ============================================================
router.post('/sessions', authorizeRoles('super-admin'), createSession);
router.get('/sessions', getSessions);
router.post('/sessions/auto-generate', authorizeRoles('super-admin'), autoGenerateSchedule);
router.get('/sessions/conflicts', checkConflicts);
router.get('/sessions/export', exportSessionsToExcel);

// ============================================================
// ATTENDANCE ROUTES
// ============================================================
router.post('/attendance', authorizeRoles('super-admin', 'faculty'), markAttendance);
router.get('/attendance/session/:id', getSessionAttendance);
router.post('/attendance/bulk-upload', authorizeRoles('super-admin', 'faculty'), bulkUploadAttendance);
router.get('/attendance/reports', getAttendanceReports);
router.get('/attendance/student/:student_id/summary', getStudentAttendanceSummary);

// ============================================================
// FEEDBACK ROUTES
// ============================================================
router.post('/feedback', submitFeedback);
router.get('/feedback', getFeedback);
router.get('/feedback/analytics', getFeedbackAnalytics);

// ============================================================
// TOPICS COVERED ROUTES
// ============================================================
router.post('/topics-covered', authorizeRoles('super-admin', 'faculty'), addTopicsCovered);
router.get('/topics-covered/session/:id', getSessionTopics);
router.get('/topics-covered/project/:id', getProjectTopics);
router.put('/topics-covered/:id', authorizeRoles('super-admin', 'faculty'), updateTopicsCovered);

// ============================================================
// INVOICE ROUTES
// ============================================================
router.post('/invoices/generate', authorizeRoles('super-admin'), generateInvoice);
router.get('/invoices', getInvoices);
router.get('/invoices/faculty/:id', getInvoices);

// ============================================================
// CALENDAR ROUTES
// ============================================================
router.get('/calendar', getCalendarEvents);
router.get('/calendar/day/:date', getDayView);
router.get('/calendar/week/:date', getWeekView);
router.get('/calendar/month/:date', getMonthView);

// ============================================================
// ADMIN ALLOCATION ROUTES
// ============================================================
router.post('/admin-allocations', authorizeRoles('super-admin'), allocateAdmin);
router.get('/projects/:id/admins', getProjectAdmins);
router.delete('/admin-allocations/:id', authorizeRoles('super-admin'), removeAdminAllocation);
router.get('/admin/workload', getAdminWorkload);

// ============================================================
// REPORTS & ANALYTICS ROUTES
// ============================================================
router.get('/reports/project-progress', getProjectProgressReport);
router.get('/reports/trainer-utilization', getTrainerUtilizationReport);
router.get('/reports/college-attendance', getCollegeAttendanceReport);
router.get('/reports/invoice-summary', getInvoiceSummaryReport);

export default router;

