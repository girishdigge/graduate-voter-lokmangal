import { CorsOptions } from 'cors';
import logger from './logger.js';

/**
 * Production-ready CORS configuration
 * Implements secure cross-origin resource sharing policies
 */

// Environment-based origin configuration
const getAllowedOrigins = (): string[] => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    // Production origins from environment variables
    const prodOrigins =
      process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || [];

    if (prodOrigins.length === 0) {
      logger.warn('No CORS origins configured for production environment');
      return [];
    }

    return prodOrigins;
  } else if (nodeEnv === 'staging') {
    // Staging origins
    const stagingOrigins = process.env.CORS_STAGING_ORIGIN?.split(',').map(
      origin => origin.trim()
    ) || [
      'https://staging-public.voter-management.com',
      'https://staging-admin.voter-management.com',
    ];

    return stagingOrigins;
  } else {
    // Development origins
    return [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ];
  }
};

// Dynamic origin validation function
const originValidator = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  const allowedOrigins = getAllowedOrigins();

  // Allow requests with no origin (mobile apps, Postman, etc.) only in development
  if (!origin) {
    const allowNoOrigin = process.env.NODE_ENV !== 'production';

    if (allowNoOrigin) {
      logger.debug('Request with no origin allowed (development mode)');
      return callback(null, true);
    } else {
      logger.warn('Request with no origin blocked (production mode)');
      return callback(new Error('Origin required in production'), false);
    }
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    logger.debug('CORS request allowed', { origin });
    return callback(null, true);
  }

  // Check for wildcard patterns in production (if configured)
  const wildcardPatterns = process.env.CORS_WILDCARD_PATTERNS?.split(',') || [];
  for (const pattern of wildcardPatterns) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    if (regex.test(origin)) {
      logger.debug('CORS request allowed via wildcard pattern', {
        origin,
        pattern,
      });
      return callback(null, true);
    }
  }

  // Log blocked origin for security monitoring
  logger.warn('CORS request blocked - origin not allowed', {
    origin,
    allowedOrigins,
  });

  callback(new Error('Not allowed by CORS policy'), false);
};

// Main CORS configuration
export const corsConfig: CorsOptions = {
  origin: originValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Cache-Control',
    'X-Mx-ReqToken',
    'Keep-Alive',
    'If-Modified-Since',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-CSRF-Token',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// CORS security monitoring
export const corsSecurityMonitoring = (req: any, res: any, next: any) => {
  const origin = req.get('Origin');
  const referer = req.get('Referer');

  // Log CORS requests for monitoring
  if (origin || referer) {
    logger.debug('CORS request detected', {
      origin,
      referer,
      method: req.method,
      path: req.path,
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    });
  }

  // Detect potential CORS attacks
  if (origin && referer) {
    try {
      const originUrl = new URL(origin);
      const refererUrl = new URL(referer);

      // Check if origin and referer domains match
      if (originUrl.hostname !== refererUrl.hostname) {
        logger.warn('CORS request with mismatched origin and referer', {
          origin,
          referer,
          originHostname: originUrl.hostname,
          refererHostname: refererUrl.hostname,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
        });
      }
    } catch (error) {
      logger.warn('Invalid origin or referer URL in CORS request', {
        origin,
        referer,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip || 'unknown',
      });
    }
  }

  next();
};

// Export configuration based on environment
export const getCorsConfig = (): CorsOptions => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    return {
      ...corsConfig,
      origin: originValidator,
      credentials: true,
      maxAge: 86400,
    };
  } else if (nodeEnv === 'staging') {
    return {
      ...corsConfig,
      origin: originValidator,
      credentials: true,
      maxAge: 3600,
    };
  } else {
    return {
      ...corsConfig,
      origin: originValidator,
      credentials: true,
      maxAge: 0, // No caching in development
    };
  }
};
