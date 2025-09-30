import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request interface to include request ID
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Middleware to log HTTP requests
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  const startTime = Date.now();

  // Log request start
  logger.http('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    userId: req.user?.userId,
    userType: req.user?.type,
  });

  // Override res.end to log response
  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;

    // Log response
    logger.http('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user?.userId,
      userType: req.user?.type,
    });

    // Call original end method
    return originalEnd(chunk, encoding, cb);
  } as any;

  next();
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
