import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Import configuration and middleware
import logger from './config/logger.js';
import { generalLimiter } from './config/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { initializeS3 } from './config/aws.js';
import {
  initializeElasticsearch,
  testElasticsearchConnection,
} from './config/elasticsearch.js';

// Load environment variables
dotenv.config();

// Validate environment configuration
import { validateEnvironment } from './config/env.js';
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allow embedding for file uploads
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
);

// Compression middleware
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:5173',
        'http://localhost:5174',
      ];

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request from origin', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiting
app.use(generalLimiter);

// Request parsing middleware
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      // Log large payloads
      if (buf.length > 1024 * 1024) {
        // 1MB
        logger.warn('Large request payload detected', {
          size: `${(buf.length / (1024 * 1024)).toFixed(2)}MB`,
          url: req.url,
          method: req.method,
        });
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint (before authentication)
app.get('/health', async (req, res) => {
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
      elasticsearch: 'checking...', // Will be implemented
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

  try {
    // Test Elasticsearch connection (non-blocking)
    healthCheck.services.elasticsearch = (await testElasticsearchConnection())
      ? 'healthy'
      : 'unhealthy';
  } catch (error) {
    healthCheck.services.elasticsearch = 'error';
    logger.error('Health check Elasticsearch test failed', { error });
  }

  // Return health status
  const isHealthy = Object.values(healthCheck.services).every(
    status => status === 'healthy' || status === 'checking...'
  );

  res.status(isHealthy ? 200 : 503).json(healthCheck);
});

// API base endpoint
app.get('/api', (req, res) => {
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

// Mount API routes
app.use('/api/aadhar', aadharRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/references', referenceRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler (must be after all routes)
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise,
  });
});

// Uncaught exception handler
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    logger.info('Starting Voter Management System API server...');

    // Initialize AWS S3
    await initializeS3();

    // Initialize Elasticsearch
    try {
      await initializeElasticsearch();
      logger.info('Elasticsearch initialized successfully');
    } catch (error) {
      logger.warn(
        'Elasticsearch initialization failed, search functionality will be limited',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }

    // Start listening
    app.listen(PORT, () => {
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
