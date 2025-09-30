import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  authenticateAdmin,
  changeAdminPassword,
  validateAdminSession,
  logAdminLogout,
} from '../services/adminService.js';
import searchService from '../services/searchService.js';
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
        validationResult.error.errors
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
        validationResult.error.errors
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
        validationResult.error.errors
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
        validationResult.error.errors
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
