import express from 'express';
import multer from 'multer';
import {
  generateBulkUploadTemplate,
  processBulkUpload,
  bulkSyncProfiles,
  getBulkUploadStats
} from '../controllers/bulkUploadController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validateCSRFToken } from '../middleware/csrf.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is Excel format
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  }
});

// Protected routes
router.use(authenticateToken);

// SuperAdmin only routes
router.get('/template', requireRole(['super-admin']), generateBulkUploadTemplate);
router.post('/upload', requireRole(['super-admin']), validateCSRFToken, upload.single('file'), processBulkUpload);
router.post('/sync', requireRole(['super-admin']), validateCSRFToken, bulkSyncProfiles);
router.get('/stats', requireRole(['super-admin']), getBulkUploadStats);

export default router;
