import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { generateAdminToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';
import {
  createAuditLog,
  logUserVerification,
  logUserUpdate,
} from './auditService.js';
import searchService from './searchService.js';
import { Request } from 'express';
import { calculateAge } from '../types/userValidation.js';

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

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async () => {
  try {
    const [
      totalVoters,
      verifiedVoters,
      unverifiedVoters,
      totalReferences,
      pendingReferences,
      contactedReferences,
      appliedReferences,
      recentEnrollments,
    ] = await Promise.all([
      // Total voters count
      prisma.user.count(),

      // Verified voters count
      prisma.user.count({
        where: { isVerified: true },
      }),

      // Unverified voters count
      prisma.user.count({
        where: { isVerified: false },
      }),

      // Total references count
      prisma.reference.count(),

      // Pending references count
      prisma.reference.count({
        where: { status: 'PENDING' },
      }),

      // Contacted references count
      prisma.reference.count({
        where: { status: 'CONTACTED' },
      }),

      // Applied references count
      prisma.reference.count({
        where: { status: 'APPLIED' },
      }),

      // Recent enrollments (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Calculate verification rate
    const verificationRate =
      totalVoters > 0 ? (verifiedVoters / totalVoters) * 100 : 0;

    return {
      voters: {
        total: totalVoters,
        verified: verifiedVoters,
        unverified: unverifiedVoters,
        verificationRate: Math.round(verificationRate * 100) / 100,
        recentEnrollments,
      },
      references: {
        total: totalReferences,
        pending: pendingReferences,
        contacted: contactedReferences,
        applied: appliedReferences,
      },
    };
  } catch (error) {
    logger.error('Error fetching admin stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new AppError('Failed to fetch statistics', 500, 'STATS_FETCH_ERROR');
  }
};

/**
 * Get voters with pagination, search, and filtering
 */
export const getVotersWithPagination = async (
  searchQuery?: string,
  filters: Record<string, any> = {},
  options: {
    page: number;
    limit: number;
    sort_by: string;
    sort_order: 'asc' | 'desc';
  } = {
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  }
) => {
  try {
    const { page, limit, sort_by, sort_order } = options;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // Search query (if provided)
    if (searchQuery && searchQuery.trim()) {
      where.OR = [
        { fullName: { contains: searchQuery } },
        { contact: { contains: searchQuery } },
        { email: { contains: searchQuery } },
        { aadharNumber: { contains: searchQuery } },
      ];
    }

    // Apply filters
    if (filters.verification_status) {
      where.isVerified = filters.verification_status === 'verified';
    }

    if (filters.sex) {
      where.sex = filters.sex;
    }

    if (filters.assembly_number) {
      where.assemblyNumber = filters.assembly_number;
    }

    if (filters.polling_station_number) {
      where.pollingStationNumber = filters.polling_station_number;
    }

    if (filters.city) {
      where.city = { contains: filters.city };
    }

    if (filters.state) {
      where.state = { contains: filters.state };
    }

    // Age range filtering
    if (filters.age_min || filters.age_max) {
      where.age = {};
      if (filters.age_min) where.age.gte = filters.age_min;
      if (filters.age_max) where.age.lte = filters.age_max;
    }

    // Build order by clause
    const orderBy: any = {};
    switch (sort_by) {
      case 'full_name':
        orderBy.fullName = sort_order;
        break;
      case 'age':
        orderBy.age = sort_order;
        break;
      case 'assembly_number':
        orderBy.assemblyNumber = sort_order;
        break;
      case 'updated_at':
        orderBy.updatedAt = sort_order;
        break;
      default:
        orderBy.createdAt = sort_order;
    }

    // Execute queries
    const [voters, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          aadharNumber: true,
          fullName: true,
          contact: true,
          email: true,
          sex: true,
          isVerified: true,
          assemblyNumber: true,
          assemblyName: true,
          pollingStationNumber: true,
          city: true,
          state: true,
          pincode: true,
          age: true,
          qualification: true,
          occupation: true,
          createdAt: true,
          updatedAt: true,
          verifiedAt: true,
          verifiedBy: true,
          dateOfBirth: true,
          epicNumber: true,
          graduationYear: true,
          guardianSpouse: true,
          houseNumber: true,
          street: true,
          area: true,
          graduationDocType: true,
          disabilities: true,
          university: true,
          isRegisteredElector: true,
          verifiedByAdmin: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      voters: voters,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage,
      },
    };
  } catch (error) {
    logger.error('Error fetching voters with pagination', {
      error: error instanceof Error ? error.message : 'Unknown error',
      searchQuery,
      filters,
      options,
    });
    throw new AppError('Failed to fetch voters', 500, 'VOTERS_FETCH_ERROR');
  }
};

/**
 * Verify or unverify a user
 */
export const verifyUser = async (
  userId: string,
  isVerified: boolean,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        isVerified: true,
        verifiedBy: true,
        verifiedAt: true,
      },
    });

    if (!currentUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if verification status is already the same
    if (currentUser.isVerified === isVerified) {
      return {
        user: currentUser,
        message: `User is already ${isVerified ? 'verified' : 'unverified'}`,
      };
    }

    // Update user verification status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified,
        verifiedBy: isVerified ? adminId : null,
        verifiedAt: isVerified ? new Date() : null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        aadharNumber: true,
        fullName: true,
        sex: true,
        contact: true,
        email: true,
        age: true,
        city: true,
        state: true,
        assemblyNumber: true,
        pollingStationNumber: true,
        isVerified: true,
        verifiedAt: true,
        createdAt: true,
        updatedAt: true,
        verifiedByAdmin: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    // Log verification action
    await logUserVerification(userId, isVerified, adminId, {
      ip: ipAddress,
      get: (header: string) => userAgent,
    } as Request);

    // Update user in Elasticsearch index
    try {
      // Get full user data for indexing
      const fullUserData = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (fullUserData) {
        await searchService.indexUser(fullUserData);
        logger.debug('User verification updated in Elasticsearch', { userId });
      }
    } catch (error) {
      logger.warn('Failed to update user verification in Elasticsearch', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    logger.info('User verification status updated', {
      userId,
      userName: updatedUser.fullName,
      isVerified,
      adminId,
    });

    return {
      user: updatedUser,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error updating user verification', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      isVerified,
      adminId,
    });

    throw new AppError(
      'Failed to update user verification',
      500,
      'USER_VERIFICATION_ERROR'
    );
  }
};

/**
 * Update user information by admin
 */
export const updateUserByAdmin = async (
  userId: string,
  updateData: Record<string, any>,
  adminId: string,
  req?: Request,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    // Get current user data for audit logging
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Prepare update data
    const updateFields: any = { ...updateData };

    // Recalculate age if date of birth is being updated
    if (updateFields.dateOfBirth) {
      updateFields.dateOfBirth = new Date(updateFields.dateOfBirth);
      updateFields.age = calculateAge(updateFields.dateOfBirth);
    }

    // Check for contact number conflicts (if being updated)
    if (updateFields.contact && updateFields.contact !== currentUser.contact) {
      const existingContact = await prisma.user.findFirst({
        where: {
          contact: updateFields.contact,
          id: { not: userId },
        },
      });

      if (existingContact) {
        throw new AppError(
          'Contact number already registered with another account',
          409,
          'CONTACT_ALREADY_EXISTS'
        );
      }
    }

    // Check for email conflicts (if being updated)
    if (updateFields.email && updateFields.email !== currentUser.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: updateFields.email,
          id: { not: userId },
        },
      });

      if (existingEmail) {
        throw new AppError(
          'Email address already registered with another account',
          409,
          'EMAIL_ALREADY_EXISTS'
        );
      }
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateFields,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        aadharNumber: true,
        fullName: true,
        sex: true,
        guardianSpouse: true,
        qualification: true,
        occupation: true,
        contact: true,
        email: true,
        dateOfBirth: true,
        age: true,
        houseNumber: true,
        street: true,
        area: true,
        city: true,
        state: true,
        pincode: true,
        isRegisteredElector: true,
        assemblyNumber: true,
        assemblyName: true,
        pollingStationNumber: true,
        epicNumber: true,
        disabilities: true,
        university: true,
        graduationYear: true,
        graduationDocType: true,
        isVerified: true,
        verifiedAt: true,
        createdAt: true,
        updatedAt: true,
        verifiedByAdmin: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    // Log user update for audit trail
    await logUserUpdate(userId, currentUser, updateFields, req, adminId);

    // Update user in Elasticsearch index
    try {
      // Get full user data for indexing
      const fullUserData = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (fullUserData) {
        await searchService.indexUser(fullUserData);
        logger.debug('User updated in Elasticsearch', { userId });
      }
    } catch (error) {
      logger.warn('Failed to update user in Elasticsearch', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    logger.info('User information updated by admin', {
      userId,
      userName: updatedUser.fullName,
      adminId,
      updatedFields: Object.keys(updateFields),
    });

    return {
      user: updatedUser,
      message: 'User information updated successfully',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error updating user by admin', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      adminId,
      updateData,
    });

    throw new AppError(
      'Failed to update user information',
      500,
      'USER_UPDATE_ERROR'
    );
  }
};
/**
 * Manager Management Functions
 */

export interface CreateManagerData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role?: 'ADMIN' | 'MANAGER';
}

export interface UpdateManagerData {
  email?: string;
  fullName?: string;
  isActive?: boolean;
}

export interface ManagerListOptions {
  page: number;
  limit: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  search?: string;
  role?: 'ADMIN' | 'MANAGER';
  isActive?: boolean;
}

/**
 * Get all managers with pagination and filtering
 */
export const getManagersWithPagination = async (
  options: ManagerListOptions
) => {
  try {
    const { page, limit, sort_by, sort_order, search, role, isActive } =
      options;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // Search query (if provided)
    if (search && search.trim()) {
      where.OR = [
        { fullName: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Apply filters
    if (role) {
      where.role = role;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    // Build order by clause
    const orderBy: any = {};
    switch (sort_by) {
      case 'username':
        orderBy.username = sort_order;
        break;
      case 'email':
        orderBy.email = sort_order;
        break;
      case 'full_name':
        orderBy.fullName = sort_order;
        break;
      case 'role':
        orderBy.role = sort_order;
        break;
      case 'last_login_at':
        orderBy.lastLoginAt = sort_order;
        break;
      case 'updated_at':
        orderBy.updatedAt = sort_order;
        break;
      default:
        orderBy.createdAt = sort_order;
    }

    // Execute queries
    const [managers, total] = await Promise.all([
      prisma.admin.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
          _count: {
            select: {
              verifiedUsers: true,
              auditLogs: true,
            },
          },
        },
      }),
      prisma.admin.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      managers: managers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage,
      },
    };
  } catch (error) {
    logger.error('Error fetching managers with pagination', {
      error: error instanceof Error ? error.message : 'Unknown error',
      options,
    });
    throw new AppError('Failed to fetch managers', 500, 'MANAGERS_FETCH_ERROR');
  }
};

/**
 * Create a new manager account
 */
export const createManager = async (
  managerData: CreateManagerData,
  createdByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) => {
  const { username, email, fullName, password, role = 'MANAGER' } = managerData;

  try {
    // Check if username already exists
    const existingUsername = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new AppError(
        'Username already exists',
        409,
        'USERNAME_ALREADY_EXISTS'
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new AppError('Email already exists', 409, 'EMAIL_ALREADY_EXISTS');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new AppError(
        'Password must be at least 8 characters long',
        400,
        'WEAK_PASSWORD'
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create manager in database
    const newManager = await prisma.admin.create({
      data: {
        username,
        email,
        fullName,
        passwordHash,
        role,
        isActive: true,
      },
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

    // Log manager creation
    await createAuditLog({
      entityType: 'admin',
      entityId: newManager.id,
      action: 'CREATE_MANAGER',
      adminId: createdByAdminId,
      ipAddress,
      userAgent,
      newValues: {
        username: newManager.username,
        email: newManager.email,
        fullName: newManager.fullName,
        role: newManager.role,
        createdAt: newManager.createdAt.toISOString(),
      },
    });

    logger.info('Manager created successfully', {
      managerId: newManager.id,
      username: newManager.username,
      email: newManager.email,
      role: newManager.role,
      createdByAdminId,
      ipAddress,
    });

    return {
      manager: newManager,
      message: 'Manager created successfully',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error creating manager', {
      error: error instanceof Error ? error.message : 'Unknown error',
      managerData: { ...managerData, password: '[REDACTED]' },
      createdByAdminId,
      ipAddress,
    });

    throw new AppError('Failed to create manager', 500, 'MANAGER_CREATE_ERROR');
  }
};

/**
 * Update manager details
 */
export const updateManager = async (
  managerId: string,
  updateData: UpdateManagerData,
  updatedByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    // Get current manager data for audit logging
    const currentManager = await prisma.admin.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!currentManager) {
      throw new AppError('Manager not found', 404, 'MANAGER_NOT_FOUND');
    }

    // Check for email conflicts (if being updated)
    if (updateData.email && updateData.email !== currentManager.email) {
      const existingEmail = await prisma.admin.findFirst({
        where: {
          email: updateData.email,
          id: { not: managerId },
        },
      });

      if (existingEmail) {
        throw new AppError(
          'Email address already registered with another account',
          409,
          'EMAIL_ALREADY_EXISTS'
        );
      }
    }

    // Update manager in database
    const updatedManager = await prisma.admin.update({
      where: { id: managerId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
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
        _count: {
          select: {
            verifiedUsers: true,
            auditLogs: true,
          },
        },
      },
    });

    // Log manager update
    await createAuditLog({
      entityType: 'admin',
      entityId: managerId,
      action: 'UPDATE_MANAGER',
      adminId: updatedByAdminId,
      ipAddress,
      userAgent,
      oldValues: {
        email: currentManager.email,
        fullName: currentManager.fullName,
        isActive: currentManager.isActive,
      },
      newValues: {
        email: updatedManager.email,
        fullName: updatedManager.fullName,
        isActive: updatedManager.isActive,
        updatedAt: updatedManager.updatedAt.toISOString(),
      },
    });

    logger.info('Manager updated successfully', {
      managerId,
      username: updatedManager.username,
      updatedFields: Object.keys(updateData),
      updatedByAdminId,
      ipAddress,
    });

    return {
      manager: updatedManager,
      message: 'Manager updated successfully',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error updating manager', {
      error: error instanceof Error ? error.message : 'Unknown error',
      managerId,
      updateData,
      updatedByAdminId,
      ipAddress,
    });

    throw new AppError('Failed to update manager', 500, 'MANAGER_UPDATE_ERROR');
  }
};

/**
 * Deactivate manager (soft delete)
 */
export const deactivateManager = async (
  managerId: string,
  deactivatedByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    // Get current manager data
    const currentManager = await prisma.admin.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!currentManager) {
      throw new AppError('Manager not found', 404, 'MANAGER_NOT_FOUND');
    }

    if (!currentManager.isActive) {
      throw new AppError(
        'Manager is already deactivated',
        400,
        'MANAGER_ALREADY_DEACTIVATED'
      );
    }

    // Prevent self-deactivation
    if (managerId === deactivatedByAdminId) {
      throw new AppError(
        'Cannot deactivate your own account',
        400,
        'CANNOT_DEACTIVATE_SELF'
      );
    }

    // Deactivate manager
    const deactivatedManager = await prisma.admin.update({
      where: { id: managerId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
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

    // Log manager deactivation
    await createAuditLog({
      entityType: 'admin',
      entityId: managerId,
      action: 'DEACTIVATE_MANAGER',
      adminId: deactivatedByAdminId,
      ipAddress,
      userAgent,
      oldValues: {
        isActive: true,
      },
      newValues: {
        isActive: false,
        deactivatedAt: new Date().toISOString(),
      },
    });

    logger.info('Manager deactivated successfully', {
      managerId,
      username: deactivatedManager.username,
      deactivatedByAdminId,
      ipAddress,
    });

    return {
      manager: deactivatedManager,
      message: 'Manager deactivated successfully',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error deactivating manager', {
      error: error instanceof Error ? error.message : 'Unknown error',
      managerId,
      deactivatedByAdminId,
      ipAddress,
    });

    throw new AppError(
      'Failed to deactivate manager',
      500,
      'MANAGER_DEACTIVATE_ERROR'
    );
  }
};

/**
 * Get manager by ID
 */
export const getManagerById = async (managerId: string) => {
  try {
    const manager = await prisma.admin.findUnique({
      where: { id: managerId },
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
        _count: {
          select: {
            verifiedUsers: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!manager) {
      throw new AppError('Manager not found', 404, 'MANAGER_NOT_FOUND');
    }

    return manager;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error fetching manager', {
      error: error instanceof Error ? error.message : 'Unknown error',
      managerId,
    });

    throw new AppError('Failed to fetch manager', 500, 'MANAGER_FETCH_ERROR');
  }
};
