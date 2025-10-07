import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  checkAadharExists,
  generateUserSession,
} from '../services/userService.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

// Validation schema for Aadhar check request
const aadharCheckSchema = z.object({
  aadharNumber: z
    .string()
    .min(1, 'Aadhar number is required')
    .regex(/^[\d\s-]{12,14}$/, 'Invalid Aadhar number format')
    .transform(val => val.replace(/[\s-]/g, '')) // Clean the input
    .refine(val => val.length === 12, 'Aadhar number must be exactly 12 digits')
    .refine(
      val => /^\d{12}$/.test(val),
      'Aadhar number must contain only digits'
    ),
});

/**
 * POST /api/aadhar/check
 * Check if Aadhar number exists in the system
 */
export const checkAadhar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validationResult = aadharCheckSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new AppError('Invalid input data', 400, 'VALIDATION_ERROR', {
        errors,
      });
    }

    const { aadharNumber } = validationResult.data;

    // Log the request (with masked Aadhar for security)
    logger.info('Aadhar check request received', {
      aadharNumber:
        aadharNumber.substring(0, 4) + '****' + aadharNumber.substring(8),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Check if Aadhar exists
    const result = await checkAadharExists(aadharNumber);

    if (result.exists && result.user) {
      // Generate session token for existing user
      const sessionData = await generateUserSession(result.user.id);

      res.status(200).json({
        success: true,
        data: {
          exists: true,
          user: result.user,
          token: sessionData.token,
          message:
            'User found. You can now access your dashboard or update your information.',
        },
      });
    } else {
      // New user - no token generated yet
      res.status(200).json({
        success: true,
        data: {
          exists: false,
          user: null,
          token: null,
          message: 'Aadhar number not found. Please proceed with enrollment.',
        },
      });
    }

    // Log successful response
    logger.info('Aadhar check completed successfully', {
      aadharNumber:
        aadharNumber.substring(0, 4) + '****' + aadharNumber.substring(8),
      exists: result.exists,
      ip: req.ip,
    });
  } catch (error) {
    logger.error('Aadhar check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body.aadharNumber
        ? {
            aadharNumber:
              req.body.aadharNumber.substring(0, 4) +
              '****' +
              req.body.aadharNumber.substring(8),
          }
        : undefined,
    });

    next(error);
  }
};

/**
 * Input validation middleware for Aadhar endpoints
 */
export const validateAadharInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Basic request validation
    if (!req.body) {
      throw new AppError(
        'Request body is required',
        400,
        'MISSING_REQUEST_BODY'
      );
    }

    if (typeof req.body.aadharNumber !== 'string') {
      throw new AppError(
        'Aadhar number must be a string',
        400,
        'INVALID_AADHAR_TYPE'
      );
    }

    // Sanitize input - remove extra whitespace
    req.body.aadharNumber = req.body.aadharNumber.trim();

    if (!req.body.aadharNumber) {
      throw new AppError(
        'Aadhar number cannot be empty',
        400,
        'EMPTY_AADHAR_NUMBER'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
