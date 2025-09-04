import express from 'express';
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
  getStudents
} from '../controllers/userManagementController.js';

const router = express.Router();

// List users
router.get('/', listUsers);
// Get students for assignment
router.get('/students', getStudents);
// Get user by ID
router.get('/:userId', getUserById);
// Add user
router.post('/', addUser);
// Edit user
router.put('/:userId', editUser);
// Delete user
router.delete('/:userId', deleteUser);
// Toggle user status
router.patch('/:userId/toggle-status', toggleUserStatus);
// Reset user password
router.patch('/:userId/reset-password', resetUserPassword);
// Change user password (Super Admin only)
router.patch('/:userId/change-password', changeUserPassword);
// Download Excel template
router.get('/template/:type', downloadTemplate);
// Bulk upload users
router.post('/bulk-upload', bulkUploadUsers);
// Update student years (Super Admin only)
router.post('/update-student-years', updateStudentYears);

export default router; 