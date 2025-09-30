import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { generateAdminToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';
import { createAuditLog } from './auditService.js';

export interface AdminLoginData {
  username: string;
  password: string;
}

export interface AdminPasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface AdminAuthResult {
  admin: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'MANAGER';
    isActive: boolean;
    lastLoginAt: Date | null;
  };
  token: string;
}

/**
 * Authenticate admin user with username/password
 */
export const authenticateAdmin = async (
  loginData: AdminLoginData,
  ipAddress?: string,
  userAgent?: string
): Promise<AdminAuthResult> => {
  const { username, password } = loginData;

  try {
    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        passwordHash: true,
        lastLoginAt: true,
      },
    });

    if (!admin) {
      logger.warn('Admin login attempt with invalid username', {
        username,
        ipAddress,
        userAgent,
      });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check if admin account is active
    if (!admin.isActive) {
      logger.warn('Admin login attempt with inactive account', {
        username,
        adminId: admin.id,
        ipAddress,
        userAgent,
      });
      throw new AppError('Account is inactive', 401, 'ACCOUNT_INACTIVE');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      logger.warn('Admin login attempt with invalid password', {
        username,
        adminId: admin.id,
        ipAddress,
        userAgent,
      });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login timestamp
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const token = generateAdminToken(
      admin.id,
      admin.role.toLowerCase() as 'admin' | 'manager'
    );

    // Log successful login
    await createAuditLog({
      entityType: 'admin',
      entityId: admin.id,
      action: 'LOGIN',
      adminId: admin.id,
      ipAddress,
      userAgent,
      newValues: {
        loginTime: new Date().toISOString(),
      },
    });

    logger.info('Admin login successful', {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      ipAddress,
      userAgent,
    });

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt,
      },
      token,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Admin authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      username,
      ipAddress,
      userAgent,
    });

    throw new AppError('Authentication failed', 500, 'AUTHENTICATION_ERROR');
  }
};

/**
 * Get admin by ID
 */
export const getAdminById = async (adminId: string) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new AppError('Admin not found', 404, 'ADMIN_NOT_FOUND');
    }

    if (!admin.isActive) {
      throw new AppError('Admin account is inactive', 401, 'ACCOUNT_INACTIVE');
    }

    return admin;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error fetching admin', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId,
    });

    throw new AppError('Failed to fetch admin', 500, 'FETCH_ADMIN_ERROR');
  }
};

/**
 * Change admin password
 */
export const changeAdminPassword = async (
  adminId: string,
  passwordData: AdminPasswordChangeData,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  const { currentPassword, newPassword } = passwordData;

  try {
    // Get current admin with password hash
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!admin) {
      throw new AppError('Admin not found', 404, 'ADMIN_NOT_FOUND');
    }

    if (!admin.isActive) {
      throw new AppError('Admin account is inactive', 401, 'ACCOUNT_INACTIVE');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.passwordHash
    );

    if (!isCurrentPasswordValid) {
      logger.warn(
        'Admin password change attempt with invalid current password',
        {
          adminId,
          username: admin.username,
          ipAddress,
          userAgent,
        }
      );
      throw new AppError(
        'Current password is incorrect',
        400,
        'INVALID_CURRENT_PASSWORD'
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new AppError(
        'New password must be at least 8 characters long',
        400,
        'WEAK_PASSWORD'
      );
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    // Log password change
    await createAuditLog({
      entityType: 'admin',
      entityId: adminId,
      action: 'PASSWORD_CHANGE',
      adminId,
      ipAddress,
      userAgent,
      newValues: {
        passwordChangedAt: new Date().toISOString(),
      },
    });

    logger.info('Admin password changed successfully', {
      adminId,
      username: admin.username,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Admin password change error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId,
      ipAddress,
      userAgent,
    });

    throw new AppError(
      'Failed to change password',
      500,
      'PASSWORD_CHANGE_ERROR'
    );
  }
};

/**
 * Validate admin session (used for token refresh)
 */
export const validateAdminSession = async (adminId: string) => {
  try {
    const admin = await getAdminById(adminId);
    return admin;
  } catch (error) {
    throw error;
  }
};

/**
 * Log admin logout
 */
export const logAdminLogout = async (
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  try {
    await createAuditLog({
      entityType: 'admin',
      entityId: adminId,
      action: 'LOGOUT',
      adminId,
      ipAddress,
      userAgent,
      newValues: {
        logoutTime: new Date().toISOString(),
      },
    });

    logger.info('Admin logout logged', {
      adminId,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    logger.error('Error logging admin logout', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId,
      ipAddress,
      userAgent,
    });
  }
};
