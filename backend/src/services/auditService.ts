import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';
import { Request } from 'express';

const prisma = new PrismaClient();

/**
 * Audit log service for tracking all system actions
 * Implements comprehensive logging for user creation and other actions
 */

export interface AuditLogData {
  entityType: string;
  entityId: string;
  action: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  userId?: string | null;
  adminId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Create an audit log entry
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        oldValues: data.oldValues || undefined,
        newValues: data.newValues || undefined,
        userId: data.userId,
        adminId: data.adminId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    logger.info('Audit log created', {
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      userId: data.userId,
      adminId: data.adminId,
      ipAddress: data.ipAddress,
    });
  } catch (error) {
    // Log the error but don't throw - audit logging should not break the main flow
    logger.error('Failed to create audit log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      auditData: data,
    });
  }
};

/**
 * Log user creation action
 */
export const logUserCreation = async (
  userId: string,
  userData: Record<string, any>,
  req?: Request
): Promise<void> => {
  // Remove sensitive data from audit log
  const sanitizedUserData = {
    ...userData,
    aadharNumber: userData.aadharNumber
      ? userData.aadharNumber.substring(0, 4) +
        '****' +
        userData.aadharNumber.substring(8)
      : null,
  };

  await createAuditLog({
    entityType: 'User',
    entityId: userId,
    action: 'CREATE',
    oldValues: null,
    newValues: sanitizedUserData,
    userId: userId,
    adminId: null,
    ipAddress: getClientIpAddress(req),
    userAgent: req?.get('User-Agent') || null,
  });
};

/**
 * Log user update action
 */
export const logUserUpdate = async (
  userId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  req?: Request,
  adminId?: string
): Promise<void> => {
  // Remove sensitive data from audit log
  const sanitizedOldValues = {
    ...oldValues,
    aadharNumber: oldValues.aadharNumber
      ? oldValues.aadharNumber.substring(0, 4) +
        '****' +
        oldValues.aadharNumber.substring(8)
      : null,
  };

  const sanitizedNewValues = {
    ...newValues,
    aadharNumber: newValues.aadharNumber
      ? newValues.aadharNumber.substring(0, 4) +
        '****' +
        newValues.aadharNumber.substring(8)
      : null,
  };

  await createAuditLog({
    entityType: 'User',
    entityId: userId,
    action: 'UPDATE',
    oldValues: sanitizedOldValues,
    newValues: sanitizedNewValues,
    userId: adminId ? null : userId,
    adminId: adminId || null,
    ipAddress: getClientIpAddress(req),
    userAgent: req?.get('User-Agent') || null,
  });
};

/**
 * Log user verification action
 */
export const logUserVerification = async (
  userId: string,
  isVerified: boolean,
  adminId: string,
  req?: Request
): Promise<void> => {
  await createAuditLog({
    entityType: 'User',
    entityId: userId,
    action: isVerified ? 'VERIFY' : 'UNVERIFY',
    oldValues: { isVerified: !isVerified },
    newValues: { isVerified, verifiedBy: adminId, verifiedAt: new Date() },
    userId: null,
    adminId: adminId,
    ipAddress: getClientIpAddress(req),
    userAgent: req?.get('User-Agent') || null,
  });
};

/**
 * Log document upload action
 */
export const logDocumentUpload = async (
  documentId: string,
  userId: string,
  documentType: string,
  file: Express.Multer.File,
  req?: Request
): Promise<void> => {
  await createAuditLog({
    entityType: 'Document',
    entityId: documentId,
    action: 'UPLOAD',
    oldValues: null,
    newValues: {
      userId,
      documentType,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    },
    userId: userId,
    adminId: null,
    ipAddress: getClientIpAddress(req),
    userAgent: req?.get('User-Agent') || null,
  });
};

/**
 * Log document replacement action
 */
export const logDocumentReplacement = async (
  newDocumentId: string,
  oldDocumentId: string,
  userId: string,
  documentType: string,
  file: Express.Multer.File,
  req?: Request
): Promise<void> => {
  await createAuditLog({
    entityType: 'Document',
    entityId: newDocumentId,
    action: 'REPLACE',
    oldValues: {
      oldDocumentId,
      documentType,
    },
    newValues: {
      userId,
      documentType,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      replacedDocumentId: oldDocumentId,
    },
    userId: userId,
    adminId: null,
    ipAddress: getClientIpAddress(req),
    userAgent: req?.get('User-Agent') || null,
  });
};

/**
 * Log document deletion action
 */
export const logDocumentDeletion = async (
  documentId: string,
  userId: string,
  documentType: string,
  req?: Request,
  adminId?: string
): Promise<void> => {
  await createAuditLog({
    entityType: 'Document',
    entityId: documentId,
    action: 'DELETE',
    oldValues: {
      userId,
      documentType,
      isActive: true,
    },
    newValues: {
      isActive: false,
      deletedBy: adminId ? 'admin' : 'user',
    },
    userId: adminId ? null : userId,
    adminId: adminId || null,
    ipAddress: getClientIpAddress(req),
    userAgent: req?.get('User-Agent') || null,
  });
};

/**
 * Log reference creation action
 */
export const logReferenceCreation = async (
  userId: string,
  references: Array<{
    id: string;
    referenceName: string;
    referenceContact: string;
  }>,
  req?: Request
): Promise<void> => {
  // Log each reference creation separately for better tracking
  for (const reference of references) {
    await createAuditLog({
      entityType: 'Reference',
      entityId: reference.id,
      action: 'CREATE',
      oldValues: null,
      newValues: {
        userId,
        referenceName: reference.referenceName,
        referenceContact:
          reference.referenceContact.substring(0, 4) +
          '****' +
          reference.referenceContact.substring(8), // Mask contact
        status: 'PENDING',
      },
      userId: userId,
      adminId: null,
      ipAddress: getClientIpAddress(req),
      userAgent: req?.get('User-Agent') || null,
    });
  }
};

/**
 * Log reference update action
 */
export const logReferenceUpdate = async (
  referenceId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  req?: Request,
  adminId?: string
): Promise<void> => {
  await createAuditLog({
    entityType: 'Reference',
    entityId: referenceId,
    action: 'UPDATE',
    oldValues,
    newValues,
    userId: null,
    adminId: adminId || null,
    ipAddress: getClientIpAddress(req),
    userAgent: req?.get('User-Agent') || null,
  });
};

/**
 * Log admin login action
 */
export const logAdminLogin = async (
  adminId: string,
  success: boolean,
  req?: Request
): Promise<void> => {
  await createAuditLog({
    entityType: 'Admin',
    entityId: adminId,
    action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
    oldValues: null,
    newValues: { loginAttempt: true, success },
    userId: null,
    adminId: success ? adminId : null,
    ipAddress: getClientIpAddress(req),
    userAgent: req?.get('User-Agent') || null,
  });
};

/**
 * Extract client IP address from request
 * Handles various proxy configurations
 */
export const getClientIpAddress = (req?: Request): string | null => {
  if (!req) return null;

  // Check for IP in various headers (in order of preference)
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];

  for (const header of ipHeaders) {
    const ip = req.get(header);
    if (ip) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return ip.split(',')[0].trim();
    }
  }

  // Fallback to connection remote address
  return req.socket?.remoteAddress || req.ip || null;
};

/**
 * Get audit logs for a specific entity
 */
export const getAuditLogs = async (
  entityType: string,
  entityId: string,
  limit: number = 50
) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        admin: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return logs;
  } catch (error) {
    logger.error('Failed to fetch audit logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entityType,
      entityId,
    });
    throw error;
  }
};

/**
 * Get recent audit logs with pagination
 */
export const getRecentAuditLogs = async (
  page: number = 1,
  limit: number = 50,
  entityType?: string,
  action?: string
) => {
  try {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          admin: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Failed to fetch recent audit logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      page,
      limit,
      entityType,
      action,
    });
    throw error;
  }
};
