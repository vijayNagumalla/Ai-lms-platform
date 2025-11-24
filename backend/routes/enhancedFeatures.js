import express from 'express';
import {
  // Attendance Management
  getAttendanceSessions,
  createAttendanceSession,
  markAttendance,
  getAttendanceRecords,
  
  // Course Management
  getCourses,
  createCourse,
  
  // Class Scheduling
  getClasses,
  getClassSchedules,
  
  // Faculty Status Management
  getFacultyStatus,
  updateFacultyStatus,
  getFacultyAvailability,
  getFacultyWorkload,
  
  // General
  getRooms,
  getDepartments
} from '../controllers/enhancedFeaturesController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCSRFToken } from '../middleware/csrf.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Attendance Management Routes
router.get('/attendance/sessions', getAttendanceSessions);
router.post('/attendance/sessions', validateCSRFToken, createAttendanceSession);
router.post('/attendance/mark', validateCSRFToken, markAttendance);
router.get('/attendance/sessions/:sessionId/records', getAttendanceRecords);

// Course Management Routes
router.get('/courses', getCourses);
router.post('/courses', validateCSRFToken, createCourse);

// Class Scheduling Routes
router.get('/classes', getClasses);
router.get('/schedules', getClassSchedules);

// Faculty Status Management Routes
router.get('/faculty/status', getFacultyStatus);
router.put('/faculty/status', validateCSRFToken, updateFacultyStatus);
router.get('/faculty/availability', getFacultyAvailability);
router.get('/faculty/workload', getFacultyWorkload);

// General Routes
router.get('/rooms', getRooms);
router.get('/departments', getDepartments);

export default router;

