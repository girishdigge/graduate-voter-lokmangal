import { Request, Response, NextFunction } from 'express';
import {
  validateUserEnrollmentInput,
  validateUserUpdateInput,
} from '../types/userValidation.js';
import {
  createUserEnrollment,
  getUserById,
  updateUserInformation,
} from '../services/userService.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

/**
 * Middleware to validate user enrollment input
 */
export const validateEnrollmentInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = validateUserEnrollmentInput(req.body);

    if (!validation.success) {
      const errors = validation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      logger.warn('User enrollment validation failed', {
        errors,
        body: req.body,
        ip: req.ip,
      });

      // Log detailed validation errors for debugging
      logger.debug('Detailed validation errors:', {
        validationErrors: validation.error.issues,
        receivedData: req.body,
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data provided',
          details: errors,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Attach validated data to request
    req.body = validation.data;
    next();
  } catch (error) {
    logger.error('Error in enrollment input validation middleware', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });

    next(
      new AppError(
        'Validation processing failed',
        500,
        'VALIDATION_PROCESSING_ERROR'
      )
    );
  }
};

/**
 * POST /api/users/enroll
 * Create new user enrollment
 */
export const enrollUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info('User enrollment request received', {
      aadharNumber: req.body.aadharNumber
        ? req.body.aadharNumber.substring(0, 4) +
          '****' +
          req.body.aadharNumber.substring(8)
        : 'unknown',
      fullName: req.body.fullName,
      contact: req.body.contact,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Create user enrollment
    const result = await createUserEnrollment(req.body, req);

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
        message: result.message,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('User enrollment completed successfully', {
      userId: result.user.id,
      userName: result.user.fullName,
      ip: req.ip,
    });
  } catch (error) {
    logger.error('Error in user enrollment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      aadharNumber: req.body.aadharNumber
        ? req.body.aadharNumber.substring(0, 4) +
          '****' +
          req.body.aadharNumber.substring(8)
        : 'unknown',
      ip: req.ip,
    });

    next(error);
  }
};

/**
 * GET /api/users/profile
 * Get current user profile (requires authentication)
 */
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId; // Set by auth middleware

    if (!userId) {
      throw new AppError('User ID not found in request', 401, 'UNAUTHORIZED');
    }

    const user = await getUserById(userId);

    res.json({
      success: true,
      data: {
        user,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('User profile retrieved', {
      userId: user.id,
      userName: user.fullName,
    });
  } catch (error) {
    logger.error('Error retrieving user profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId,
    });

    next(error);
  }
};

/**
 * PUT /api/users/profile
 * Update current user profile (requires authentication)
 */
export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId; // Set by auth middleware

    if (!userId) {
      throw new AppError('User ID not found in request', 401, 'UNAUTHORIZED');
    }

    // Validate update data (partial validation)
    const validation = validateUserUpdateInput(req.body);

    if (!validation.success) {
      const errors = validation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid update data provided',
          details: errors,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Update user information
    const result = await updateUserInformation(userId, req.body, req);

    res.json({
      success: true,
      data: {
        user: result.user,
        message: result.message,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('User profile updated', {
      userId: result.user.id,
      userName: result.user.fullName,
    });
  } catch (error) {
    logger.error('Error updating user profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId,
    });

    next(error);
  }
};

/**
 * GET /api/users/:userId
 * Get user by ID (admin access or own profile)
 */
export const getUserByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;
    const isAdmin = req.user?.type === 'admin';

    // Check if user can access this profile
    if (!isAdmin && requestingUserId !== userId) {
      throw new AppError(
        'Access denied - can only view own profile',
        403,
        'ACCESS_DENIED'
      );
    }

    const user = await getUserById(userId);

    res.json({
      success: true,
      data: {
        user,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('User profile retrieved by ID', {
      userId: user.id,
      userName: user.fullName,
      requestedBy: requestingUserId,
      isAdmin,
    });
  } catch (error) {
    logger.error('Error retrieving user by ID', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      requestingUserId: req.user?.userId,
    });

    next(error);
  }
};

/**
 * PUT /api/users/:userId
 * Update user profile by ID (admin access or own profile)
 */
export const updateUserByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;
    const isAdmin = req.user?.type === 'admin';

    // Check if user can update this profile
    if (!isAdmin && requestingUserId !== userId) {
      throw new AppError(
        'Access denied - can only update own profile',
        403,
        'ACCESS_DENIED'
      );
    }

    // Validate update data (partial validation)
    const validation = validateUserEnrollmentInput({
      ...req.body,
      // Provide dummy values for required fields that might not be in update
      aadharNumber: req.body.aadharNumber || '000000000000',
      fullName: req.body.fullName || 'Dummy',
      sex: req.body.sex || 'MALE',
      contact: req.body.contact || '0000000000',
      dateOfBirth: req.body.dateOfBirth || '1990-01-01',
      houseNumber: req.body.houseNumber || 'Dummy',
      street: req.body.street || 'Dummy',
      area: req.body.area || 'Dummy',
      city: req.body.city || 'PUNE',
      state: req.body.state || 'Dummy',
      pincode: req.body.pincode || '000000',
    });

    if (!validation.success) {
      const errors = validation.error.issues
        .filter(err => Object.keys(req.body).includes(err.path[0] as string))
        .map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data provided',
            details: errors,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Update user information
    const result = await updateUserInformation(
      userId,
      req.body,
      req,
      isAdmin ? requestingUserId : undefined
    );

    res.json({
      success: true,
      data: {
        user: result.user,
        message: result.message,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('User profile updated by ID', {
      userId: result.user.id,
      userName: result.user.fullName,
      updatedBy: requestingUserId,
      isAdmin,
    });
  } catch (error) {
    logger.error('Error updating user by ID', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      requestingUserId: req.user?.userId,
    });

    next(error);
  }
};

/**
 * GET /api/users/:userId/documents
 * Get all documents for a user (admin access or own documents)
 */
export const getUserDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;
    const isAdmin = req.user?.type === 'admin';

    // Check if user can access these documents
    if (!isAdmin && requestingUserId !== userId) {
      throw new AppError(
        'Access denied - can only view own documents',
        403,
        'ACCESS_DENIED'
      );
    }

    // Import document service
    const { getUserDocuments } = await import('../services/documentService.js');
    const result = await getUserDocuments(userId);

    res.json({
      success: true,
      data: {
        documents: result.documents,
        count: result.count,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('User documents retrieved', {
      userId,
      documentCount: result.count,
      requestedBy: requestingUserId,
      isAdmin,
    });
  } catch (error) {
    logger.error('Error retrieving user documents', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      requestingUserId: req.user?.userId,
    });

    next(error);
  }
};

/**
 * POST /api/users/:userId/refresh-token
 * Refresh user authentication token
 */
export const refreshUserTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;
    const isAdmin = req.user?.type === 'admin';

    // Check if user can refresh this token
    if (!isAdmin && requestingUserId !== userId) {
      throw new AppError(
        'Access denied - can only refresh own token',
        403,
        'ACCESS_DENIED'
      );
    }

    // Import JWT utilities
    const { generateUserToken, isTokenExpiringSoon, extractTokenFromHeader } =
      await import('../utils/jwt.js');

    // Get current token from header
    const currentToken = extractTokenFromHeader(req.headers.authorization);

    // Check if token is expiring soon
    if (!isTokenExpiringSoon(currentToken)) {
      return res.json({
        success: true,
        data: {
          message: 'Token is still valid and not expiring soon',
          tokenRefreshed: false,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Generate new token
    const newToken = generateUserToken(userId);

    // Log token refresh for audit trail
    const { createAuditLog } = await import('../services/auditService.js');
    await createAuditLog({
      entityType: 'User',
      entityId: userId,
      action: 'TOKEN_REFRESH',
      oldValues: null,
      newValues: { tokenRefreshed: true },
      userId: userId,
      adminId: null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || null,
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        message: 'Token refreshed successfully',
        tokenRefreshed: true,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('User token refreshed', {
      userId,
      requestedBy: requestingUserId,
      isAdmin,
    });
  } catch (error) {
    logger.error('Error refreshing user token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      requestingUserId: req.user?.userId,
    });

    next(error);
  }
};
