import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  logout,
  changePassword,
  getProfile,
  validateSession,
  searchVoters,
  searchReferences,
} from '../controllers/adminController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// Rate limiting for admin authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests
  skipSuccessfulRequests: true,
});

// Rate limiting for password change (more restrictive)
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password change attempts per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password change attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/admin/login
 * @desc    Authenticate admin user and return JWT token
 * @access  Public
 * @body    { username: string, password: string }
 */
router.post('/login', authLimiter, login);

/**
 * @route   POST /api/admin/logout
 * @desc    Logout admin user and invalidate session
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 */
router.post('/logout', authenticateAdmin, logout);

/**
 * @route   PUT /api/admin/password
 * @desc    Change admin password
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 * @body    { currentPassword: string, newPassword: string }
 */
router.put(
  '/password',
  passwordChangeLimiter,
  authenticateAdmin,
  changePassword
);

/**
 * @route   GET /api/admin/profile
 * @desc    Get current admin profile information
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 */
router.get('/profile', authenticateAdmin, getProfile);

/**
 * @route   POST /api/admin/validate-session
 * @desc    Validate current admin session (for token refresh)
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 */
router.post('/validate-session', authenticateAdmin, validateSession);

/**
 * @route   GET /api/admin/search/voters
 * @desc    Search voters with advanced filtering and pagination
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 * @query   {
 *   q?: string,
 *   verification_status?: 'verified' | 'unverified',
 *   sex?: 'MALE' | 'FEMALE' | 'OTHER',
 *   assembly_number?: string,
 *   polling_station_number?: string,
 *   city?: string,
 *   state?: string,
 *   age_min?: number,
 *   age_max?: number,
 *   page?: number,
 *   limit?: number,
 *   sort_by?: 'created_at' | 'updated_at' | 'full_name' | 'age' | 'assembly_number',
 *   sort_order?: 'asc' | 'desc'
 * }
 */
router.get('/search/voters', authenticateAdmin, searchVoters);

/**
 * @route   GET /api/admin/search/references
 * @desc    Search references with filtering and pagination
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 * @query   {
 *   q?: string,
 *   status?: string,
 *   user_id?: string,
 *   page?: number,
 *   limit?: number,
 *   sort_by?: 'created_at' | 'updated_at' | 'reference_name',
 *   sort_order?: 'asc' | 'desc'
 * }
 */
router.get('/search/references', authenticateAdmin, searchReferences);

export default router;
