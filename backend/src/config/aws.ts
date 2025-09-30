import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../middleware/errorHandler.js';
import logger from './logger.js';

// AWS S3 Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Validate required environment variables
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  logger.warn('AWS credentials not provided, S3 functionality will be limited');
}

if (!S3_BUCKET_NAME) {
  logger.warn('S3_BUCKET_NAME not provided, using default bucket name');
}

// Create S3 client
export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials:
    AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

// S3 configuration constants
export const S3_CONFIG = {
  BUCKET_NAME: S3_BUCKET_NAME || 'voter-management-documents',
  REGION: AWS_REGION,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ],
  SIGNED_URL_EXPIRES: 3600, // 1 hour
} as const;

/**
 * Test S3 connection and bucket access
 */
export const testS3Connection = async (): Promise<boolean> => {
  try {
    logger.info('Testing S3 connection...', {
      bucket: S3_CONFIG.BUCKET_NAME,
      region: S3_CONFIG.REGION,
    });

    // Test bucket access
    const command = new HeadBucketCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
    });

    await s3Client.send(command);

    logger.info('S3 connection test successful', {
      bucket: S3_CONFIG.BUCKET_NAME,
      region: S3_CONFIG.REGION,
    });

    return true;
  } catch (error) {
    logger.error('S3 connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket: S3_CONFIG.BUCKET_NAME,
      region: S3_CONFIG.REGION,
    });

    return false;
  }
};

/**
 * Upload file to S3
 */
export const uploadToS3 = async (
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);

    logger.info('File uploaded to S3 successfully', {
      key,
      bucket: S3_CONFIG.BUCKET_NAME,
      contentType,
      size: buffer.length,
    });

    return key;
  } catch (error) {
    logger.error('S3 upload failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key,
      bucket: S3_CONFIG.BUCKET_NAME,
    });

    throw new AppError('File upload failed', 500, 'S3_UPLOAD_ERROR', {
      key,
      bucket: S3_CONFIG.BUCKET_NAME,
    });
  }
};

/**
 * Generate signed URL for secure file access
 */
export const generateSignedUrl = async (
  key: string,
  expiresIn: number = S3_CONFIG.SIGNED_URL_EXPIRES
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    logger.debug('Signed URL generated successfully', {
      key,
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    logger.error('Failed to generate signed URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key,
      bucket: S3_CONFIG.BUCKET_NAME,
    });

    throw new AppError(
      'Failed to generate file access URL',
      500,
      'SIGNED_URL_ERROR',
      { key }
    );
  }
};

/**
 * Validate file for S3 upload
 */
export const validateFileForUpload = (
  file: Express.Multer.File | { mimetype: string; size: number }
): void => {
  // Check file size
  if (file.size > S3_CONFIG.MAX_FILE_SIZE) {
    throw new AppError(
      `File size exceeds maximum limit of ${S3_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      400,
      'FILE_SIZE_EXCEEDED',
      { maxSize: S3_CONFIG.MAX_FILE_SIZE, actualSize: file.size }
    );
  }

  // Check file type
  if (!S3_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    throw new AppError(
      'Invalid file type. Only JPEG, PNG, and PDF files are allowed',
      400,
      'INVALID_FILE_TYPE',
      {
        allowedTypes: S3_CONFIG.ALLOWED_MIME_TYPES,
        actualType: file.mimetype,
      }
    );
  }
};

/**
 * Generate S3 key for file storage
 */
export const generateS3Key = (
  userId: string,
  documentType: string,
  originalName: string
): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');

  return `documents/${userId}/${documentType}/${timestamp}_${sanitizedName}`;
};

/**
 * Initialize S3 configuration and test connection
 */
export const initializeS3 = async (): Promise<void> => {
  logger.info('Initializing S3 configuration...');

  // Log configuration (without sensitive data)
  logger.info('S3 Configuration', {
    bucket: S3_CONFIG.BUCKET_NAME,
    region: S3_CONFIG.REGION,
    maxFileSize: `${S3_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
    allowedTypes: S3_CONFIG.ALLOWED_MIME_TYPES,
    hasCredentials: !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY),
  });

  // Test connection if credentials are available
  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    const connectionSuccess = await testS3Connection();
    if (!connectionSuccess) {
      logger.warn('S3 connection test failed, but continuing startup');
    }
  } else {
    logger.warn('S3 credentials not provided, skipping connection test');
  }
};
