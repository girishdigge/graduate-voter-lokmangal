import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from './errorHandler.js';
import logger from '../config/logger.js';
import {
  securityAudit,
  SecurityEventType,
} from '../services/securityAuditService.js';

/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 */

// Extend Express Request interface to include CSRF token
declare global {
  namespace Express {
    interface Request {
      csrfToken?: string;
    }
  }
}

// CSRF configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Generate a cryptographically secure CSRF token
 */
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

/**
 * Middleware to generate and set CSRF token
 * Should be used on GET requests that render forms
 */
export const setCSRFToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Generate new CSRF token
    const csrfToken = generateCSRFToken();

    // Set CSRF token in cookie
    res.cookie(CSRF_COOKIE_NAME, csrfToken, CSRF_COOKIE_OPTIONS);

    // Add token to request for use in response
    req.csrfToken = csrfToken;

    // Add token to response headers for client-side access
    res.setHeader('X-CSRF-Token', csrfToken);

    logger.debug('CSRF token generated and set', {
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  } catch (error) {
    logger.error('Error generating CSRF token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId,
      ip: req.ip,
    });

    next(
      new AppError(
        'Failed to generate CSRF token',
        500,
        'CSRF_TOKEN_GENERATION_ERROR'
      )
    );
  }
};

/**
 * Middleware to verify CSRF token
 * Should be used on state-changing requests (POST, PUT, DELETE, PATCH)
 */
export const verifyCSRFToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Skip CSRF verification for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Get CSRF token from cookie
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];

    // Get CSRF token from header
    const headerToken = req.get(CSRF_HEADER_NAME);

    // Check if both tokens exist
    if (!cookieToken) {
      logger.warn('CSRF verification failed: Missing cookie token', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Log security event
      securityAudit.logCSRFEvent(
        req,
        SecurityEventType.CSRF_TOKEN_MISSING,
        'CSRF token missing from cookie'
      );

      throw new AppError(
        'CSRF token missing from cookie',
        403,
        'CSRF_TOKEN_MISSING_COOKIE'
      );
    }

    if (!headerToken) {
      logger.warn('CSRF verification failed: Missing header token', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Log security event
      securityAudit.logCSRFEvent(
        req,
        SecurityEventType.CSRF_TOKEN_MISSING,
        'CSRF token missing from header'
      );

      throw new AppError(
        'CSRF token missing from header',
        403,
        'CSRF_TOKEN_MISSING_HEADER'
      );
    }

    // Verify tokens match using constant-time comparison
    if (
      !crypto.timingSafeEqual(
        Buffer.from(cookieToken),
        Buffer.from(headerToken)
      )
    ) {
      logger.warn('CSRF verification failed: Token mismatch', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        cookieTokenLength: cookieToken.length,
        headerTokenLength: headerToken.length,
      });

      // Log security event for potential CSRF attack
      securityAudit.logCSRFEvent(
        req,
        SecurityEventType.CSRF_ATTACK_ATTEMPT,
        'CSRF token mismatch - potential attack'
      );

      throw new AppError(
        'CSRF token verification failed',
        403,
        'CSRF_TOKEN_MISMATCH'
      );
    }

    // Verify token format (hex string of correct length)
    const tokenRegex = new RegExp(`^[a-f0-9]{${CSRF_TOKEN_LENGTH * 2}}$`);
    if (!tokenRegex.test(cookieToken)) {
      logger.warn('CSRF verification failed: Invalid token format', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Log security event
      securityAudit.logCSRFEvent(
        req,
        SecurityEventType.CSRF_TOKEN_INVALID,
        'Invalid CSRF token format'
      );

      throw new AppError(
        'Invalid CSRF token format',
        403,
        'CSRF_TOKEN_INVALID_FORMAT'
      );
    }

    logger.debug('CSRF token verified successfully', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Error in CSRF token verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
      });

      next(
        new AppError(
          'CSRF token verification failed',
          500,
          'CSRF_VERIFICATION_ERROR'
        )
      );
    }
  }
};

/**
 * Middleware to conditionally apply CSRF protection
 * Applies CSRF protection only to authenticated requests
 */
export const conditionalCSRFProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Apply CSRF protection only if user is authenticated
  if (req.user) {
    return verifyCSRFToken(req, res, next);
  }

  // Skip CSRF protection for unauthenticated requests
  next();
};

/**
 * Middleware to apply CSRF protection to specific routes
 * Use this for routes that need CSRF protection regardless of authentication
 */
export const requireCSRFProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  return verifyCSRFToken(req, res, next);
};

/**
 * Helper function to get CSRF token for client-side use
 */
export const getCSRFTokenFromRequest = (req: Request): string | null => {
  return req.csrfToken || null;
};

/**
 * Middleware to add CSRF token to API responses
 * Useful for SPA applications that need the token for subsequent requests
 */
export const includeCSRFTokenInResponse = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to include CSRF token
  res.json = function (body: any) {
    if (
      req.csrfToken &&
      body &&
      typeof body === 'object' &&
      body.success !== false
    ) {
      body.csrfToken = req.csrfToken;
    }
    return originalJson(body);
  };

  next();
};

/**
 * Configuration for different CSRF protection levels
 */
export const csrfConfig = {
  // Strict CSRF protection for all state-changing operations
  strict: [setCSRFToken, verifyCSRFToken],

  // Conditional CSRF protection (only for authenticated users)
  conditional: [setCSRFToken, conditionalCSRFProtection],

  // Token generation only (for GET requests that render forms)
  tokenOnly: [setCSRFToken, includeCSRFTokenInResponse],

  // No CSRF protection (for public APIs)
  none: [],
};
