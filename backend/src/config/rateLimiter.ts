import rateLimit from 'express-rate-limit';
import logger from './logger.js';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(
      `Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`
    );
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString(),
      },
    });
  },
});

// Strict rate limiter for sensitive endpoints (like Aadhar check)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts from this IP, please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(
      `Strict rate limit exceeded for IP: ${req.ip}, Endpoint: ${req.path}, User-Agent: ${req.get('User-Agent')}`
    );
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many attempts from this IP, please try again later.',
        timestamp: new Date().toISOString(),
      },
    });
  },
});

// Auth rate limiter for login attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts from this IP, please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(
      `Auth rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`
    );
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message:
          'Too many login attempts from this IP, please try again later.',
        timestamp: new Date().toISOString(),
      },
    });
  },
});

// Aadhar check rate limiter - specific for Aadhar validation endpoint
export const aadharCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // Limit each IP to 8 Aadhar checks per windowMs (slightly more restrictive than strict limiter)
  message: {
    success: false,
    error: {
      code: 'AADHAR_CHECK_RATE_LIMIT_EXCEEDED',
      message:
        'Too many Aadhar check attempts from this IP, please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests to prevent abuse
  handler: (req, res) => {
    logger.warn(
      `Aadhar check rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`
    );
    res.status(429).json({
      success: false,
      error: {
        code: 'AADHAR_CHECK_RATE_LIMIT_EXCEEDED',
        message:
          'Too many Aadhar check attempts from this IP, please try again later.',
        timestamp: new Date().toISOString(),
      },
    });
  },
});

// Document upload rate limiter - specific for file upload endpoints
export const documentUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 document uploads per windowMs
  message: {
    success: false,
    error: {
      code: 'DOCUMENT_UPLOAD_RATE_LIMIT_EXCEEDED',
      message:
        'Too many document upload attempts from this IP, please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests to prevent abuse
  handler: (req, res) => {
    logger.warn(
      `Document upload rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`
    );
    res.status(429).json({
      success: false,
      error: {
        code: 'DOCUMENT_UPLOAD_RATE_LIMIT_EXCEEDED',
        message:
          'Too many document upload attempts from this IP, please try again later.',
        timestamp: new Date().toISOString(),
      },
    });
  },
});
