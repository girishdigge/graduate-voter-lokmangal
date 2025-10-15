import { PrismaClient, DocumentType } from '@prisma/client';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  uploadToS3,
  generateSignedUrl,
  validateFileForUpload,
  generateS3Key,
  s3Client,
  S3_CONFIG,
} from '../config/aws.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';
import { logDocumentUpload, logDocumentReplacement } from './auditService.js';

const prisma = new PrismaClient();

/**
 * Validate document type
 */
export const validateDocumentType = (documentType: string): DocumentType => {
  const validTypes = Object.values(DocumentType);
  if (!validTypes.includes(documentType as DocumentType)) {
    throw new AppError(
      `Invalid document type. Allowed types: ${validTypes.join(', ')}`,
      400,
      'INVALID_DOCUMENT_TYPE',
      { allowedTypes: validTypes, providedType: documentType }
    );
  }
  return documentType as DocumentType;
};

/**
 * Check if user exists
 */
const validateUserExists = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
};

/**
 * Upload document to S3 and save metadata to database
 */
export const uploadDocument = async (
  userId: string,
  documentType: DocumentType,
  file: Express.Multer.File,
  req?: Request
) => {
  try {
    // Validate user exists
    await validateUserExists(userId);

    // Validate file
    validateFileForUpload(file);

    // Check if document already exists for this user and type
    const existingDocument = await prisma.document.findFirst({
      where: {
        userId,
        documentType,
        isActive: true,
      },
    });

    // Generate S3 key
    const s3Key = generateS3Key(userId, documentType, file.originalname);

    // Upload to S3
    const uploadedKey = await uploadToS3(s3Key, file.buffer, file.mimetype, {
      userId,
      documentType,
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
    });

    // Save document metadata to database
    const document = await prisma.$transaction(async (tx: any) => {
      // If replacing existing document, mark old one as inactive
      if (existingDocument) {
        await tx.document.update({
          where: { id: existingDocument.id },
          data: { isActive: false },
        });

        logger.info('Marked existing document as inactive for replacement', {
          userId,
          documentType,
          oldDocumentId: existingDocument.id,
          oldS3Key: existingDocument.s3Key,
        });
      }

      // Create new document record
      const newDocument = await tx.document.create({
        data: {
          id: uuidv4(),
          userId,
          documentType,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          s3Key: uploadedKey,
          s3Bucket: S3_CONFIG.BUCKET_NAME,
          isActive: true,
        },
        select: {
          id: true,
          userId: true,
          documentType: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          s3Key: true,
          s3Bucket: true,
          isActive: true,
          uploadedAt: true,
        },
      });

      return newDocument;
    });

    // Log document upload for audit trail
    if (existingDocument) {
      await logDocumentReplacement(
        document.id,
        existingDocument.id,
        userId,
        documentType,
        file,
        req
      );
    } else {
      await logDocumentUpload(document.id, userId, documentType, file, req);
    }

    // Clean up old S3 file if this was a replacement
    if (existingDocument) {
      try {
        await deleteFromS3(existingDocument.s3Key);
        logger.info('Successfully deleted old document from S3', {
          s3Key: existingDocument.s3Key,
          documentId: existingDocument.id,
        });
      } catch (error) {
        // Log error but don't fail the upload
        logger.error('Failed to delete old document from S3', {
          error: error instanceof Error ? error.message : 'Unknown error',
          s3Key: existingDocument.s3Key,
          documentId: existingDocument.id,
        });
      }
    }

    logger.info('Document uploaded successfully', {
      documentId: document.id,
      userId,
      documentType,
      fileName: file.originalname,
      fileSize: file.size,
      s3Key: uploadedKey,
      isReplacement: !!existingDocument,
    });

    return {
      success: true,
      document,
      message: existingDocument
        ? 'Document replaced successfully'
        : 'Document uploaded successfully',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error uploading document', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      documentType,
      fileName: file?.originalname,
    });

    throw new AppError(
      'Failed to upload document',
      500,
      'DOCUMENT_UPLOAD_FAILED'
    );
  }
};

/**
 * Get document by user ID and document type
 */
export const getDocument = async (
  userId: string,
  documentType: DocumentType
) => {
  try {
    // Validate user exists
    await validateUserExists(userId);

    // Validate document type
    validateDocumentType(documentType);

    // Find active document
    const document = await prisma.document.findFirst({
      where: {
        userId,
        documentType,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        s3Key: true,
        s3Bucket: true,
        isActive: true,
        uploadedAt: true,
      },
    });

    if (!document) {
      throw new AppError(
        `${documentType} document not found for user`,
        404,
        'DOCUMENT_NOT_FOUND',
        { userId, documentType }
      );
    }

    // Generate signed URL for secure access
    const signedUrl = await generateSignedUrl(document.s3Key);

    logger.debug('Document retrieved successfully', {
      documentId: document.id,
      userId,
      documentType,
      fileName: document.fileName,
    });

    return {
      success: true,
      document: {
        ...document,
        downloadUrl: signedUrl,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error retrieving document', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      documentType,
    });

    throw new AppError(
      'Failed to retrieve document',
      500,
      'DOCUMENT_RETRIEVAL_FAILED'
    );
  }
};

/**
 * Get all documents for a user
 */
export const getUserDocuments = async (userId: string) => {
  try {
    // Validate user exists
    await validateUserExists(userId);

    // Get all active documents for user
    const documents = await prisma.document.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        s3Key: true,
        s3Bucket: true,
        isActive: true,
        uploadedAt: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    // Generate signed URLs for all documents
    const documentsWithUrls = await Promise.all(
      documents.map(async (document: any) => {
        try {
          const signedUrl = await generateSignedUrl(document.s3Key);
          return {
            ...document,
            downloadUrl: signedUrl,
          };
        } catch (error) {
          logger.error('Failed to generate signed URL for document', {
            documentId: document.id,
            s3Key: document.s3Key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return {
            ...document,
            downloadUrl: null,
            error: 'Failed to generate download URL',
          };
        }
      })
    );

    logger.debug('User documents retrieved successfully', {
      userId,
      documentCount: documents.length,
    });

    return {
      success: true,
      documents: documentsWithUrls,
      count: documents.length,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error retrieving user documents', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });

    throw new AppError(
      'Failed to retrieve user documents',
      500,
      'USER_DOCUMENTS_RETRIEVAL_FAILED'
    );
  }
};

/**
 * Delete document from S3
 */
export const deleteFromS3 = async (s3Key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);

    logger.debug('File deleted from S3 successfully', {
      s3Key,
      bucket: S3_CONFIG.BUCKET_NAME,
    });
  } catch (error) {
    logger.error('Failed to delete file from S3', {
      error: error instanceof Error ? error.message : 'Unknown error',
      s3Key,
      bucket: S3_CONFIG.BUCKET_NAME,
    });

    throw new AppError(
      'Failed to delete file from storage',
      500,
      'S3_DELETE_ERROR',
      { s3Key }
    );
  }
};

/**
 * Replace existing document
 */
export const replaceDocument = async (
  userId: string,
  documentType: DocumentType,
  file: Express.Multer.File,
  req?: Request
) => {
  // This function is essentially the same as uploadDocument
  // since uploadDocument already handles replacement logic
  return uploadDocument(userId, documentType, file, req);
};

/**
 * Delete document (soft delete - mark as inactive)
 */
export const deleteDocument = async (
  userId: string,
  documentType: DocumentType,
  req?: Request,
  adminId?: string
) => {
  try {
    // Validate user exists
    await validateUserExists(userId);

    // Validate document type
    validateDocumentType(documentType);

    // Find active document
    const document = await prisma.document.findFirst({
      where: {
        userId,
        documentType,
        isActive: true,
      },
    });

    if (!document) {
      throw new AppError(
        `${documentType} document not found for user`,
        404,
        'DOCUMENT_NOT_FOUND',
        { userId, documentType }
      );
    }

    // Soft delete - mark as inactive
    const deletedDocument = await prisma.document.update({
      where: { id: document.id },
      data: { isActive: false },
      select: {
        id: true,
        userId: true,
        documentType: true,
        fileName: true,
        s3Key: true,
        isActive: true,
      },
    });

    // Log document deletion for audit trail
    const { logDocumentDeletion } = await import('./auditService.js');
    await logDocumentDeletion(document.id, userId, documentType, req, adminId);

    // Optionally delete from S3 (commented out for data retention)
    // try {
    //   await deleteFromS3(document.s3Key);
    // } catch (error) {
    //   logger.error('Failed to delete document from S3', {
    //     documentId: document.id,
    //     s3Key: document.s3Key,
    //     error: error instanceof Error ? error.message : 'Unknown error',
    //   });
    // }

    logger.info('Document deleted successfully', {
      documentId: document.id,
      userId,
      documentType,
      fileName: document.fileName,
      deletedBy: adminId ? 'admin' : 'user',
      adminId,
    });

    return {
      success: true,
      document: deletedDocument,
      message: 'Document deleted successfully',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error deleting document', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      documentType,
      adminId,
    });

    throw new AppError(
      'Failed to delete document',
      500,
      'DOCUMENT_DELETION_FAILED'
    );
  }
};

/**
 * Get document statistics for admin dashboard
 */
export const getDocumentStats = async () => {
  try {
    const stats = await prisma.document.groupBy({
      by: ['documentType'],
      where: {
        isActive: true,
      },
      _count: {
        id: true,
      },
    });

    const totalDocuments = await prisma.document.count({
      where: {
        isActive: true,
      },
    });

    const documentsByType = stats.reduce(
      (acc: any, stat: any) => {
        acc[stat.documentType] = stat._count.id;
        return acc;
      },
      {} as Record<DocumentType, number>
    );

    logger.debug('Document statistics retrieved', {
      totalDocuments,
      documentsByType,
    });

    return {
      success: true,
      stats: {
        total: totalDocuments,
        byType: documentsByType,
      },
    };
  } catch (error) {
    logger.error('Error retrieving document statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw new AppError(
      'Failed to retrieve document statistics',
      500,
      'DOCUMENT_STATS_FAILED'
    );
  }
};
