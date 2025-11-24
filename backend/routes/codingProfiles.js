import express from 'express';
import {
  getCodingPlatforms,
  getAllStudentsCodingProfiles,
  getStudentCodingProfiles,
  getStudentPlatformStatistics, // New function
  getStudentCachedPlatformStatistics, // New cached function
  addCodingProfile,
  updateCodingProfile,
  updateStudentCodingProfile,
  syncCodingProfile,
  syncAllProfiles,
  deleteCodingProfile,
  deleteAllStudentProfiles,
  fetchPlatformStatistics,
  fetchBatchPlatformStatistics,
  getCachedPlatformStatistics,
  getCachedBatchPlatformStatistics,
  getCodingProfileAnalytics
} from '../controllers/codingProfileController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validateCSRFToken } from '../middleware/csrf.js';

const router = express.Router();

// Public routes
router.get('/platforms', getCodingPlatforms);

// Protected routes
router.use(authenticateToken);

// Student routes
router.get('/my-profiles', getStudentCodingProfiles);
router.get('/my-statistics', getStudentPlatformStatistics); // New endpoint for students
router.get('/my-statistics/cached', getStudentCachedPlatformStatistics); // Cached version
router.post('/profiles', validateCSRFToken, addCodingProfile);
router.put('/profiles/:profileId', validateCSRFToken, updateCodingProfile);
router.post('/profiles/:profileId/sync', validateCSRFToken, syncCodingProfile);
router.post('/sync-all', validateCSRFToken, syncAllProfiles); // Fixed route to match frontend
router.delete('/profiles/:profileId', validateCSRFToken, deleteCodingProfile);

// SuperAdmin routes
router.get('/students', requireRole(['super-admin']), getAllStudentsCodingProfiles);
router.get('/student/:studentId/statistics', requireRole(['super-admin']), fetchPlatformStatistics);
router.get('/student/:studentId/statistics/cached', requireRole(['super-admin']), getCachedPlatformStatistics);
router.post('/students/batch-statistics', requireRole(['super-admin']), validateCSRFToken, fetchBatchPlatformStatistics);
router.get('/students/batch-statistics/:batchId/cached', requireRole(['super-admin']), getCachedBatchPlatformStatistics);
router.put('/student/:studentId/profiles/:profileId', requireRole(['super-admin']), validateCSRFToken, updateStudentCodingProfile);
router.delete('/student/:studentId', requireRole(['super-admin']), validateCSRFToken, deleteAllStudentProfiles);
router.get('/analytics', requireRole(['super-admin']), getCodingProfileAnalytics);

export default router;
