import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateCSRFToken } from '../middleware/csrf.js';
import {
  getDashboardStats
} from '../controllers/superAdminController.js';
import {
  getAllColleges,
  getCollegeById,
  getCollegeDetails,
  createCollege,
  updateCollege,
  deleteCollege,
  getCollegeStats,
  getCollegeLocations,
  getCommonDepartments,
  getCollegeDepartments,
  getCollegeBatches,
  restoreCollege,
  getDeletedColleges,
  getCollegeDeletionStatus
} from '../controllers/collegeController.js';

import {
  listUsers,
  getUserById,
  addUser,
  editUser,
  deleteUser,
  toggleUserStatus,
  downloadTemplate,
  bulkUploadUsers
} from '../controllers/userManagementController.js';

const router = express.Router();

// All routes require super admin authentication
router.use(authenticateToken);
router.use(authorizeRoles('super-admin'));

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// College management routes
router.get('/colleges', getAllColleges);
router.get('/colleges/locations', getCollegeLocations);
router.get('/colleges/departments/common', getCommonDepartments);
router.get('/colleges/:collegeId/details', getCollegeDetails);
router.get('/colleges/:collegeId/departments', getCollegeDepartments);
router.get('/colleges/:collegeId/batches', getCollegeBatches);
router.get('/colleges/:collegeId/stats', getCollegeStats);
router.get('/colleges/:collegeId', getCollegeById);
router.post('/colleges', validateCSRFToken, createCollege);
router.put('/colleges/:collegeId', validateCSRFToken, updateCollege);
router.delete('/colleges/:collegeId', validateCSRFToken, deleteCollege);

// Enhanced college management routes
router.patch('/colleges/:collegeId/restore', validateCSRFToken, restoreCollege);
router.get('/colleges/deleted/list', getDeletedColleges);
router.get('/colleges/:collegeId/deletion-status', getCollegeDeletionStatus);

// User management routes
router.get('/users', listUsers);
router.get('/users/:userId', getUserById);
router.post('/users', validateCSRFToken, addUser);
router.put('/users/:userId', validateCSRFToken, editUser);
router.delete('/users/:userId', validateCSRFToken, deleteUser);
router.patch('/users/:userId/toggle-status', validateCSRFToken, toggleUserStatus);
router.get('/users/template/student', downloadTemplate);
router.post('/users/bulk-upload', validateCSRFToken, bulkUploadUsers);

export default router; 