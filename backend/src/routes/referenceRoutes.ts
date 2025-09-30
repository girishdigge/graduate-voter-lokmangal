import { Router } from 'express';
import {
  addReferences,
  getReferences,
  updateReferenceStatusController,
  getAllReferences,
} from '../controllers/referenceController.js';
import {
  authenticateUser,
  authenticateAdmin,
  requireOwnership,
} from '../middleware/auth.js';
import { strictLimiter, generalLimiter } from '../config/rateLimiter.js';

const router = Router();

// User reference routes (require user authentication)
router.post(
  '/:userId',
  strictLimiter,
  authenticateUser,
  requireOwnership,
  addReferences
);

router.get('/:userId', authenticateUser, requireOwnership, getReferences);

// Admin reference routes (require admin authentication)
router.get('/admin/all', generalLimiter, authenticateAdmin, getAllReferences);

router.put(
  '/admin/:referenceId/status',
  generalLimiter,
  authenticateAdmin,
  updateReferenceStatusController
);

export default router;
