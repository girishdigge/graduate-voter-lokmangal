import { Request, Response } from 'express';
import { z } from 'zod';
import {
  addUserReferences,
  getUserReferences,
  updateReferenceStatus,
  getAllReferencesWithFilters,
} from '../services/referenceService.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';
import { ReferenceStatus } from '@prisma/client';

// Validation schemas
const referenceSchema = z.object({
  referenceName: z
    .string()
    .min(1, 'Reference name is required')
    .max(255, 'Reference name must be less than 255 characters')
    .trim(),
  referenceContact: z
    .string()
    .min(10, 'Contact number must be at least 10 digits')
    .max(15, 'Contact number must be less than 15 characters')
    .regex(
      /^[\d\s\-\+]+$/,
      'Contact number can only contain digits, spaces, hyphens, and plus signs'
    )
    .trim(),
});

const addReferencesSchema = z.object({
  references: z
    .array(referenceSchema)
    .min(1, 'At least one reference is required')
    .max(10, 'Maximum 10 references allowed'),
});

const updateReferenceStatusSchema = z.object({
  status: z.nativeEnum(ReferenceStatus, {
    // errorMap: () => ({
    //   message: 'Status must be PENDING, CONTACTED, or APPLIED',
    // }),
  }),
});

/**
 * Add references for a user
 * POST /api/references/:userId
 */
export const addReferences = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
    }

    // Validate request body
    const validationResult = addReferencesSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
        errors,
      });
    }

    const { references } = validationResult.data;

    // Add references
    const result = await addUserReferences(userId, references, req);

    logger.info('References added via API', {
      userId,
      referenceCount: references.length,
      requestId: req.headers['x-request-id'],
    });

    res.status(201).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    } else {
      logger.error('Unexpected error in addReferences controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.params.userId,
        requestId: req.headers['x-request-id'],
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
};

/**
 * Get references for a user
 * GET /api/references/:userId
 */
export const getReferences = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
    }

    // Get user references
    const result = await getUserReferences(userId);

    logger.info('References retrieved via API', {
      userId,
      referenceCount: result.references.length,
      requestId: req.headers['x-request-id'],
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    } else {
      logger.error('Unexpected error in getReferences controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.params.userId,
        requestId: req.headers['x-request-id'],
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
};

/**
 * Update reference status (Admin only)
 * PUT /api/admin/references/:referenceId/status
 */
export const updateReferenceStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { referenceId } = req.params;

    // Validate referenceId format
    if (!referenceId || typeof referenceId !== 'string') {
      throw new AppError('Invalid reference ID', 400, 'INVALID_REFERENCE_ID');
    }

    // Validate request body
    const validationResult = updateReferenceStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
        errors,
      });
    }

    const { status } = validationResult.data;

    // Get admin ID from authenticated request
    const adminId = req.user?.userId;
    if (!adminId || req.user?.type !== 'admin') {
      throw new AppError(
        'Admin authentication required',
        401,
        'ADMIN_AUTH_REQUIRED'
      );
    }

    // Update reference status
    const result = await updateReferenceStatus(
      referenceId,
      status,
      adminId,
      req
    );

    logger.info('Reference status updated via API', {
      referenceId,
      status,
      adminId,
      requestId: req.headers['x-request-id'],
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    } else {
      logger.error('Unexpected error in updateReferenceStatus controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
        referenceId: req.params.referenceId,
        requestId: req.headers['x-request-id'],
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
};

/**
 * Get all references with filtering (Admin only)
 * GET /api/admin/references
 */
export const getAllReferences = async (req: Request, res: Response) => {
  try {
    // Get admin ID from authenticated request
    const adminId = req.user?.userId;
    if (!adminId || req.user?.type !== 'admin') {
      throw new AppError(
        'Admin authentication required',
        401,
        'ADMIN_AUTH_REQUIRED'
      );
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 per page
    const status = req.query.status as ReferenceStatus | undefined;
    const search = req.query.search as string | undefined;

    // Get references with filtering and pagination
    const result = await getAllReferencesWithFilters(
      page,
      limit,
      status,
      search
    );

    logger.info('All references retrieved via admin API', {
      adminId,
      page,
      limit,
      status,
      search: search ? 'provided' : 'none',
      total: result.pagination.total,
      requestId: req.headers['x-request-id'],
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    } else {
      logger.error('Unexpected error in getAllReferences controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.headers['x-request-id'],
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
};
