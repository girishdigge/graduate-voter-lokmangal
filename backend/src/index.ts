import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import configuration and middleware
import logger from './config/logger.js';
import { generalLimiter } from './config/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { initializeS3 } from './config/aws.js';

// Import security middleware
import {
  helmetConfig,
  additionalSecurityHeaders,
  securityMonitoring,
  rateLimitBypassDetection,
} from './config/security.js';
import { getCorsConfig, corsSecurityMonitoring } from './config/cors.js';
import { sanitizeAllInputs } from './utils/sanitization.js';
import { setCSRFToken } from './middleware/csrfProtection.js';

// Load environment variables
dotenv.config();

// Validate environment configuration
import { validateEnvironment } from './config/env.js';
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses (important for rate limiting and security)
const trustedProxies = process.env.TRUSTED_PROXIES?.split(',') || [
  '127.0.0.1',
  '::1',
];
app.set('trust proxy', trustedProxies);

// Security monitoring middleware (before other middleware)
app.use(securityMonitoring);
app.use(rateLimitBypassDetection);

// Enhanced security headers
app.use(helmetConfig);
app.use(additionalSecurityHeaders);

// Compression middleware
app.use(compression());

// Cookie parser for CSRF tokens
app.use(cookieParser());

// Enhanced CORS configuration with security monitoring
app.use(corsSecurityMonitoring);
app.use(cors(getCorsConfig()));

// Rate limiting (after CORS to allow preflight requests)
app.use(generalLimiter);

// Request parsing middleware with enhanced security
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      // Enhanced payload monitoring
      const sizeInMB = buf.length / (1024 * 1024);

      if (sizeInMB > 1) {
        logger.warn('Large request payload detected', {
          size: `${sizeInMB.toFixed(2)}MB`,
          url: req.url,
          method: req.method,
          ip: req.ip || 'unknown',
          userAgent: req.get ? req.get('User-Agent') : 'unknown',
        });
      }

      // Monitor for potential DoS attacks
      if (sizeInMB > 5) {
        logger.error('Very large request payload detected - potential DoS', {
          size: `${sizeInMB.toFixed(2)}MB`,
          url: req.url,
          method: req.method,
          ip: req.ip || 'unknown',
          userAgent: req.get ? req.get('User-Agent') : 'unknown',
          alertType: 'SECURITY',
          severity: 'HIGH',
        });
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 100, // Limit number of parameters to prevent DoS
  })
);

// Request logging middleware (before input sanitization)
app.use(requestLogger);

// Input sanitization middleware (after request parsing, before routes)
app.use(sanitizeAllInputs);

// Health check function
const healthCheckHandler = async (_req: any, res: any) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: 'checking...', // Will be implemented with Prisma
      s3: 'checking...', // Will be tested
    },
  };

  try {
    // Test S3 connection (non-blocking)
    const { testS3Connection } = await import('./config/aws.js');
    healthCheck.services.s3 = (await testS3Connection())
      ? 'healthy'
      : 'unhealthy';
  } catch (error) {
    healthCheck.services.s3 = 'error';
    logger.error('Health check S3 test failed', { error });
  }

  // Return health status
  const isHealthy = Object.values(healthCheck.services).every(
    status => status === 'healthy' || status === 'checking...'
  );

  res.status(isHealthy ? 200 : 503).json(healthCheck);
};

// Health check endpoints (both /health and /api/health for compatibility)
app.get('/health', setCSRFToken, healthCheckHandler);
app.get('/api/health', setCSRFToken, healthCheckHandler);

// API base endpoint
app.get('/api', setCSRFToken, (_req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Voter Management System API',
      version: '1.0.0',
      status: 'Backend core infrastructure ready',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        api: '/api',
        // More endpoints will be added as features are implemented
      },
    },
  });
});

// API routes
import aadharRoutes from './routes/aadharRoutes.js';
import userRoutes from './routes/userRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import referenceRoutes from './routes/referenceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Import CSRF protection middleware
import { conditionalCSRFProtection } from './middleware/csrfProtection.js';

// Mount API routes with CSRF protection for authenticated routes
app.use('/api/aadhar', aadharRoutes); // Public route - no CSRF needed
app.use('/api/users', conditionalCSRFProtection, userRoutes); // CSRF for authenticated users
app.use('/api/documents', conditionalCSRFProtection, documentRoutes); // CSRF for authenticated users
app.use('/api/references', conditionalCSRFProtection, referenceRoutes); // CSRF for authenticated users
app.use('/api/admin', conditionalCSRFProtection, adminRoutes); // CSRF for authenticated admins

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Enhanced graceful shutdown handling
let server: any;

const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, initiating graceful shutdown`);

  if (server) {
    server.close((err: any) => {
      if (err) {
        logger.error('Error during server shutdown', {
          error: err.message,
          stack: err.stack,
        });
        process.exit(1);
      }

      logger.info('Server closed successfully');

      // Close database connections, cleanup resources, etc.
      // Add any cleanup logic here

      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Enhanced unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection - Critical Error', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
    timestamp: new Date().toISOString(),
    alertType: 'CRITICAL',
    severity: 'HIGH',
  });

  // In production, we might want to restart the process
  if (process.env.NODE_ENV === 'production') {
    logger.error(
      'Unhandled promise rejection in production - initiating shutdown'
    );
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

// Enhanced uncaught exception handler
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception - Critical Error', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    alertType: 'CRITICAL',
    severity: 'HIGH',
  });

  // Uncaught exceptions are serious - always exit
  logger.error('Uncaught exception detected - shutting down immediately');
  process.exit(1);
});

// Memory usage monitoring
const monitorMemoryUsage = () => {
  const usage = process.memoryUsage();
  const usageInMB = {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
  };

  // Log memory usage every 5 minutes
  logger.debug('Memory usage', usageInMB);

  // Alert on high memory usage
  if (usageInMB.heapUsed > 500) {
    // 500MB
    logger.warn('High memory usage detected', {
      ...usageInMB,
      alertType: 'PERFORMANCE',
      severity: 'MEDIUM',
    });
  }

  if (usageInMB.heapUsed > 1000) {
    // 1GB
    logger.error('Very high memory usage detected', {
      ...usageInMB,
      alertType: 'PERFORMANCE',
      severity: 'HIGH',
    });
  }
};

// Monitor memory usage every 5 minutes
setInterval(monitorMemoryUsage, 5 * 60 * 1000);

// Start server
const startServer = async () => {
  try {
    logger.info('Starting Voter Management System API server...');

    // Initialize AWS S3
    await initializeS3();

    // Start listening and store server reference for graceful shutdown
    server = app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      });

      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log(`📝 Logs: ./logs/`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

startServer();
