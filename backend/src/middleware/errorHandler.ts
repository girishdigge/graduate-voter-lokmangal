import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
const { JsonWebTokenError, TokenExpiredError } = jwt;
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Custom error class for application errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

// Main error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = uuidv4();

  // Log the error with request context
  logger.error('Error occurred', {
    requestId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle different types of errors
  if (err instanceof AppError) {
    // Custom application errors
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    // Zod validation errors
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid input data';
    details = err.issues.map((error: any) => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
    }));
  } else if (err instanceof JsonWebTokenError) {
    // JWT errors
    statusCode = 401;
    code = 'AUTHENTICATION_ERROR';
    if (err instanceof TokenExpiredError) {
      message = 'Token has expired';
    } else {
      message = 'Invalid authentication token';
    }
  } else if (err instanceof PrismaClientKnownRequestError) {
    // Prisma database errors
    statusCode = 400;
    code = 'DATABASE_ERROR';

    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        code = 'DUPLICATE_ERROR';
        const target = err.meta?.target as string[];
        message = `A record with this ${target?.[0] || 'field'} already exists`;
        details = { field: target?.[0] };
        break;
      case 'P2025':
        // Record not found
        statusCode = 404;
        code = 'NOT_FOUND_ERROR';
        message = 'Record not found';
        break;
      case 'P2003':
        // Foreign key constraint violation
        code = 'REFERENCE_ERROR';
        message = 'Referenced record does not exist';
        break;
      default:
        message = 'Database operation failed';
    }
  } else if (err.name === 'MulterError') {
    // File upload errors
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';

    switch ((err as any).code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the maximum limit';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = 'File upload failed';
    }
  }

  // Enhanced security: Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    // Only expose safe error messages in production
    if (statusCode === 500 || !err.message.startsWith('SAFE:')) {
      // Generic error messages for production
      switch (statusCode) {
        case 400:
          message = 'Bad request';
          break;
        case 401:
          message = 'Authentication required';
          break;
        case 403:
          message = 'Access forbidden';
          break;
        case 404:
          message = 'Resource not found';
          break;
        case 429:
          message = 'Too many requests';
          break;
        case 500:
        default:
          message = 'Internal server error';
          break;
      }

      // Remove sensitive details in production
      details = undefined;

      // Log the actual error details for debugging (but don't expose to client)
      logger.error('Production error details (not exposed to client)', {
        requestId,
        actualError: err.message,
        actualDetails: details,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    // Remove stack traces in production
    if (err.stack) {
      logger.error('Stack trace (production)', {
        requestId,
        stack: err.stack,
      });
    }
  }

  // Additional security: Sanitize error messages to prevent XSS
  if (typeof message === 'string') {
    // Remove potentially dangerous characters from error messages
    message = message.replace(/[<>\"'&]/g, '');
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  };

  logger.warn('404 Not Found', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json(errorResponse);
};
