import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateCSRFToken } from '../middleware/csrf.js';
import * as batchController from '../controllers/collegeController.js';

const router = express.Router();

// Batch management routes
router.post('/', authenticateToken, authorizeRoles('super-admin', 'college-admin'), validateCSRFToken, batchController.createBatch);
router.get('/', authenticateToken, batchController.getBatches);
router.put('/:batchId', authenticateToken, authorizeRoles('super-admin', 'college-admin'), validateCSRFToken, batchController.updateBatch);
router.delete('/:batchId', authenticateToken, authorizeRoles('super-admin', 'college-admin'), validateCSRFToken, batchController.deleteBatch);

export default router;



