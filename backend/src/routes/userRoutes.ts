import { Router } from 'express';
import {
  enrollUser,
  validateEnrollmentInput,
  getUserProfile,
  updateUserProfile,
  getUserByIdController,
  updateUserByIdController,
  getUserDocumentsController,
  refreshUserTokenController,
} from '../controllers/userController.js';
import { authenticateUser } from '../middleware/auth.js';
import { generalLimiter } from '../config/rateLimiter.js';

const router = Router();

/**
 * POST /api/users/enroll
 * Create new user enrollment
 *
 * Public endpoint with rate limiting
 * Validates comprehensive user input and creates new voter record
 * Returns user data and authentication token
 */
router.post(
  '/enroll',
  generalLimiter, // Apply general rate limiting
  validateEnrollmentInput, // Validate and sanitize enrollment data
  enrollUser // Main enrollment logic
);

/**
 * GET /api/users/profile
 * Get current authenticated user's profile
 *
 * Requires user authentication
 * Returns complete user information for the authenticated user
 */
router.get(
  '/profile',
  authenticateUser, // Require user authentication
  getUserProfile // Get user profile
);

/**
 * PUT /api/users/profile
 * Update current authenticated user's profile
 *
 * Requires user authentication
 * Validates partial update data and updates user information
 * Logs changes for audit trail
 */
router.put(
  '/profile',
  authenticateUser, // Require user authentication
  updateUserProfile // Update user profile
);

/**
 * GET /api/users/:userId
 * Get user by ID
 *
 * Requires authentication (user can only access own profile, admins can access any)
 * Returns complete user information for the specified user
 */
router.get(
  '/:userId',
  authenticateUser, // Require authentication
  getUserByIdController // Get user by ID with access control
);

/**
 * PUT /api/users/:userId
 * Update user profile by ID
 *
 * Requires authentication (user can only update own profile, admins can update any)
 * Updates user information with validation and audit logging
 */
router.put(
  '/:userId',
  authenticateUser, // Require authentication
  updateUserByIdController // Update user by ID with access control
);

/**
 * GET /api/users/:userId/documents
 * Get all documents for a user
 *
 * Requires authentication (user can only access own documents, admins can access any)
 * Returns all user documents with secure download URLs
 */
router.get(
  '/:userId/documents',
  authenticateUser, // Require authentication
  getUserDocumentsController // Get user documents with access control
);

/**
 * POST /api/users/:userId/refresh-token
 * Refresh user authentication token
 *
 * Requires valid authentication token
 * Returns new token if current token is valid but expiring soon
 */
router.post(
  '/:userId/refresh-token',
  authenticateUser, // Require authentication
  refreshUserTokenController // Refresh user token
);

export default router;
