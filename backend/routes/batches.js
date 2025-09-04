import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import * as batchController from '../controllers/collegeController.js';

const router = express.Router();

// Batch management routes
router.post('/', authenticateToken, authorizeRoles('super-admin', 'college-admin'), batchController.createBatch);
router.get('/', authenticateToken, batchController.getBatches);
router.put('/:batchId', authenticateToken, authorizeRoles('super-admin', 'college-admin'), batchController.updateBatch);
router.delete('/:batchId', authenticateToken, authorizeRoles('super-admin', 'college-admin'), batchController.deleteBatch);

export default router;



