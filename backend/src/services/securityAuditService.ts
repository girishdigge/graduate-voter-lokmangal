import logger from '../config/logger.js';
import { Request } from 'express';

/**
 * Security Audit Service
 * Comprehensive security event logging and monitoring
 */

export interface SecurityEvent {
  eventType: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  adminId?: string;
  ip: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  url?: string;
  method?: string;
  additionalData?: Record<string, any>;
  timestamp: string;
}

export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGIN_BRUTE_FORCE = 'LOGIN_BRUTE_FORCE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',

  // Authorization Events
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  ADMIN_ACTION = 'ADMIN_ACTION',

  // Input Validation Events
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
  MALICIOUS_INPUT = 'MALICIOUS_INPUT',
  INPUT_SANITIZATION = 'INPUT_SANITIZATION',

  // CSRF Events
  CSRF_TOKEN_MISSING = 'CSRF_TOKEN_MISSING',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  CSRF_ATTACK_ATTEMPT = 'CSRF_ATTACK_ATTEMPT',

  // Rate Limiting Events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_BYPASS_ATTEMPT = 'RATE_LIMIT_BYPASS_ATTEMPT',

  // File Upload Events
  MALICIOUS_FILE_UPLOAD = 'MALICIOUS_FILE_UPLOAD',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',

  // Data Access Events
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  BULK_DATA_ACCESS = 'BULK_DATA_ACCESS',

  // System Events
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  PERFORMANCE_ANOMALY = 'PERFORMANCE_ANOMALY',

  // Network Events
  SUSPICIOUS_IP = 'SUSPICIOUS_IP',
  CORS_VIOLATION = 'CORS_VIOLATION',
  UNUSUAL_USER_AGENT = 'UNUSUAL_USER_AGENT',

  // Application Events
  FEATURE_ABUSE = 'FEATURE_ABUSE',
  UNUSUAL_BEHAVIOR = 'UNUSUAL_BEHAVIOR',
  SECURITY_SCAN_DETECTED = 'SECURITY_SCAN_DETECTED',
}

/**
 * Log security event with structured data
 */
export const logSecurityEvent = (event: SecurityEvent): void => {
  const logData = {
    securityEvent: true,
    eventType: event.eventType,
    severity: event.severity,
    description: event.description,
    userId: event.userId,
    adminId: event.adminId,
    ip: event.ip,
    userAgent: event.userAgent,
    requestId: event.requestId,
    correlationId: event.correlationId,
    url: event.url,
    method: event.method,
    timestamp: event.timestamp,
    ...event.additionalData,
  };

  // Log with appropriate level based on severity
  switch (event.severity) {
    case 'CRITICAL':
      logger.error('SECURITY EVENT - CRITICAL', logData);
      break;
    case 'HIGH':
      logger.error('SECURITY EVENT - HIGH', logData);
      break;
    case 'MEDIUM':
      logger.warn('SECURITY EVENT - MEDIUM', logData);
      break;
    case 'LOW':
      logger.info('SECURITY EVENT - LOW', logData);
      break;
    default:
      logger.info('SECURITY EVENT', logData);
  }

  // Additional alerting for critical events
  if (event.severity === 'CRITICAL') {
    // In production, this could trigger alerts to security team
    logger.error('CRITICAL SECURITY EVENT - IMMEDIATE ATTENTION REQUIRED', {
      ...logData,
      alert: true,
      requiresImmediateAttention: true,
    });
  }
};

/**
 * Create security event from Express request
 */
export const createSecurityEventFromRequest = (
  req: Request,
  eventType: SecurityEventType,
  severity: SecurityEvent['severity'],
  description: string,
  additionalData?: Record<string, any>
): SecurityEvent => {
  return {
    eventType,
    severity,
    description,
    userId: req.user?.userId,
    adminId: req.user?.type === 'admin' ? req.user.userId : undefined,
    ip: req.ip || 'unknown',
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
    correlationId: req.correlationId,
    url: req.url,
    method: req.method,
    additionalData,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Log authentication events
 */
export const logAuthenticationEvent = (
  req: Request,
  success: boolean,
  userId?: string,
  reason?: string
): void => {
  const event = createSecurityEventFromRequest(
    req,
    success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
    success ? 'LOW' : 'MEDIUM',
    success ? 'User authentication successful' : 'User authentication failed',
    {
      userId,
      reason,
      authenticationMethod: req.path.includes('admin') ? 'admin' : 'user',
    }
  );

  logSecurityEvent(event);
};

/**
 * Log authorization events
 */
export const logAuthorizationEvent = (
  req: Request,
  success: boolean,
  requiredPermission?: string,
  reason?: string
): void => {
  const event = createSecurityEventFromRequest(
    req,
    success
      ? SecurityEventType.ADMIN_ACTION
      : SecurityEventType.PERMISSION_DENIED,
    success ? 'LOW' : 'MEDIUM',
    success ? 'Authorization successful' : 'Authorization denied',
    {
      requiredPermission,
      reason,
      userRole: req.user?.role,
    }
  );

  logSecurityEvent(event);
};

/**
 * Log input validation events
 */
export const logInputValidationEvent = (
  req: Request,
  eventType: SecurityEventType,
  details: string,
  sanitized: boolean = false
): void => {
  const severity: SecurityEvent['severity'] =
    eventType === SecurityEventType.XSS_ATTEMPT ||
    eventType === SecurityEventType.SQL_INJECTION_ATTEMPT
      ? 'HIGH'
      : 'MEDIUM';

  const event = createSecurityEventFromRequest(
    req,
    eventType,
    severity,
    `Input validation event: ${details}`,
    {
      sanitized,
      inputValidationDetails: details,
    }
  );

  logSecurityEvent(event);
};

/**
 * Log CSRF events
 */
export const logCSRFEvent = (
  req: Request,
  eventType: SecurityEventType,
  details: string
): void => {
  const event = createSecurityEventFromRequest(
    req,
    eventType,
    'HIGH',
    `CSRF protection event: ${details}`,
    {
      csrfDetails: details,
      hasCSRFCookie: !!req.cookies['csrf-token'],
      hasCSRFHeader: !!req.get('X-CSRF-Token'),
    }
  );

  logSecurityEvent(event);
};

/**
 * Log rate limiting events
 */
export const logRateLimitEvent = (
  req: Request,
  limitType: string,
  details: string
): void => {
  const event = createSecurityEventFromRequest(
    req,
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    'MEDIUM',
    `Rate limit exceeded: ${details}`,
    {
      limitType,
      rateLimitDetails: details,
    }
  );

  logSecurityEvent(event);
};

/**
 * Log file upload security events
 */
export const logFileUploadEvent = (
  req: Request,
  eventType: SecurityEventType,
  filename: string,
  details: string
): void => {
  const severity: SecurityEvent['severity'] =
    eventType === SecurityEventType.MALICIOUS_FILE_UPLOAD ? 'HIGH' : 'MEDIUM';

  const event = createSecurityEventFromRequest(
    req,
    eventType,
    severity,
    `File upload security event: ${details}`,
    {
      filename,
      fileUploadDetails: details,
    }
  );

  logSecurityEvent(event);
};

/**
 * Log data access events
 */
export const logDataAccessEvent = (
  req: Request,
  dataType: string,
  recordCount?: number,
  sensitive: boolean = false
): void => {
  const event = createSecurityEventFromRequest(
    req,
    SecurityEventType.SENSITIVE_DATA_ACCESS,
    sensitive ? 'MEDIUM' : 'LOW',
    `Data access: ${dataType}`,
    {
      dataType,
      recordCount,
      sensitive,
    }
  );

  logSecurityEvent(event);
};

/**
 * Log suspicious network activity
 */
export const logNetworkSecurityEvent = (
  req: Request,
  eventType: SecurityEventType,
  details: string
): void => {
  const event = createSecurityEventFromRequest(
    req,
    eventType,
    'MEDIUM',
    `Network security event: ${details}`,
    {
      networkSecurityDetails: details,
      origin: req.get('Origin'),
      referer: req.get('Referer'),
    }
  );

  logSecurityEvent(event);
};

/**
 * Log system security events
 */
export const logSystemSecurityEvent = (
  eventType: SecurityEventType,
  severity: SecurityEvent['severity'],
  description: string,
  additionalData?: Record<string, any>
): void => {
  const event: SecurityEvent = {
    eventType,
    severity,
    description,
    ip: 'system',
    timestamp: new Date().toISOString(),
    additionalData,
  };

  logSecurityEvent(event);
};

/**
 * Security metrics aggregation
 */
export const getSecurityMetrics = () => {
  // This would typically query a security events database
  // For now, we'll return a placeholder structure
  return {
    last24Hours: {
      totalEvents: 0,
      criticalEvents: 0,
      highSeverityEvents: 0,
      authenticationFailures: 0,
      rateLimitExceeded: 0,
      maliciousInputAttempts: 0,
    },
    topThreats: [],
    suspiciousIPs: [],
    alertsGenerated: 0,
  };
};

/**
 * Export all security audit functions
 */
export const securityAudit = {
  logSecurityEvent,
  createSecurityEventFromRequest,
  logAuthenticationEvent,
  logAuthorizationEvent,
  logInputValidationEvent,
  logCSRFEvent,
  logRateLimitEvent,
  logFileUploadEvent,
  logDataAccessEvent,
  logNetworkSecurityEvent,
  logSystemSecurityEvent,
  getSecurityMetrics,
};
