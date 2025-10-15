import { Request, Response, NextFunction } from 'express';
import { DocumentType } from '@prisma/client';
import {
  uploadDocument,
  getDocument,
  getUserDocuments,
  replaceDocument,
  deleteDocument,
  validateDocumentType,
} from '../services/documentService.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

/**
 * Upload document for a user
 * POST /api/documents/:userId/upload
 */
export const uploadUserDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { documentType } = req.body;

    // Debug logging to see what's being received
    logger.debug('Upload request debug info', {
      userId,
      documentType,
      bodyKeys: Object.keys(req.body || {}),
      body: req.body,
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      contentType: req.get('Content-Type'),
    });

    // Validate required parameters
    if (!userId) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    if (!documentType) {
      throw new AppError(
        'Document type is required',
        400,
        'MISSING_DOCUMENT_TYPE'
      );
    }

    // Validate document type
    const validDocumentType = validateDocumentType(documentType);

    // Check if file was uploaded
    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE_UPLOADED');
    }

    const file = req.file;

    logger.info('Document upload request received', {
      userId,
      documentType: validDocumentType,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    // Upload document
    const result = await uploadDocument(userId, validDocumentType, file, req);

    logger.info('Document upload completed successfully', {
      userId,
      documentType: validDocumentType,
      documentId: result.document.id,
      fileName: file.originalname,
    });

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in uploadUserDocument controller', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      documentType: req.body.documentType,
      fileName: (req.file as Express.Multer.File)?.originalname,
    });
    next(error);
  }
};

/**
 * Get specific document for a user
 * GET /api/documents/:userId/:documentType
 */
export const getUserDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, documentType } = req.params;

    // Validate required parameters
    if (!userId) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    if (!documentType) {
      throw new AppError(
        'Document type is required',
        400,
        'MISSING_DOCUMENT_TYPE'
      );
    }

    // Validate document type
    const validDocumentType = validateDocumentType(documentType);

    logger.debug('Document retrieval request received', {
      userId,
      documentType: validDocumentType,
    });

    // Get document
    const result = await getDocument(userId, validDocumentType);

    logger.debug('Document retrieved successfully', {
      userId,
      documentType: validDocumentType,
      documentId: result.document.id,
      fileName: result.document.fileName,
    });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in getUserDocument controller', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      documentType: req.params.documentType,
    });
    next(error);
  }
};

/**
 * Get all documents for a user
 * GET /api/documents/:userId
 */
export const getAllUserDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    // Validate required parameters
    if (!userId) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    logger.debug('All user documents retrieval request received', {
      userId,
    });

    // Get all user documents
    const result = await getUserDocuments(userId);

    logger.debug('All user documents retrieved successfully', {
      userId,
      documentCount: result.count,
    });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in getAllUserDocuments controller', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
    });
    next(error);
  }
};

/**
 * Replace existing document for a user
 * PUT /api/documents/:userId/:documentType
 */
export const replaceUserDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, documentType } = req.params;

    // Validate required parameters
    if (!userId) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    if (!documentType) {
      throw new AppError(
        'Document type is required',
        400,
        'MISSING_DOCUMENT_TYPE'
      );
    }

    // Validate document type
    const validDocumentType = validateDocumentType(documentType);

    // Check if file was uploaded
    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE_UPLOADED');
    }

    const file = req.file;

    logger.info('Document replacement request received', {
      userId,
      documentType: validDocumentType,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    // Replace document (this is the same as upload since upload handles replacement)
    const result = await replaceDocument(userId, validDocumentType, file, req);

    logger.info('Document replacement completed successfully', {
      userId,
      documentType: validDocumentType,
      documentId: result.document.id,
      fileName: file.originalname,
    });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in replaceUserDocument controller', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      documentType: req.params.documentType,
      fileName: (req.file as Express.Multer.File)?.originalname,
    });
    next(error);
  }
};

/**
 * Delete document for a user
 * DELETE /api/documents/:userId/:documentType
 */
export const deleteUserDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, documentType } = req.params;

    // Validate required parameters
    if (!userId) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    if (!documentType) {
      throw new AppError(
        'Document type is required',
        400,
        'MISSING_DOCUMENT_TYPE'
      );
    }

    // Validate document type
    const validDocumentType = validateDocumentType(documentType);

    logger.info('Document deletion request received', {
      userId,
      documentType: validDocumentType,
    });

    // Delete document
    const result = await deleteDocument(userId, validDocumentType, req);

    logger.info('Document deletion completed successfully', {
      userId,
      documentType: validDocumentType,
      documentId: result.document.id,
    });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in deleteUserDocument controller', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
      documentType: req.params.documentType,
    });
    next(error);
  }
};

/**
 * Upload multiple documents for a user
 * POST /api/documents/:userId/upload-multiple
 */
export const uploadMultipleDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    // Validate required parameters
    if (!userId) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    // Check if files were uploaded
    if (!req.files || typeof req.files !== 'object') {
      throw new AppError('No files uploaded', 400, 'NO_FILES_UPLOADED');
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const uploadResults: any[] = [];
    const errors: any[] = [];

    logger.info('Multiple documents upload request received', {
      userId,
      fileFields: Object.keys(files),
      totalFiles: Object.values(files).flat().length,
    });

    // Process each file type
    for (const [fieldName, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0]; // Take the first file for each type

        try {
          // Map field names to document types
          let documentType: DocumentType;
          switch (fieldName.toLowerCase()) {
            case 'aadhar':
              documentType = DocumentType.AADHAR;
              break;
            case 'degree':
              documentType = DocumentType.DEGREE_CERTIFICATE;
              break;
            case 'photo':
              documentType = DocumentType.PHOTO;
              break;
            default:
              throw new AppError(
                `Invalid file field: ${fieldName}`,
                400,
                'INVALID_FILE_FIELD'
              );
          }

          // Upload document
          const result = await uploadDocument(userId, documentType, file, req);
          uploadResults.push({
            documentType,
            fieldName,
            ...result,
          });

          logger.info('Individual document uploaded successfully', {
            userId,
            documentType,
            fieldName,
            fileName: file.originalname,
            documentId: result.document.id,
          });
        } catch (error) {
          const errorInfo = {
            documentType: fieldName,
            fieldName,
            fileName: file.originalname,
            error: error instanceof Error ? error.message : 'Unknown error',
          };

          errors.push(errorInfo);

          logger.error('Individual document upload failed', {
            userId,
            ...errorInfo,
          });
        }
      }
    }

    // Determine response status
    const hasSuccesses = uploadResults.length > 0;
    const hasErrors = errors.length > 0;

    let status = 200;
    let message = 'All documents uploaded successfully';

    if (hasErrors && !hasSuccesses) {
      status = 400;
      message = 'All document uploads failed';
    } else if (hasErrors && hasSuccesses) {
      status = 207; // Multi-status
      message = 'Some documents uploaded successfully, some failed';
    }

    logger.info('Multiple documents upload completed', {
      userId,
      successCount: uploadResults.length,
      errorCount: errors.length,
      status,
    });

    res.status(status).json({
      success: !hasErrors || hasSuccesses,
      data: {
        uploads: uploadResults,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total: uploadResults.length + errors.length,
          successful: uploadResults.length,
          failed: errors.length,
        },
      },
      message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in uploadMultipleDocuments controller', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
    });
    next(error);
  }
};
