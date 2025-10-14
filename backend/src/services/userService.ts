import { PrismaClient } from '@prisma/client';
import { generateUserToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';
import {
  UserEnrollmentData,
  transformEnrollmentData,
  calculateAge,
} from '../types/userValidation.js';
import { logUserCreation } from './auditService.js';
import searchService from './searchService.js';
import { Request } from 'express';

const prisma = new PrismaClient();

/**
 * Validate Aadhar number format
 */
export const validateAadharFormat = (aadharNumber: string): boolean => {
  // Remove any spaces or hyphens
  const cleanAadhar = aadharNumber.replace(/[\s-]/g, '');

  // Check if it's exactly 12 digits
  const aadharRegex = /^\d{12}$/;
  return aadharRegex.test(cleanAadhar);
};

/**
 * Clean Aadhar number by removing spaces and hyphens
 */
export const cleanAadharNumber = (aadharNumber: string): string => {
  return aadharNumber.replace(/[\s-]/g, '');
};

/**
 * Check if Aadhar number exists in the database
 */
export const checkAadharExists = async (aadharNumber: string) => {
  try {
    const cleanAadhar = cleanAadharNumber(aadharNumber);

    // Validate format first
    if (!validateAadharFormat(cleanAadhar)) {
      throw new AppError(
        'Invalid Aadhar number format. Please enter a valid 12-digit Aadhar number.',
        400,
        'INVALID_AADHAR_FORMAT'
      );
    }

    // Look up user in database
    const existingUser = await prisma.user.findUnique({
      where: {
        aadharNumber: cleanAadhar,
      },
      select: {
        id: true,
        fullName: true,
        contact: true,
        email: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (existingUser) {
      logger.info('Aadhar check - existing user found', {
        userId: existingUser.id,
        aadharNumber:
          cleanAadhar.substring(0, 4) + '****' + cleanAadhar.substring(8), // Log masked Aadhar
      });

      return {
        exists: true,
        user: {
          id: existingUser.id,
          fullName: existingUser.fullName,
          contact: existingUser.contact,
          email: existingUser.email,
          isVerified: existingUser.isVerified,
          createdAt: existingUser.createdAt,
        },
      };
    }

    logger.info('Aadhar check - new user', {
      aadharNumber:
        cleanAadhar.substring(0, 4) + '****' + cleanAadhar.substring(8), // Log masked Aadhar
    });

    return {
      exists: false,
      user: null,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error checking Aadhar existence', {
      error: error instanceof Error ? error.message : 'Unknown error',
      aadharNumber:
        aadharNumber.substring(0, 4) + '****' + aadharNumber.substring(8),
    });

    throw new AppError(
      'Failed to check Aadhar number',
      500,
      'AADHAR_CHECK_FAILED'
    );
  }
};

/**
 * Generate user session token after Aadhar verification
 */
export const generateUserSession = async (userId: string) => {
  try {
    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Generate JWT token
    const token = generateUserToken(userId);

    logger.info('User session generated', {
      userId: user.id,
      userName: user.fullName,
      isVerified: user.isVerified,
    });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        isVerified: user.isVerified,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error generating user session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });

    throw new AppError(
      'Failed to generate user session',
      500,
      'SESSION_GENERATION_FAILED'
    );
  }
};

/**
 * Create new user enrollment with comprehensive validation and audit logging
 */
export const createUserEnrollment = async (
  enrollmentData: UserEnrollmentData,
  req?: Request
) => {
  try {
    // Transform and validate the enrollment data
    const userData = transformEnrollmentData(enrollmentData);

    // Check if Aadhar number already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        aadharNumber: userData.aadharNumber,
      },
    });

    if (existingUser) {
      throw new AppError(
        'Aadhar number already registered in the system',
        409,
        'AADHAR_ALREADY_EXISTS'
      );
    }

    // // Check if contact number already exists for a different user
    // const existingContact = await prisma.user.findFirst({
    //   where: {
    //     contact: userData.contact,
    //   },
    // });

    // if (existingContact) {
    //   throw new AppError(
    //     'Contact number already registered with another account',
    //     409,
    //     'CONTACT_ALREADY_EXISTS'
    //   );
    // }

    // // Check if email already exists (if provided)
    // if (userData.email) {
    //   const existingEmail = await prisma.user.findFirst({
    //     where: {
    //       email: userData.email,
    //     },
    //   });

    //   if (existingEmail) {
    //     throw new AppError(
    //       'Email address already registered with another account',
    //       409,
    //       'EMAIL_ALREADY_EXISTS'
    //     );
    //   }
    // }

    // Create user in database transaction
    const newUser = await prisma.$transaction(async tx => {
      // Create the user
      const user = await tx.user.create({
        data: userData,
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
          verifiedBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    });

    // Log user creation for audit trail
    await logUserCreation(newUser.id, userData, req);

    // Index user in Elasticsearch for search functionality
    try {
      await searchService.indexUser(newUser);
      logger.debug('User indexed in Elasticsearch', { userId: newUser.id });
    } catch (error) {
      logger.warn('Failed to index user in Elasticsearch', {
        userId: newUser.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't fail the user creation if indexing fails
    }

    // Generate user session token
    const token = generateUserToken(newUser.id);

    logger.info('User enrollment completed successfully', {
      userId: newUser.id,
      userName: newUser.fullName,
      aadharNumber:
        userData.aadharNumber.substring(0, 4) +
        '****' +
        userData.aadharNumber.substring(8),
      contact: newUser.contact,
      isRegisteredElector: newUser.isRegisteredElector,
    });

    return {
      success: true,
      user: newUser,
      token,
      message: 'User enrollment completed successfully',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error creating user enrollment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      aadharNumber: enrollmentData.aadharNumber
        ? enrollmentData.aadharNumber.substring(0, 4) +
          '****' +
          enrollmentData.aadharNumber.substring(8)
        : 'unknown',
    });

    throw new AppError(
      'Failed to create user enrollment',
      500,
      'USER_ENROLLMENT_FAILED'
    );
  }
};

/**
 * Update user information with validation and audit logging
 */
export const updateUserInformation = async (
  userId: string,
  updateData: Partial<UserEnrollmentData>,
  req?: Request,
  adminId?: string
) => {
  try {
    // Get current user data for audit logging
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Transform update data (handle partial updates)
    const transformedData: any = {};

    // Only transform fields that are present in the update data
    if (updateData.fullName !== undefined)
      transformedData.fullName = updateData.fullName.trim();
    if (updateData.sex !== undefined) transformedData.sex = updateData.sex;
    if (updateData.guardianSpouse !== undefined)
      transformedData.guardianSpouse =
        updateData.guardianSpouse?.trim() || null;
    if (updateData.qualification !== undefined)
      transformedData.qualification = updateData.qualification?.trim() || null;
    if (updateData.occupation !== undefined)
      transformedData.occupation = updateData.occupation?.trim() || null;
    if (updateData.contact !== undefined)
      transformedData.contact = updateData.contact;
    if (updateData.email !== undefined)
      transformedData.email = updateData.email?.trim() || null;
    if (updateData.dateOfBirth !== undefined) {
      transformedData.dateOfBirth = updateData.dateOfBirth;
      transformedData.age = calculateAge(updateData.dateOfBirth);
    }
    if (updateData.houseNumber !== undefined)
      transformedData.houseNumber = updateData.houseNumber.trim();
    if (updateData.street !== undefined)
      transformedData.street = updateData.street.trim();
    if (updateData.area !== undefined)
      transformedData.area = updateData.area.trim();
    if (updateData.city !== undefined)
      transformedData.city = updateData.city.trim();
    if (updateData.state !== undefined)
      transformedData.state = updateData.state.trim();
    if (updateData.pincode !== undefined)
      transformedData.pincode = updateData.pincode;
    if (updateData.isRegisteredElector !== undefined)
      transformedData.isRegisteredElector = updateData.isRegisteredElector;
    if (updateData.assemblyNumber !== undefined)
      transformedData.assemblyNumber =
        updateData.assemblyNumber?.trim() || null;
    if (updateData.assemblyName !== undefined)
      transformedData.assemblyName = updateData.assemblyName?.trim() || null;
    if (updateData.pollingStationNumber !== undefined)
      transformedData.pollingStationNumber =
        updateData.pollingStationNumber?.trim() || null;
    if (updateData.epicNumber !== undefined)
      transformedData.epicNumber = updateData.epicNumber?.trim() || null;
    if (updateData.disabilities !== undefined)
      transformedData.disabilities = Array.isArray(updateData.disabilities)
        ? JSON.stringify(updateData.disabilities)
        : updateData.disabilities;
    if (updateData.university !== undefined)
      transformedData.university = updateData.university?.trim() || null;
    if (updateData.graduationYear !== undefined)
      transformedData.graduationYear = updateData.graduationYear || null;
    if (updateData.graduationDocType !== undefined)
      transformedData.graduationDocType =
        updateData.graduationDocType?.trim() || null;

    // Remove fields that shouldn't be updated
    const { aadharNumber, ...updateFields } = transformedData;

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
      data: updateFields,
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
        verifiedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log user update for audit trail
    const { logUserUpdate } = await import('./auditService.js');
    await logUserUpdate(userId, currentUser, updateFields, req, adminId);

    // Update user in Elasticsearch index
    try {
      await searchService.indexUser(updatedUser);
      logger.debug('User updated in Elasticsearch', { userId: updatedUser.id });
    } catch (error) {
      logger.warn('Failed to update user in Elasticsearch', {
        userId: updatedUser.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't fail the user update if indexing fails
    }

    logger.info('User information updated successfully', {
      userId: updatedUser.id,
      userName: updatedUser.fullName,
      updatedBy: adminId ? 'admin' : 'user',
      adminId,
    });

    return {
      success: true,
      user: updatedUser,
      message: 'User information updated successfully',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error updating user information', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      adminId,
    });

    throw new AppError(
      'Failed to update user information',
      500,
      'USER_UPDATE_FAILED'
    );
  }
};

/**
 * Get user by ID for authenticated requests
 */
export const getUserById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        verifiedBy: true,
        createdAt: true,
        updatedAt: true,
        verifiedByAdmin: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error fetching user by ID', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });

    throw new AppError(
      'Failed to fetch user information',
      500,
      'USER_FETCH_FAILED'
    );
  }
};

/**
 * Validate user session and check if user is still active
 */
export const validateUserSession = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError(
        'User session invalid - user not found',
        401,
        'INVALID_SESSION'
      );
    }

    logger.debug('User session validated', {
      userId: user.id,
      userName: user.fullName,
      isVerified: user.isVerified,
    });

    return {
      valid: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        isVerified: user.isVerified,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error validating user session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });

    throw new AppError(
      'Failed to validate user session',
      500,
      'SESSION_VALIDATION_FAILED'
    );
  }
};
