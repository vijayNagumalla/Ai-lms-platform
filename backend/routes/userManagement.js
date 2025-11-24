import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateCSRFToken } from '../middleware/csrf.js';
import {
  getUserById,
  listUsers,
  addUser,
  editUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  changeUserPassword,
  downloadTemplate,
  bulkUploadUsers,
  updateStudentYears,
  getStudents,
  searchUsers
} from '../controllers/userManagementController.js';

const router = express.Router();

// CRITICAL FIX: All routes require authentication
router.use(authenticateToken);

// List users
router.get('/', listUsers);

// Search users
router.get('/search', searchUsers);
// Get students for assignment
router.get('/students', getStudents);
// Download Excel template
router.get('/template/:type', downloadTemplate);
// Get user by ID
router.get('/:userId', getUserById);
// Add user
router.post('/', authenticateToken, validateCSRFToken, addUser);
// Edit user
router.put('/:userId', authenticateToken, validateCSRFToken, editUser);
// Delete user
router.delete('/:userId', authenticateToken, validateCSRFToken, deleteUser);
// Toggle user status
router.patch('/:userId/toggle-status', authenticateToken, validateCSRFToken, toggleUserStatus);
// Reset user password
router.patch('/:userId/reset-password', authenticateToken, validateCSRFToken, resetUserPassword);
// Change user password (Super Admin only)
router.patch('/:userId/change-password', authenticateToken, validateCSRFToken, changeUserPassword);
// Bulk upload users
router.post('/bulk-upload', authenticateToken, validateCSRFToken, bulkUploadUsers);
// Update student years (Super Admin only)
router.post('/update-student-years', authenticateToken, validateCSRFToken, updateStudentYears);

export default router; 