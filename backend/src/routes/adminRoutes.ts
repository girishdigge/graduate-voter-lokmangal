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
  getStats,
  getVoters,
  getVoterDetails,
  verifyVoter,
  updateVoter,
  getReferences,
  updateReferenceStatusController,
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

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics including voter counts
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 */
router.get('/stats', authenticateAdmin, getStats);

/**
 * @route   GET /api/admin/voters
 * @desc    Get paginated list of voters with search and filtering
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
router.get('/voters', authenticateAdmin, getVoters);

/**
 * @route   GET /api/admin/voters/:userId
 * @desc    Get detailed voter information
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 * @params  userId: string (UUID)
 */
router.get('/voters/:userId', authenticateAdmin, getVoterDetails);

/**
 * @route   PUT /api/admin/voters/:userId/verify
 * @desc    Verify or unverify a voter
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 * @params  userId: string (UUID)
 * @body    { isVerified: boolean }
 */
router.put('/voters/:userId/verify', authenticateAdmin, verifyVoter);

/**
 * @route   PUT /api/admin/voters/:userId
 * @desc    Update voter information by admin
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 * @params  userId: string (UUID)
 * @body    Partial user data object
 */
router.put('/voters/:userId', authenticateAdmin, updateVoter);

/**
 * @route   GET /api/admin/references
 * @desc    Get paginated list of references with search and filtering
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 * @query   {
 *   q?: string,
 *   status?: 'PENDING' | 'CONTACTED' | 'APPLIED',
 *   user_id?: string,
 *   page?: number,
 *   limit?: number,
 *   sort_by?: 'created_at' | 'updated_at' | 'reference_name',
 *   sort_order?: 'asc' | 'desc'
 * }
 */
router.get('/references', authenticateAdmin, getReferences);

/**
 * @route   PUT /api/admin/references/:referenceId
 * @desc    Update reference status
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 * @params  referenceId: string (UUID)
 * @body    { status: 'PENDING' | 'CONTACTED' | 'APPLIED' }
 */
router.put(
  '/references/:referenceId',
  authenticateAdmin,
  updateReferenceStatusController
);

export default router;
// Import manager management controllers
import {
  getManagers,
  createManagerController,
  updateManagerController,
  deactivateManagerController,
  getManagerDetails,
} from '../controllers/adminController.js';
import { requireRole } from '../middleware/auth.js';

/**
 * Manager Management Routes (Admin Only)
 */

/**
 * @route   GET /api/admin/managers
 * @desc    Get paginated list of managers with search and filtering
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @query   {
 *   page?: number,
 *   limit?: number,
 *   sort_by?: 'created_at' | 'updated_at' | 'username' | 'email' | 'full_name' | 'role' | 'last_login_at',
 *   sort_order?: 'asc' | 'desc',
 *   search?: string,
 *   role?: 'ADMIN' | 'MANAGER',
 *   is_active?: boolean
 * }
 */
router.get('/managers', authenticateAdmin, requireRole(['admin']), getManagers);

/**
 * @route   POST /api/admin/managers
 * @desc    Create a new manager account
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @body    {
 *   username: string,
 *   email: string,
 *   fullName: string,
 *   password: string,
 *   role?: 'ADMIN' | 'MANAGER'
 * }
 */
router.post(
  '/managers',
  authenticateAdmin,
  requireRole(['admin']),
  createManagerController
);

/**
 * @route   GET /api/admin/managers/:managerId
 * @desc    Get manager details by ID
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @params  managerId: string (UUID)
 */
router.get(
  '/managers/:managerId',
  authenticateAdmin,
  requireRole(['admin']),
  getManagerDetails
);

/**
 * @route   PUT /api/admin/managers/:managerId
 * @desc    Update manager details
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @params  managerId: string (UUID)
 * @body    {
 *   email?: string,
 *   fullName?: string,
 *   isActive?: boolean
 * }
 */
router.put(
  '/managers/:managerId',
  authenticateAdmin,
  requireRole(['admin']),
  updateManagerController
);

/**
 * @route   DELETE /api/admin/managers/:managerId
 * @desc    Deactivate manager account
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @params  managerId: string (UUID)
 */
router.delete(
  '/managers/:managerId',
  authenticateAdmin,
  requireRole(['admin']),
  deactivateManagerController
);
