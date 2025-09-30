import { Router } from 'express';
import {
  checkAadhar,
  validateAadharInput,
} from '../controllers/aadharController.js';
import { aadharCheckLimiter } from '../config/rateLimiter.js';

const router = Router();

/**
 * POST /api/aadhar/check
 * Check if Aadhar number exists in the system
 *
 * Rate limited to prevent abuse
 * Validates Aadhar format and checks database
 * Returns user info if exists, or indicates new user
 */
router.post(
  '/check',
  aadharCheckLimiter, // Apply Aadhar-specific rate limiting (8 requests per 15 minutes)
  validateAadharInput, // Validate and sanitize input
  checkAadhar // Main controller logic
);

export default router;
