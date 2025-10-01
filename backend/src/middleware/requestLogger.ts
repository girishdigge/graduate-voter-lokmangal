import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request interface to include request ID and correlation ID
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      correlationId?: string;
      startTime?: number;
    }
  }
}

/**
 * Enhanced middleware to log HTTP requests with correlation IDs and monitoring
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;

  // Generate or extract correlation ID for request tracing
  const correlationId =
    req.get('X-Correlation-ID') || req.get('X-Request-ID') || uuidv4();
  req.correlationId = correlationId;

  // Store start time for performance monitoring
  const startTime = Date.now();
  req.startTime = startTime;

  // Add correlation headers to response
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', correlationId);

  // Enhanced request logging with security context
  const requestInfo = {
    requestId,
    correlationId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    origin: req.get('Origin'),
    acceptLanguage: req.get('Accept-Language'),
    userId: req.user?.userId,
    userType: req.user?.type,
    userRole: req.user?.role,
    timestamp: new Date().toISOString(),
    // Security monitoring fields
    hasAuthHeader: !!req.get('Authorization'),
    hasCSRFToken: !!req.get('X-CSRF-Token'),
    queryParamCount: Object.keys(req.query).length,
    bodySize: req.get('Content-Length')
      ? parseInt(req.get('Content-Length')!)
      : 0,
  };

  logger.http('Request started', requestInfo);

  // Monitor for suspicious request patterns
  monitorSuspiciousPatterns(req, requestInfo);

  // Override res.end to log response with enhanced metrics
  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    const responseSize = res.get('Content-Length')
      ? parseInt(res.get('Content-Length')!)
      : 0;

    // Enhanced response logging
    const responseInfo = {
      requestId,
      correlationId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      durationMs: duration,
      contentLength: res.get('Content-Length'),
      contentType: res.get('Content-Type'),
      responseSize,
      userId: req.user?.userId,
      userType: req.user?.type,
      userRole: req.user?.role,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      // Performance metrics
      isSlowRequest: duration > 1000, // Requests taking more than 1 second
      isLargeResponse: responseSize > 1024 * 1024, // Responses larger than 1MB
      // Security metrics
      isErrorResponse: res.statusCode >= 400,
      isServerError: res.statusCode >= 500,
      isAuthError: res.statusCode === 401 || res.statusCode === 403,
      isRateLimited: res.statusCode === 429,
    };

    // Log with appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', responseInfo);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', responseInfo);
    } else if (duration > 5000) {
      logger.warn('Request completed (slow)', responseInfo);
    } else {
      logger.http('Request completed', responseInfo);
    }

    // Performance monitoring alerts
    if (duration > 10000) {
      logger.error('Very slow request detected', {
        ...responseInfo,
        alertType: 'PERFORMANCE',
        threshold: '10s',
      });
    }

    // Security monitoring alerts
    if (res.statusCode === 429) {
      logger.warn('Rate limit exceeded', {
        ...responseInfo,
        alertType: 'SECURITY',
        reason: 'RATE_LIMIT',
      });
    }

    // Call original end method
    return originalEnd(chunk, encoding, cb);
  } as any;

  next();
};

/**
 * Monitor for suspicious request patterns
 */
const monitorSuspiciousPatterns = (req: Request, requestInfo: any): void => {
  // Monitor for potential attacks
  const suspiciousIndicators = [];

  // Check for SQL injection patterns in URL
  if (
    /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b)/i.test(
      req.url
    )
  ) {
    suspiciousIndicators.push('SQL_INJECTION_URL');
  }

  // Check for XSS patterns in URL
  if (/<script|javascript:|vbscript:|onload=|onerror=/i.test(req.url)) {
    suspiciousIndicators.push('XSS_URL');
  }

  // Check for path traversal attempts
  if (/(\.\.\/)|(\.\.\\)|(%2e%2e%2f)|(%2e%2e%5c)/i.test(req.url)) {
    suspiciousIndicators.push('PATH_TRAVERSAL');
  }

  // Check for unusual user agents
  const userAgent = req.get('User-Agent') || '';
  if (userAgent.length === 0 || /bot|crawler|spider|scraper/i.test(userAgent)) {
    suspiciousIndicators.push('SUSPICIOUS_USER_AGENT');
  }

  // Check for missing common headers (potential bot)
  if (!req.get('Accept') || !req.get('Accept-Language')) {
    suspiciousIndicators.push('MISSING_COMMON_HEADERS');
  }

  // Check for excessive query parameters (potential DoS)
  if (Object.keys(req.query).length > 50) {
    suspiciousIndicators.push('EXCESSIVE_QUERY_PARAMS');
  }

  // Check for large request body (potential DoS)
  const contentLength = parseInt(req.get('Content-Length') || '0');
  if (contentLength > 50 * 1024 * 1024) {
    // 50MB
    suspiciousIndicators.push('LARGE_REQUEST_BODY');
  }

  // Log suspicious activity
  if (suspiciousIndicators.length > 0) {
    logger.warn('Suspicious request pattern detected', {
      ...requestInfo,
      suspiciousIndicators,
      alertType: 'SECURITY',
      severity: suspiciousIndicators.length > 2 ? 'HIGH' : 'MEDIUM',
    });
  }
};

/**
 * Middleware to log sensitive operations (for audit purposes)
 */
export const auditLogger = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Log the sensitive operation
    logger.info('Audit log', {
      operation,
      requestId: req.requestId,
      userId: req.user?.userId,
      userType: req.user?.type,
      userRole: req.user?.role,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      params: req.params,
      query: req.query,
      // Don't log request body as it might contain sensitive data
    });

    next();
  };
};
