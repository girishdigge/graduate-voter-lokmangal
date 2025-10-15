import multer from 'multer';
import multerS3 from 'multer-s3';
import {
  s3Client,
  S3_CONFIG,
  validateFileForUpload,
  generateS3Key,
} from './aws.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from './logger.js';
import { Request } from 'express';

/**
 * File filter function for multer
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  try {
    // Validate file type and size
    validateFileForUpload(file);
    cb(null, true);
  } catch (error) {
    logger.warn('File validation failed during upload', {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    cb(error as Error);
  }
};

/**
 * Memory storage configuration for file processing before S3 upload
 * This allows us to validate, process, and scan files before uploading to S3
 */
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: S3_CONFIG.MAX_FILE_SIZE,
    files: 3, // Maximum 3 files per request (Aadhar, Degree, Photo)
  },
  fileFilter,
});

/**
 * Direct S3 upload configuration (alternative approach)
 * This uploads directly to S3 without storing in memory first
 */
export const s3Upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: S3_CONFIG.BUCKET_NAME,
    serverSideEncryption: 'AES256',
    key: (req: Request, file: Express.Multer.File, cb) => {
      try {
        // Extract userId and documentType from request
        const userId = req.params.userId || req.body.userId;
        const documentType = req.params.documentType || req.body.documentType;

        if (!userId || !documentType) {
          return cb(
            new AppError(
              'User ID and document type are required',
              400,
              'MISSING_UPLOAD_PARAMS'
            )
          );
        }

        // Generate S3 key
        const s3Key = generateS3Key(userId, documentType, file.originalname);

        logger.debug('Generated S3 key for direct upload', {
          userId,
          documentType,
          fileName: file.originalname,
          s3Key,
        });

        cb(null, s3Key);
      } catch (error) {
        logger.error('Error generating S3 key for direct upload', {
          error: error instanceof Error ? error.message : 'Unknown error',
          fileName: file.originalname,
        });
        cb(error as Error);
      }
    },
    metadata: (req: Request, file: Express.Multer.File, cb) => {
      const userId = req.params.userId || req.body.userId;
      const documentType = req.params.documentType || req.body.documentType;

      cb(null, {
        userId,
        documentType,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'user',
      });
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
  limits: {
    fileSize: S3_CONFIG.MAX_FILE_SIZE,
    files: 3,
  },
  fileFilter,
});

/**
 * Single file upload middleware for memory storage
 * Using single() for single file uploads - this should properly handle text fields
 */
export const uploadSingleFile = memoryUpload.single('document');

/**
 * Multiple files upload middleware for memory storage
 */
export const uploadMultipleFiles = memoryUpload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'degree', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);

/**
 * Single file upload middleware for direct S3 upload
 */
export const uploadSingleFileToS3 = s3Upload.single('document');

/**
 * Multiple files upload middleware for direct S3 upload
 */
export const uploadMultipleFilesToS3 = s3Upload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'degree', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);

/**
 * Error handler for multer errors
 */
export const handleMulterError = (
  error: any,
  req: Request,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    logger.warn('Multer error during file upload', {
      error: error.message,
      code: error.code,
      field: error.field,
      url: req.url,
      method: req.method,
    });

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_SIZE_EXCEEDED',
            message: `File size exceeds maximum limit of ${S3_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
            details: {
              maxSize: S3_CONFIG.MAX_FILE_SIZE,
              field: error.field,
            },
          },
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_FILES',
            message: 'Too many files uploaded',
            details: {
              field: error.field,
            },
          },
        });

      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: {
            code: 'UNEXPECTED_FILE',
            message: 'Unexpected file field',
            details: {
              field: error.field,
            },
          },
        });

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: error.message || 'File upload error',
            details: {
              code: error.code,
              field: error.field,
            },
          },
        });
    }
  }

  // Pass non-multer errors to the next error handler
  next(error);
};

/**
 * Validate uploaded files middleware
 */
export const validateUploadedFiles = (req: Request, res: any, next: any) => {
  try {
    // Check if any files were uploaded
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES_UPLOADED',
          message: 'No files were uploaded',
        },
      });
    }

    // Validate single file (legacy support)
    if (req.file) {
      validateFileForUpload(req.file);
    }

    // Validate multiple files (including single file uploaded via fields())
    if (req.files) {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();

      for (const file of files) {
        validateFileForUpload(file);
      }
    }

    next();
  } catch (error) {
    logger.warn('File validation failed in middleware', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: req.url,
      method: req.method,
    });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_VALIDATION_ERROR',
        message: 'File validation failed',
      },
    });
  }
};

/**
 * Malware scanning middleware (placeholder for future implementation)
 * This would integrate with services like ClamAV or AWS GuardDuty
 */
export const scanForMalware = async (req: Request, res: any, next: any) => {
  try {
    // TODO: Implement malware scanning
    // For now, we'll just log and continue
    logger.debug('Malware scanning placeholder', {
      hasFile: !!req.file,
      hasFiles: !!req.files,
      url: req.url,
    });

    // In a real implementation, you would:
    // 1. Scan the file buffer for malware
    // 2. Check against known malicious file signatures
    // 3. Use AWS GuardDuty or similar service
    // 4. Reject files that fail scanning

    next();
  } catch (error) {
    logger.error('Error during malware scanning', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: req.url,
    });

    return res.status(500).json({
      success: false,
      error: {
        code: 'MALWARE_SCAN_ERROR',
        message: 'File security scanning failed',
      },
    });
  }
};
