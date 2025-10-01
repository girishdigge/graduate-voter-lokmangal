import { Request, Response, NextFunction } from 'express';
import {
  verifyToken,
  extractTokenFromHeader,
  UserTokenPayload,
  AdminTokenPayload,
} from '../utils/jwt.js';
import { AppError } from './errorHandler.js';
import logger from '../config/logger.js';
import {
  securityAudit,
  SecurityEventType,
} from '../services/securityAuditService.js';

// Extend Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        type: 'user' | 'admin';
        role?: 'admin' | 'manager';
      };
    }
  }
}

/**
 * Middleware to authenticate user tokens
 */
export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const payload = verifyToken(token) as UserTokenPayload;

    // Verify token type
    if (payload.type !== 'user') {
      throw new AppError(
        'Invalid token type for user authentication',
        401,
        'INVALID_TOKEN_TYPE'
      );
    }

    // Add user information to request
    req.user = {
      userId: payload.userId,
      type: 'user',
    };

    logger.debug('User authenticated successfully', {
      userId: payload.userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  } catch (error) {
    logger.warn('User authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Log security event for authentication failure
    securityAudit.logAuthenticationEvent(
      req,
      false,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );

    next(error);
  }
};

/**
 * Middleware to authenticate admin tokens
 */
export const authenticateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const payload = verifyToken(token) as AdminTokenPayload;

    // Verify token type
    if (payload.type !== 'admin') {
      throw new AppError(
        'Invalid token type for admin authentication',
        401,
        'INVALID_TOKEN_TYPE'
      );
    }

    // Add admin information to request
    req.user = {
      userId: payload.userId,
      type: 'admin',
      role: payload.role,
    };

    logger.debug('Admin authenticated successfully', {
      userId: payload.userId,
      role: payload.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  } catch (error) {
    logger.warn('Admin authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Log security event for admin authentication failure
    securityAudit.logAuthenticationEvent(
      req,
      false,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );

    next(error);
  }
};

/**
 * Middleware to require specific admin roles
 */
export const requireRole = (
  allowedRoles: ('admin' | 'manager')[]
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated as admin
      if (!req.user || req.user.type !== 'admin' || !req.user.role) {
        throw new AppError(
          'Admin authentication required',
          401,
          'ADMIN_AUTH_REQUIRED'
        );
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError(
          'Insufficient permissions',
          403,
          'INSUFFICIENT_PERMISSIONS',
          {
            required: allowedRoles,
            current: req.user.role,
          }
        );
      }

      logger.debug('Role authorization successful', {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: allowedRoles,
        ip: req.ip,
      });

      next();
    } catch (error) {
      logger.warn('Role authorization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        role: req.user?.role,
        requiredRoles: allowedRoles,
        ip: req.ip,
      });

      // Log security event for authorization failure
      securityAudit.logAuthorizationEvent(
        req,
        false,
        allowedRoles.join(','),
        error instanceof Error ? error.message : 'Unknown error'
      );

      next(error);
    }
  };
};

/**
 * Middleware to optionally authenticate user (doesn't throw error if no token)
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without authentication
      return next();
    }

    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token);

    // Add user information to request
    req.user = {
      userId: payload.userId,
      type: payload.type,
      role:
        payload.type === 'admin'
          ? (payload as AdminTokenPayload).role
          : undefined,
    };

    logger.debug('Optional authentication successful', {
      userId: payload.userId,
      type: payload.type,
      ip: req.ip,
    });

    next();
  } catch (error) {
    // Log the error but don't block the request
    logger.debug('Optional authentication failed, continuing without auth', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });
    next();
  }
};

/**
 * Middleware to check if user owns the resource (for user endpoints)
 */
export const requireOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { userId } = req.params;

    if (!req.user) {
      throw new AppError(
        'Authentication required',
        401,
        'AUTHENTICATION_REQUIRED'
      );
    }

    // Admin users can access any resource
    if (req.user.type === 'admin') {
      return next();
    }

    // Regular users can only access their own resources
    if (req.user.type === 'user' && req.user.userId !== userId) {
      throw new AppError(
        'Access denied: You can only access your own resources',
        403,
        'ACCESS_DENIED'
      );
    }

    next();
  } catch (error) {
    logger.warn('Ownership check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId,
      requestedUserId: req.params.userId,
      ip: req.ip,
    });
    next(error);
  }
};
