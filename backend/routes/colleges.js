import express from 'express';
import * as collegeController from '../controllers/collegeController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes below require authentication and super-admin or college-admin role
// Adjust as needed for your app's access control

// Get all colleges (super admin)
router.get('/', authenticateToken, authorizeRoles('super-admin'), collegeController.getAllColleges);

// Get college locations for filtering
router.get('/locations', authenticateToken, authorizeRoles('super-admin'), collegeController.getCollegeLocations);

// Get single college by ID
router.get('/:collegeId', authenticateToken, authorizeRoles('super-admin', 'college-admin'), collegeController.getCollegeById);

// Create new college
router.post('/', authenticateToken, authorizeRoles('super-admin'), collegeController.createCollege);

// Update college
router.put('/:collegeId', authenticateToken, authorizeRoles('super-admin'), collegeController.updateCollege);

// Delete college (HARD DELETE by default - removes data from database)
router.delete('/:collegeId', authenticateToken, authorizeRoles('super-admin'), collegeController.deleteCollege);

// Soft delete college (mark as inactive but keep data)
router.delete('/:collegeId/soft', authenticateToken, authorizeRoles('super-admin'), collegeController.softDeleteCollege);

// Restore deleted college
router.patch('/:collegeId/restore', authenticateToken, authorizeRoles('super-admin'), collegeController.restoreCollege);

// Get deleted colleges
router.get('/deleted/list', authenticateToken, authorizeRoles('super-admin'), collegeController.getDeletedColleges);

// Get college deletion status and dependencies
router.get('/:collegeId/deletion-status', authenticateToken, authorizeRoles('super-admin'), collegeController.getCollegeDeletionStatus);

// Get college stats
router.get('/:collegeId/stats', authenticateToken, authorizeRoles('super-admin', 'college-admin'), collegeController.getCollegeStats);

// Department routes
// Get departments for a specific college
router.get('/:collegeId/departments', authenticateToken, authorizeRoles('super-admin', 'college-admin'), collegeController.getCollegeDepartments);

// Get departments for multiple colleges
router.post('/departments/batch', authenticateToken, authorizeRoles('super-admin'), collegeController.getDepartmentsForColleges);

// Get batches for multiple colleges
router.post('/batches/batch', authenticateToken, authorizeRoles('super-admin'), collegeController.getBatchesForColleges);

// Get common departments for dropdown
router.get('/departments/common', authenticateToken, authorizeRoles('super-admin'), collegeController.getCommonDepartments);

export default router; 