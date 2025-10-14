import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  authenticateAdmin,
  changeAdminPassword,
  validateAdminSession,
  logAdminLogout,
  getAdminStats,
  getVotersWithPagination,
  verifyUser,
  updateUserByAdmin,
} from '../services/adminService.js';
import { getUserById } from '../services/userService.js';
import { updateReferenceStatus } from '../services/referenceService.js';
import searchService, {
  type ReferenceSearchOptions,
} from '../services/searchService.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

// Validation schemas
const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username must be less than 50 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(255, 'Password must be less than 255 characters'),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .max(255, 'New password must be less than 255 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'New password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
});

const searchVotersSchema = z.object({
  q: z.string().optional(),
  verification_status: z.enum(['verified', 'unverified']).optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  assembly_number: z.string().optional(),
  polling_station_number: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  age_min: z.coerce.number().int().min(0).max(150).optional(),
  age_max: z.coerce.number().int().min(0).max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z
    .enum(['created_at', 'updated_at', 'full_name', 'age', 'assembly_number'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const searchReferencesSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  user_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const votersListSchema = z.object({
  q: z.string().optional(),
  verification_status: z.enum(['verified', 'unverified']).optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  assembly_number: z.string().optional(),
  polling_station_number: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  age_min: z.coerce.number().int().min(0).max(150).optional(),
  age_max: z.coerce.number().int().min(0).max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z
    .enum(['created_at', 'updated_at', 'full_name', 'age', 'assembly_number'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const verifyUserSchema = z.object({
  isVerified: z.boolean(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  guardianSpouse: z.string().max(255).optional(),
  qualification: z.string().max(255).optional(),
  occupation: z.string().max(255).optional(),
  contact: z
    .string()
    .regex(/^\d{10}$/, 'Contact must be 10 digits')
    .optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().datetime().optional(),
  houseNumber: z.string().max(50).optional(),
  street: z.string().max(255).optional(),
  area: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .optional(),
  isRegisteredElector: z.boolean().optional(),
  assemblyNumber: z.string().max(10).optional(),
  assemblyName: z.string().max(255).optional(),
  pollingStationNumber: z.string().max(10).optional(),
  epicNumber: z.string().max(20).optional(),
  disabilities: z.string().optional(),
  university: z.string().max(255).optional(),
  graduationYear: z.coerce.number().int().min(1950).max(2030).optional(),
  graduationDocType: z.string().max(100).optional(),
});

const referencesListSchema = z.object({
  q: z.string().optional(),
  status: z.enum(['PENDING', 'CONTACTED', 'APPLIED']).optional(),
  user_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z
    .enum([
      'created_at',
      'updated_at',
      'reference_name',
      'user.fullName',
      'status',
      'whatsappSent',
      'statusUpdatedAt',
    ])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const updateReferenceStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'APPLIED']),
});

/**
 * POST /api/admin/login
 * Authenticate admin user and return JWT token
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid login data',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const { username, password } = validationResult.data;

    // Get client information
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Authenticate admin
    const authResult = await authenticateAdmin(
      { username, password },
      ipAddress,
      userAgent
    );

    // Set secure HTTP-only cookie for token (optional, for enhanced security)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('admin_token', authResult.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    logger.info('Admin login successful', {
      adminId: authResult.admin.id,
      username: authResult.admin.username,
      role: authResult.admin.role,
      ipAddress,
      userAgent,
    });

    res.status(200).json({
      success: true,
      data: {
        admin: authResult.admin,
        token: authResult.token,
        message: 'Login successful',
      },
    });
  } catch (error) {
    logger.error('Admin login error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: { username: req.body?.username }, // Don't log password
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    next(error);
  }
};

/**
 * POST /api/admin/logout
 * Logout admin user and invalidate session
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (adminId) {
      // Log the logout action
      await logAdminLogout(adminId, ipAddress, userAgent);
    }

    // Clear the HTTP-only cookie
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });

    logger.info('Admin logout successful', {
      adminId,
      ipAddress,
      userAgent,
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Logout successful',
      },
    });
  } catch (error) {
    logger.error('Admin logout error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    next(error);
  }
};

/**
 * PUT /api/admin/password
 * Change admin password
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validationResult = passwordChangeSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid password change data',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const { currentPassword, newPassword } = validationResult.data;
    const adminId = req.user!.userId; // Guaranteed to exist due to auth middleware
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Change password
    await changeAdminPassword(
      adminId,
      { currentPassword, newPassword },
      ipAddress,
      userAgent
    );

    logger.info('Admin password change successful', {
      adminId,
      ipAddress,
      userAgent,
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Password changed successfully',
      },
    });
  } catch (error) {
    logger.error('Admin password change error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    next(error);
  }
};

/**
 * GET /api/admin/profile
 * Get current admin profile information
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.userId; // Guaranteed to exist due to auth middleware

    // Validate admin session and get profile
    const admin = await validateAdminSession(adminId);

    logger.debug('Admin profile retrieved', {
      adminId,
      username: admin.username,
    });

    res.status(200).json({
      success: true,
      data: {
        admin,
      },
    });
  } catch (error) {
    logger.error('Admin profile retrieval error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
    });
    next(error);
  }
};

/**
 * POST /api/admin/validate-session
 * Validate current admin session (for token refresh)
 */
export const validateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.userId; // Guaranteed to exist due to auth middleware

    // Validate admin session
    const admin = await validateAdminSession(adminId);

    logger.debug('Admin session validated', {
      adminId,
      username: admin.username,
    });

    res.status(200).json({
      success: true,
      data: {
        admin,
        valid: true,
      },
    });
  } catch (error) {
    logger.error('Admin session validation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
    });
    next(error);
  }
};

/**
 * GET /api/admin/search/voters
 * Search voters with advanced filtering and pagination
 */
export const searchVoters = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate query parameters
    const validationResult = searchVotersSchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid search parameters',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const {
      q,
      verification_status,
      sex,
      assembly_number,
      polling_station_number,
      city,
      state,
      age_min,
      age_max,
      page,
      limit,
      sort_by,
      sort_order,
    } = validationResult.data;

    const adminId = req.user!.userId;

    // Build filters object
    const filters = {
      verification_status,
      sex,
      assembly_number,
      polling_station_number,
      city,
      state,
      age_min,
      age_max,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    // Build options object
    const options = {
      page,
      limit,
      sort_by,
      sort_order,
    };

    // Perform search
    const searchResults = await searchService.searchUsers(
      q || '',
      filters,
      options
    );

    logger.info('Admin voter search performed', {
      adminId,
      query: q,
      filters,
      options,
      resultCount: searchResults.data.length,
      totalResults: searchResults.total,
    });

    res.status(200).json({
      success: true,
      data: searchResults,
    });
  } catch (error) {
    logger.error('Admin voter search error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      query: req.query,
    });
    next(error);
  }
};

/**
 * GET /api/admin/search/references
 * Search references with filtering and pagination
 */
export const searchReferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate query parameters
    const validationResult = searchReferencesSchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid search parameters',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const { q, status, user_id, page, limit, sort_by, sort_order } =
      validationResult.data;

    const adminId = req.user!.userId;

    // Build filters object
    const filters = {
      status,
      user_id,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    // Build options object
    const options = {
      page,
      limit,
      sort_by,
      sort_order,
    };

    // Perform search
    const searchResults = await searchService.searchReferences(
      q || '',
      filters,
      options
    );

    logger.info('Admin reference search performed', {
      adminId,
      query: q,
      filters,
      options,
      resultCount: searchResults.data.length,
      totalResults: searchResults.total,
    });

    res.status(200).json({
      success: true,
      data: searchResults,
    });
  } catch (error) {
    logger.error('Admin reference search error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      query: req.query,
    });
    next(error);
  }
};

/**
 * GET /api/admin/stats
 * Get dashboard statistics including voter counts
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.userId;

    // Get statistics
    const stats = await getAdminStats();

    logger.info('Admin stats retrieved', {
      adminId,
      stats,
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Admin stats retrieval error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
    });
    next(error);
  }
};

/**
 * GET /api/admin/voters
 * Get paginated list of voters with search and filtering
 */
export const getVoters = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate query parameters
    const validationResult = votersListSchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid query parameters',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const {
      q,
      verification_status,
      sex,
      assembly_number,
      polling_station_number,
      city,
      state,
      age_min,
      age_max,
      page,
      limit,
      sort_by,
      sort_order,
    } = validationResult.data;

    const adminId = req.user!.userId;

    // Build filters object
    const filters = {
      verification_status,
      sex,
      assembly_number,
      polling_station_number,
      city,
      state,
      age_min,
      age_max,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    // Build options object
    const options = {
      page,
      limit,
      sort_by,
      sort_order,
    };

    // Get voters with pagination
    const result = await getVotersWithPagination(q, filters, options);

    logger.info('Admin voters list retrieved', {
      adminId,
      query: q,
      filters,
      options,
      resultCount: result.voters.length,
      totalResults: result.pagination.total,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Admin voters list error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      query: req.query,
    });
    next(error);
  }
};

/**
 * GET /api/admin/voters/:userId
 * Get detailed voter information
 */
export const getVoterDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = req.user!.userId;

    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
    }

    // Get user details
    const user = await getUserById(userId);

    logger.info('Admin voter details retrieved', {
      adminId,
      userId,
      userName: user.fullName,
    });

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Admin voter details error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      userId: req.params.userId,
    });
    next(error);
  }
};

/**
 * PUT /api/admin/voters/:userId/verify
 * Verify or unverify a voter
 */
export const verifyVoter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = req.user!.userId;

    // Validate request body
    const validationResult = verifyUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid verification data',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const { isVerified } = validationResult.data;

    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
    }

    // Get client information
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Verify/unverify user
    const result = await verifyUser(
      userId,
      isVerified,
      adminId,
      ipAddress,
      userAgent
    );

    logger.info('Admin voter verification updated', {
      adminId,
      userId,
      isVerified,
      userName: result.user.fullName,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Admin voter verification error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      userId: req.params.userId,
      body: req.body,
    });
    next(error);
  }
};

/**
 * PUT /api/admin/voters/:userId
 * Update voter information by admin
 */
export const updateVoter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = req.user!.userId;

    // Validate request body
    const validationResult = updateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid update data',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const updateData = validationResult.data;

    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
    }

    // Get client information
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Update user by admin
    const result = await updateUserByAdmin(
      userId,
      updateData,
      adminId,
      req,
      ipAddress,
      userAgent
    );

    logger.info('Admin voter update completed', {
      adminId,
      userId,
      userName: result.user.fullName,
      updatedFields: Object.keys(updateData),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Admin voter update error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      userId: req.params.userId,
      body: req.body,
    });
    next(error);
  }
};

/**
 * GET /api/admin/references
 * Get paginated list of references with search and filtering
 */
export const getReferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate query parameters
    const validationResult = referencesListSchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid query parameters',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const { q, status, user_id, page, limit, sort_by, sort_order } =
      validationResult.data;

    const adminId = req.user!.userId;

    // Build filters object
    const filters = {
      status,
      user_id,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    // Build options object
    const options: ReferenceSearchOptions = {
      page,
      limit,
      sort_by,
      sort_order,
    };

    // Use search service for consistent pagination and filtering
    const result = await searchService.searchReferences(
      q || '',
      filters,
      options
    );

    // Transform the response to match frontend expectations
    const response = {
      references: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.total_pages,
        hasNext: result.page < result.total_pages,
        hasPrev: result.page > 1,
      },
    };

    logger.info('Admin references list retrieved', {
      adminId,
      query: q,
      filters,
      options,
      resultCount: result.data.length,
      totalResults: result.total,
    });

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Admin references list error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      query: req.query,
    });
    next(error);
  }
};

/**
 * PUT /api/admin/references/:referenceId
 * Update reference status
 */
export const updateReferenceStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { referenceId } = req.params;
    const adminId = req.user!.userId;

    // Validate request body
    const validationResult = updateReferenceStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid status update data',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const { status } = validationResult.data;

    // Validate referenceId format
    if (!referenceId || typeof referenceId !== 'string') {
      throw new AppError('Invalid reference ID', 400, 'INVALID_REFERENCE_ID');
    }

    // Update reference status
    const result = await updateReferenceStatus(
      referenceId,
      status as any, // Cast to ReferenceStatus enum
      adminId,
      req
    );

    logger.info('Admin reference status updated', {
      adminId,
      referenceId,
      newStatus: status,
      referenceName: result.reference.referenceName,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Admin reference status update error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      referenceId: req.params.referenceId,
      body: req.body,
    });
    next(error);
  }
};
/**
 * Manager Management Controllers
 */

// Import additional services for manager management
import {
  getManagersWithPagination,
  createManager,
  updateManager,
  deactivateManager,
  getManagerById,
  type CreateManagerData,
  type UpdateManagerData,
  type ManagerListOptions,
} from '../services/adminService.js';

// Validation schemas for manager management
const managersListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z
    .enum([
      'created_at',
      'updated_at',
      'username',
      'email',
      'full_name',
      'role',
      'last_login_at',
    ])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER']).optional(),
  is_active: z.coerce.boolean().optional(),
});

const createManagerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(50, 'Username must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(255, 'Password must be less than 255 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  role: z.enum(['ADMIN', 'MANAGER']).default('MANAGER'),
});

const updateManagerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters')
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/managers
 * Get paginated list of managers with search and filtering
 */
export const getManagers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.userId;

    // Validate query parameters
    const validationResult = managersListSchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid query parameters',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const options: ManagerListOptions = {
      page: validationResult.data.page,
      limit: validationResult.data.limit,
      sort_by: validationResult.data.sort_by,
      sort_order: validationResult.data.sort_order,
      search: validationResult.data.search,
      role: validationResult.data.role,
      isActive: validationResult.data.is_active,
    };

    // Get managers with pagination
    const result = await getManagersWithPagination(options);

    logger.info('Admin managers list retrieved', {
      adminId,
      page: options.page,
      limit: options.limit,
      total: result.pagination.total,
    });

    res.status(200).json({
      success: true,
      data: result,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Admin managers list error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      query: req.query,
    });
    next(error);
  }
};

/**
 * POST /api/admin/managers
 * Create a new manager account
 */
export const createManagerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.userId;

    // Validate request body
    const validationResult = createManagerSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid manager data',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const managerData: CreateManagerData = validationResult.data;

    // Get client information
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Create manager
    const result = await createManager(
      managerData,
      adminId,
      ipAddress,
      userAgent
    );

    logger.info('Manager created by admin', {
      adminId,
      managerId: result.manager.id,
      username: result.manager.username,
      role: result.manager.role,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Manager creation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      body: { ...req.body, password: '[REDACTED]' },
    });
    next(error);
  }
};

/**
 * PUT /api/admin/managers/:managerId
 * Update manager details
 */
export const updateManagerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { managerId } = req.params;
    const adminId = req.user!.userId;

    // Validate managerId format
    if (!managerId || typeof managerId !== 'string') {
      throw new AppError('Invalid manager ID', 400, 'INVALID_MANAGER_ID');
    }

    // Validate request body
    const validationResult = updateManagerSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid update data',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const updateData: UpdateManagerData = validationResult.data;

    // Get client information
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Update manager
    const result = await updateManager(
      managerId,
      updateData,
      adminId,
      ipAddress,
      userAgent
    );

    logger.info('Manager updated by admin', {
      adminId,
      managerId,
      username: result.manager.username,
      updatedFields: Object.keys(updateData),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Manager update error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      managerId: req.params.managerId,
      body: req.body,
    });
    next(error);
  }
};

/**
 * DELETE /api/admin/managers/:managerId
 * Deactivate manager account
 */
export const deactivateManagerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { managerId } = req.params;
    const adminId = req.user!.userId;

    // Validate managerId format
    if (!managerId || typeof managerId !== 'string') {
      throw new AppError('Invalid manager ID', 400, 'INVALID_MANAGER_ID');
    }

    // Get client information
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Deactivate manager
    const result = await deactivateManager(
      managerId,
      adminId,
      ipAddress,
      userAgent
    );

    logger.info('Manager deactivated by admin', {
      adminId,
      managerId,
      username: result.manager.username,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Manager deactivation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      managerId: req.params.managerId,
    });
    next(error);
  }
};

/**
 * GET /api/admin/managers/:managerId
 * Get manager details by ID
 */
export const getManagerDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { managerId } = req.params;
    const adminId = req.user!.userId;

    // Validate managerId format
    if (!managerId || typeof managerId !== 'string') {
      throw new AppError('Invalid manager ID', 400, 'INVALID_MANAGER_ID');
    }

    // Get manager details
    const manager = await getManagerById(managerId);

    logger.info('Manager details retrieved by admin', {
      adminId,
      managerId,
      username: manager.username,
    });

    res.status(200).json({
      success: true,
      data: { manager },
    });
  } catch (error) {
    logger.error('Manager details retrieval error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      managerId: req.params.managerId,
    });
    next(error);
  }
};
