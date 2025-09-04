import express from 'express';
import {
  getCodingPlatforms,
  getUserCodingProfiles,
  upsertCodingProfile,
  fetchCodingProfileData,
  getUserCodingProgress,
  bulkUploadCodingProfiles,
  getAllCodingProfiles,
  deleteCodingProfile,
  checkPlatformHealth,
  bulkRefreshCodingProfiles,
  streamingBulkRefresh,
  testProfileFetch
} from '../controllers/codingProfilesController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/platforms', getCodingPlatforms);
router.get('/health', checkPlatformHealth);
router.get('/test/:platformId/:username', testProfileFetch);

// Protected routes (authentication required)
router.use(authenticateToken);

// Student routes
router.get('/user/:userId', getUserCodingProfiles);
router.get('/user/:userId/progress', getUserCodingProgress);
router.post('/profile', upsertCodingProfile);
router.get('/profile/:userId/:platformId/fetch', fetchCodingProfileData);

// Super Admin routes
router.get('/admin/all', requireRole(['super_admin', 'super-admin']), getAllCodingProfiles);
router.post('/admin/bulk-upload', requireRole(['super_admin', 'super-admin']), bulkUploadCodingProfiles);
router.post('/admin/bulk-refresh', requireRole(['super_admin', 'super-admin']), bulkRefreshCodingProfiles);
router.post('/admin/streaming-refresh', requireRole(['super_admin', 'super-admin']), streamingBulkRefresh);
router.delete('/admin/profile/:profileId', requireRole(['super_admin', 'super-admin']), deleteCodingProfile);

export default router;

