import logger from './logger.js';

// Environment variable validation
export const validateEnvironment = (): void => {
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];

  const optionalVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
    'ELASTICSEARCH_NODE',
    'WHATSAPP_ACCESS_TOKEN',
  ];

  // Check required variables
  const missingRequired = requiredVars.filter(varName => !process.env[varName]);

  if (missingRequired.length > 0) {
    logger.error('Missing required environment variables', {
      missing: missingRequired,
    });
    throw new Error(
      `Missing required environment variables: ${missingRequired.join(', ')}`
    );
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn(
      'JWT_SECRET should be at least 32 characters long for security'
    );
  }

  // Check optional variables and warn if missing
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);

  if (missingOptional.length > 0) {
    logger.warn(
      'Optional environment variables not set (some features may be limited)',
      {
        missing: missingOptional,
      }
    );
  }

  // Log configuration status
  logger.info('Environment validation completed', {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    hasDatabase: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasAwsCredentials: !!(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ),
    hasElasticsearch: !!process.env.ELASTICSEARCH_NODE,
    hasWhatsApp: !!process.env.WHATSAPP_ACCESS_TOKEN,
  });
};

// Get environment-specific configuration
export const getConfig = () => {
  return {
    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    databaseUrl: process.env.DATABASE_URL!,

    // JWT
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // AWS
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      s3BucketName: process.env.S3_BUCKET_NAME || 'voter-management-documents',
    },

    // CORS
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:5174',
    ],

    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      strictMax: parseInt(process.env.RATE_LIMIT_STRICT_MAX || '10', 10),
      authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10),
    },

    // File Upload
    fileUpload: {
      maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '2', 10),
      allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'application/pdf',
      ],
    },

    // Elasticsearch
    elasticsearch: {
      node: process.env.ELASTICSEARCH_NODE,
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
      indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'voter_management',
    },

    // WhatsApp
    whatsapp: {
      apiUrl:
        process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    },

    // Security
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
      sessionSecret: process.env.SESSION_SECRET,
    },

    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
      maxSize: parseInt(process.env.LOG_FILE_MAX_SIZE || '5242880', 10),
      maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5', 10),
    },
  };
};
