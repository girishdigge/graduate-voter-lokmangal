import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import logger from './logger.js';

/**
 * Enhanced Security Configuration
 * Comprehensive security headers and policies for production deployment
 */

// Content Security Policy configuration
const getCSPDirectives = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];

  return {
    defaultSrc: ["'self'"],

    // Script sources - more restrictive in production
    scriptSrc: isProduction
      ? ["'self'", "'unsafe-inline'"] // Remove unsafe-inline in production if possible
      : ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow eval for development

    // Style sources
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],

    // Font sources
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],

    // Image sources
    imgSrc: [
      "'self'",
      'data:',
      'https:',
      'blob:',
      // Add S3 bucket domains
      ...(process.env.AWS_S3_BUCKET_NAME
        ? [`https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com`]
        : []),
      ...(process.env.AWS_CLOUDFRONT_DOMAIN
        ? [`https://${process.env.AWS_CLOUDFRONT_DOMAIN}`]
        : []),
    ],

    // Connect sources (for API calls)
    connectSrc: [
      "'self'",
      // Add API domains
      ...allowedDomains.map(domain => `https://${domain}`),
      // Add WhatsApp API if configured
      ...(process.env.WHATSAPP_API_URL ? [process.env.WHATSAPP_API_URL] : []),
    ],

    // Media sources
    mediaSrc: ["'self'", 'blob:', 'data:'],

    // Object sources - block all for security
    objectSrc: ["'none'"],

    // Frame sources - block all for security
    frameSrc: ["'none'"],

    // Base URI - restrict to self
    baseUri: ["'self'"],

    // Form action - restrict to self and allowed domains
    formAction: [
      "'self'",
      ...allowedDomains.map(domain => `https://${domain}`),
    ],

    // Frame ancestors - prevent clickjacking
    frameAncestors: ["'none'"],

    // Upgrade insecure requests in production
    ...(isProduction && { upgradeInsecureRequests: [] }),

    // Block mixed content in production
    ...(isProduction && { blockAllMixedContent: [] }),
  };
};

// Helmet configuration for enhanced security
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: getCSPDirectives(),
    reportOnly: process.env.NODE_ENV !== 'production', // Report-only in development
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabled for file uploads compatibility

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for API

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Note: Expect-CT is deprecated, but we can add it as a custom header if needed

  // Note: Permissions Policy is handled via custom headers in additionalSecurityHeaders

  // Frame Options
  frameguard: { action: 'deny' },

  // Hide Powered-By header
  hidePoweredBy: true,

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // No Sniff
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // X-XSS-Protection (legacy but still useful)
  xssFilter: true,
});

/**
 * Additional security headers middleware
 */
export const additionalSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Server information hiding
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=self, microphone=self, geolocation=self, payment=(), usb=(), ' +
      'magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), ' +
      'autoplay=(), encrypted-media=(), fullscreen=self, picture-in-picture=()'
  );

  // Cache control for sensitive endpoints
  if (req.path.includes('/admin') || req.path.includes('/api/users')) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  // CORS preflight cache control
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // Security headers for file uploads
  if (req.path.includes('/documents') && req.method === 'POST') {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
  }

  next();
};

/**
 * Security monitoring middleware
 */
export const securityMonitoring = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /(<script|javascript:|vbscript:|onload=|onerror=)/i, // XSS attempts
    /(union|select|insert|update|delete|drop|create|alter)/i, // SQL injection attempts
    /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i, // Path traversal attempts
    /(<iframe|<object|<embed|<applet)/i, // Embedding attempts
    /(eval\(|expression\(|javascript:)/i, // Code injection attempts
  ];

  const checkForSuspiciousContent = (content: string): boolean => {
    return suspiciousPatterns.some(pattern => pattern.test(content));
  };

  // Check URL for suspicious patterns
  if (checkForSuspiciousContent(req.url)) {
    logger.warn('Suspicious URL pattern detected', {
      requestId: req.requestId,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      suspiciousPattern: 'URL',
    });

    // Import and use security audit service
    import('../services/securityAuditService.js').then(
      ({ securityAudit, SecurityEventType }) => {
        if (
          /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b)/i.test(
            req.url
          )
        ) {
          securityAudit.logInputValidationEvent(
            req,
            SecurityEventType.SQL_INJECTION_ATTEMPT,
            'SQL injection pattern detected in URL'
          );
        } else if (
          /<script|javascript:|vbscript:|onload=|onerror=/i.test(req.url)
        ) {
          securityAudit.logInputValidationEvent(
            req,
            SecurityEventType.XSS_ATTEMPT,
            'XSS pattern detected in URL'
          );
        } else if (/(\.\.\/)|(\.\.\\)|(%2e%2e%2f)|(%2e%2e%5c)/i.test(req.url)) {
          securityAudit.logInputValidationEvent(
            req,
            SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
            'Path traversal pattern detected in URL'
          );
        } else {
          securityAudit.logInputValidationEvent(
            req,
            SecurityEventType.MALICIOUS_INPUT,
            'Suspicious pattern detected in URL'
          );
        }
      }
    );
  }

  // Check headers for suspicious patterns
  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === 'string' && checkForSuspiciousContent(value)) {
      logger.warn('Suspicious header content detected', {
        requestId: req.requestId,
        header: key,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        suspiciousPattern: 'HEADER',
      });

      // Log security event for suspicious header content
      import('../services/securityAuditService.js').then(
        ({ securityAudit, SecurityEventType }) => {
          securityAudit.logInputValidationEvent(
            req,
            SecurityEventType.MALICIOUS_INPUT,
            `Suspicious content in header: ${key}`
          );
        }
      );
    }
  });

  // Check for common attack headers
  const attackHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-originating-ip',
    'x-remote-ip',
    'x-client-ip',
  ];

  attackHeaders.forEach(header => {
    const value = req.get(header);
    if (value && value.includes(',')) {
      logger.warn('Potential IP spoofing attempt detected', {
        requestId: req.requestId,
        header,
        value,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
  });

  next();
};

/**
 * Rate limiting bypass detection
 */
export const rateLimitBypassDetection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check for common rate limiting bypass headers
  const bypassHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-originating-ip',
    'x-remote-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'true-client-ip',
    'x-cluster-client-ip',
  ];

  let suspiciousHeaderCount = 0;
  bypassHeaders.forEach(header => {
    if (req.get(header)) {
      suspiciousHeaderCount++;
    }
  });

  // Log if multiple IP headers are present (potential bypass attempt)
  if (suspiciousHeaderCount > 2) {
    logger.warn('Potential rate limiting bypass attempt detected', {
      requestId: req.requestId,
      suspiciousHeaderCount,
      headers: bypassHeaders.filter(h => req.get(h)),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Log security event for rate limit bypass attempt
    import('../services/securityAuditService.js').then(
      ({ securityAudit, SecurityEventType }) => {
        securityAudit.logSecurityEvent({
          eventType: SecurityEventType.RATE_LIMIT_BYPASS_ATTEMPT,
          severity: 'MEDIUM',
          description: 'Potential rate limiting bypass attempt detected',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          requestId: req.requestId,
          correlationId: req.correlationId,
          url: req.url,
          method: req.method,
          timestamp: new Date().toISOString(),
          additionalData: {
            suspiciousHeaderCount,
            headers: bypassHeaders.filter(h => req.get(h)),
          },
        });
      }
    );
  }

  next();
};

/**
 * Production security configuration
 */
export const productionSecurityConfig = {
  // Disable server information
  hideServerInfo: true,

  // Enable security headers
  enableSecurityHeaders: true,

  // Enable CSRF protection
  enableCSRFProtection: true,

  // Enable input sanitization
  enableInputSanitization: true,

  // Enable security monitoring
  enableSecurityMonitoring: true,

  // Enable rate limit bypass detection
  enableRateLimitBypassDetection: true,

  // Trusted proxy configuration
  trustedProxies: process.env.TRUSTED_PROXIES?.split(',') || [
    '127.0.0.1',
    '::1',
  ],

  // Security headers configuration
  securityHeaders: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    csp: getCSPDirectives(),
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    xssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
  },
};
