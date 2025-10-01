import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';
import {
  securityAudit,
  SecurityEventType,
} from '../services/securityAuditService.js';

/**
 * Comprehensive input sanitization utilities
 * Prevents XSS, SQL injection, and other malicious input attacks
 */

// HTML sanitization options
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [], // No HTML tags allowed
  ALLOWED_ATTR: [], // No attributes allowed
  KEEP_CONTENT: true, // Keep text content
  ALLOW_DATA_ATTR: false, // No data attributes
  ALLOW_UNKNOWN_PROTOCOLS: false, // Only allow known protocols
  SANITIZE_DOM: true, // Sanitize DOM
  WHOLE_DOCUMENT: false, // Don't treat as whole document
  RETURN_DOM: false, // Return string, not DOM
  RETURN_DOM_FRAGMENT: false, // Return string, not fragment
  RETURN_DOM_IMPORT: false, // Return string, not import
  RETURN_TRUSTED_TYPE: false, // Return string, not trusted type
};

/**
 * Sanitize string input to prevent XSS attacks
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // HTML sanitization using DOMPurify
  sanitized = DOMPurify.sanitize(sanitized, SANITIZE_OPTIONS);

  // Additional XSS prevention
  sanitized = validator.escape(sanitized);

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') {
    return '';
  }

  // Basic sanitization
  let sanitized = sanitizeString(email);

  // Normalize email
  if (validator.isEmail(sanitized)) {
    sanitized = validator.normalizeEmail(sanitized) || sanitized;
  }

  return sanitized;
};

/**
 * Sanitize phone number input
 */
export const sanitizePhoneNumber = (phone: string): string => {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  let sanitized = phone.replace(/\D/g, '');

  // Limit length to prevent buffer overflow
  sanitized = sanitized.substring(0, 15);

  return sanitized;
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (input: any): number | null => {
  if (typeof input === 'number' && !isNaN(input) && isFinite(input)) {
    return input;
  }

  if (typeof input === 'string') {
    const parsed = parseFloat(input);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

/**
 * Sanitize boolean input
 */
export const sanitizeBoolean = (input: any): boolean => {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }

  if (typeof input === 'number') {
    return input !== 0;
  }

  return false;
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number') {
    return sanitizeNumber(obj);
  }

  if (typeof obj === 'boolean') {
    return sanitizeBoolean(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key name
      const sanitizedKey = sanitizeString(key);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeRequestBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (req.body && typeof req.body === 'object') {
      const originalBody = JSON.stringify(req.body);
      req.body = sanitizeObject(req.body);
      const sanitizedBody = JSON.stringify(req.body);

      // Log if significant sanitization occurred
      if (originalBody !== sanitizedBody) {
        logger.warn('Request body sanitization performed', {
          requestId: req.requestId || 'unknown',
          url: req.url,
          method: req.method,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          sanitizationPerformed: true,
        });

        // Only log security event if request has been properly initialized
        if (req.requestId) {
          securityAudit.logInputValidationEvent(
            req,
            SecurityEventType.INPUT_SANITIZATION,
            'Request body sanitization performed',
            true
          );
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Error in request body sanitization', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId || 'unknown',
      url: req.url,
      method: req.method,
      ip: req.ip || 'unknown',
    });

    next(error);
  }
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQueryParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (req.query && typeof req.query === 'object') {
      const originalQuery = JSON.stringify(req.query);
      const sanitizedQuery = sanitizeObject(req.query);
      const sanitizedQueryStr = JSON.stringify(sanitizedQuery);

      // Store sanitized query in a custom property instead of modifying req.query
      (req as any).sanitizedQuery = sanitizedQuery;

      // Log if significant sanitization occurred
      if (originalQuery !== sanitizedQueryStr) {
        logger.warn('Query parameters sanitization performed', {
          requestId: req.requestId || 'unknown',
          url: req.url,
          method: req.method,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          sanitizationPerformed: true,
        });

        // Only log security event if request has been properly initialized
        if (req.requestId) {
          securityAudit.logInputValidationEvent(
            req,
            SecurityEventType.INPUT_SANITIZATION,
            'Query parameters sanitization performed',
            true
          );
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Error in query parameters sanitization', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId || 'unknown',
      url: req.url,
      method: req.method,
      ip: req.ip || 'unknown',
    });

    next(error);
  }
};

/**
 * Middleware to sanitize URL parameters
 */
export const sanitizeUrlParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (req.params && typeof req.params === 'object') {
      const originalParams = JSON.stringify(req.params);
      req.params = sanitizeObject(req.params);
      const sanitizedParams = JSON.stringify(req.params);

      // Log if significant sanitization occurred
      if (originalParams !== sanitizedParams) {
        logger.warn('URL parameters sanitization performed', {
          requestId: req.requestId || 'unknown',
          url: req.url,
          method: req.method,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          sanitizationPerformed: true,
        });

        // Only log security event if request has been properly initialized
        if (req.requestId) {
          securityAudit.logInputValidationEvent(
            req,
            SecurityEventType.INPUT_SANITIZATION,
            'URL parameters sanitization performed',
            true
          );
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Error in URL parameters sanitization', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId || 'unknown',
      url: req.url,
      method: req.method,
      ip: req.ip || 'unknown',
    });

    next(error);
  }
};

/**
 * Combined sanitization middleware for all request inputs
 */
export const sanitizeAllInputs = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  sanitizeRequestBody(req, res, err => {
    if (err) return next(err);

    sanitizeQueryParams(req, res, err => {
      if (err) return next(err);

      sanitizeUrlParams(req, res, next);
    });
  });
};

/**
 * Validate and sanitize specific field types
 */
export const fieldSanitizers = {
  aadhar: (input: string): string => {
    const sanitized = sanitizeString(input);
    return sanitized.replace(/\D/g, '').substring(0, 12);
  },

  contact: (input: string): string => {
    const sanitized = sanitizeString(input);
    return sanitized.replace(/\D/g, '').substring(0, 10);
  },

  email: (input: string): string => {
    return sanitizeEmail(input);
  },

  name: (input: string): string => {
    const sanitized = sanitizeString(input);
    // Allow only letters, spaces, dots, apostrophes, and hyphens
    return sanitized.replace(/[^a-zA-Z\s.'-]/g, '').substring(0, 255);
  },

  address: (input: string): string => {
    const sanitized = sanitizeString(input);
    // Allow alphanumeric, spaces, and common address characters
    return sanitized.replace(/[^a-zA-Z0-9\s.,-/#]/g, '').substring(0, 255);
  },

  pincode: (input: string): string => {
    const sanitized = sanitizeString(input);
    return sanitized.replace(/\D/g, '').substring(0, 6);
  },

  epic: (input: string): string => {
    const sanitized = sanitizeString(input).toUpperCase();
    // EPIC format: 3 letters + 7 digits
    return sanitized.replace(/[^A-Z0-9]/g, '').substring(0, 10);
  },
};
