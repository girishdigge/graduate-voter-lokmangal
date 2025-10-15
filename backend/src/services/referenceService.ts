import { PrismaClient, ReferenceStatus, Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';
import type { Request } from 'express';
import { logReferenceCreation, logReferenceUpdate } from './auditService.js';
import searchService from './searchService.js';

const prisma = new PrismaClient();

interface ReferenceData {
  referenceName: string;
  referenceContact: string;
}

interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: string;
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

/**
 * Validate reference contact number format
 */
export const validateContactFormat = (contact: string): boolean => {
  // Remove any spaces, hyphens, or plus signs
  const cleanContact = contact.replace(/[\s\-\+]/g, '');

  // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
  const contactRegex = /^[6-9]\d{9}$/;
  return contactRegex.test(cleanContact);
};

/**
 * Clean contact number by removing spaces, hyphens, and formatting
 */
export const cleanContactNumber = (contact: string): string => {
  let cleanContact = contact.replace(/[\s\-\+]/g, '');

  // If it starts with 91 (India country code), remove it
  if (cleanContact.startsWith('91') && cleanContact.length === 12) {
    cleanContact = cleanContact.substring(2);
  }

  return cleanContact;
};

/**
 * Format contact number for WhatsApp (with country code)
 */
export const formatContactForWhatsApp = (contact: string): string => {
  const cleanContact = cleanContactNumber(contact);
  // Return without + prefix for WhatsApp API (just country code + number)
  return `91${cleanContact}`;
};

/**
 * Send simple WhatsApp text message (fallback)
 */
const sendSimpleWhatsAppMessage = async (
  to: string,
  message: string,
  apiUrl: string,
  accessToken: string,
  phoneNumberId: string
): Promise<boolean> => {
  try {
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: message,
      },
    };

    const response = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('WhatsApp simple message failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        to: to.substring(0, 4) + '****' + to.substring(8),
      });
      return false;
    }

    const responseData = (await response.json()) as any;
    logger.info('WhatsApp simple message sent successfully', {
      messageId: responseData.messages?.[0]?.id,
      to: to.substring(0, 4) + '****' + to.substring(8),
    });

    return true;
  } catch (error) {
    logger.error('Error sending simple WhatsApp message', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: to.substring(0, 4) + '****' + to.substring(8),
    });
    return false;
  }
};

/**
 * Send WhatsApp notification to reference
 */
export const sendWhatsAppNotification = async (
  referenceContact: string,
  referenceName: string,
  voterName: string,
  voterContact: string
): Promise<boolean> => {
  try {
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappApiUrl || !accessToken || !phoneNumberId) {
      logger.warn('WhatsApp configuration missing, skipping notification', {
        referenceContact:
          referenceContact.substring(0, 4) +
          '****' +
          referenceContact.substring(8),
        referenceName,
      });
      return false;
    }

    const formattedContact = formatContactForWhatsApp(referenceContact);

    // Create WhatsApp message payload - using hello_world template for testing
    const messagePayload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: formattedContact,
      type: 'template',
      template: {
        name: 'hello_world', // Using standard template that works
        language: {
          code: 'en_US',
        },
      },
    };

    // Send WhatsApp message
    const response = await fetch(
      `${whatsappApiUrl}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      let errorDetails;

      try {
        errorDetails = JSON.parse(errorData);
      } catch (e) {
        errorDetails = { error: { message: errorData } };
      }

      // Log specific error types for better debugging
      if (errorDetails.error?.code === 190) {
        logger.error('WhatsApp access token expired or invalid', {
          error: errorDetails.error.message,
          code: errorDetails.error.code,
          referenceContact:
            referenceContact.substring(0, 4) +
            '****' +
            referenceContact.substring(8),
        });
      } else if (errorDetails.error?.code === 2500) {
        logger.error('WhatsApp API URL or phone number ID issue', {
          error: errorDetails.error.message,
          code: errorDetails.error.code,
          phoneNumberId: phoneNumberId,
        });
      } else {
        logger.error('WhatsApp API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          referenceContact:
            referenceContact.substring(0, 4) +
            '****' +
            referenceContact.substring(8),
        });
      }

      // Try fallback to simple text message if template fails
      if (
        errorDetails.error?.code === 132 ||
        errorDetails.error?.message?.includes('template')
      ) {
        logger.info('Template message failed, trying simple text message', {
          referenceContact:
            referenceContact.substring(0, 4) +
            '****' +
            referenceContact.substring(8),
        });

        return await sendSimpleWhatsAppMessage(
          formattedContact,
          `Hello ${referenceName}, You have been added as a reference by ${voterName} (Contact: ${voterContact}) for voter registration. Please verify this information and respond if you have any concerns. Thank you.`,
          whatsappApiUrl,
          accessToken,
          phoneNumberId
        );
      }

      return false;
    }

    const responseData = (await response.json()) as any;
    logger.info('WhatsApp notification sent successfully', {
      messageId: responseData.messages?.[0]?.id,
      referenceContact:
        referenceContact.substring(0, 4) +
        '****' +
        referenceContact.substring(8),
      referenceName,
      voterName,
    });

    return true;
  } catch (error) {
    logger.error('Error sending WhatsApp notification', {
      error: error instanceof Error ? error.message : 'Unknown error',
      referenceContact:
        referenceContact.substring(0, 4) +
        '****' +
        referenceContact.substring(8),
      referenceName,
    });
    return false;
  }
};

/**
 * Add references for a user
 */
export const addUserReferences = async (
  userId: string,
  references: ReferenceData[],
  req?: Request
) => {
  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        contact: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Validate reference data
    const validatedReferences: ReferenceData[] = [];
    const errors: string[] = [];

    for (let i = 0; i < references.length; i++) {
      const ref: ReferenceData = references[i];

      if (!ref.referenceName || ref.referenceName.trim().length === 0) {
        errors.push(`Reference ${i + 1}: Name is required`);
        continue;
      }

      if (!ref.referenceContact || ref.referenceContact.trim().length === 0) {
        errors.push(`Reference ${i + 1}: Contact is required`);
        continue;
      }

      const cleanContact = cleanContactNumber(ref.referenceContact);

      if (!validateContactFormat(cleanContact)) {
        errors.push(`Reference ${i + 1}: Invalid contact number format`);
        continue;
      }

      // Check if reference contact is same as user's contact
      if (cleanContact === cleanContactNumber(user.contact)) {
        errors.push(
          `Reference ${i + 1}: Cannot use your own contact number as reference`
        );
        continue;
      }

      validatedReferences.push({
        referenceName: ref.referenceName.trim(),
        referenceContact: cleanContact,
      });
    }

    if (errors.length > 0) {
      throw new AppError(
        `Validation errors: ${errors.join(', ')}`,
        400,
        'REFERENCE_VALIDATION_ERROR'
      );
    }

    if (validatedReferences.length === 0) {
      throw new AppError(
        'At least one valid reference is required',
        400,
        'NO_VALID_REFERENCES'
      );
    }

    // Check for duplicate references within the submission
    const contactSet = new Set();
    for (const ref of validatedReferences) {
      if (contactSet.has(ref.referenceContact)) {
        throw new AppError(
          'Duplicate reference contact numbers are not allowed',
          400,
          'DUPLICATE_REFERENCE_CONTACT'
        );
      }
      contactSet.add(ref.referenceContact);
    }

    // Check for existing references for this user
    const existingReferences = await prisma.reference.findMany({
      where: {
        userId,
        referenceContact: {
          in: validatedReferences.map(
            (ref: ReferenceData) => ref.referenceContact
          ),
        },
      },
    });

    // Filter out existing references and only add new ones
    const existingContacts = new Set(
      existingReferences.map((ref: any) => ref.referenceContact)
    );

    const newReferences = validatedReferences.filter(
      (ref: ReferenceData) => !existingContacts.has(ref.referenceContact)
    );

    const duplicateContacts = validatedReferences.filter((ref: ReferenceData) =>
      existingContacts.has(ref.referenceContact)
    );

    // Log information about duplicates (but don't fail)
    if (duplicateContacts.length > 0) {
      logger.info('Some references already exist, skipping duplicates', {
        userId,
        duplicateCount: duplicateContacts.length,
        newCount: newReferences.length,
        duplicateContacts: duplicateContacts.map(
          ref =>
            ref.referenceContact.substring(0, 4) +
            '****' +
            ref.referenceContact.substring(8)
        ),
      });
    }

    // If no new references to add, return success with existing references
    if (newReferences.length === 0) {
      logger.info('All references already exist, no new references to add', {
        userId,
        totalSubmitted: validatedReferences.length,
        existingCount: duplicateContacts.length,
      });

      return {
        success: true,
        references: existingReferences,
        whatsappResults: [],
        message: `All ${validatedReferences.length} reference(s) already exist. No new references added.`,
        duplicatesSkipped: duplicateContacts.length,
        newReferencesAdded: 0,
      };
    }

    // Create references in database transaction (only for new references)
    const createdReferences = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const references = [];

        for (const refData of newReferences) {
          const reference = await tx.reference.create({
            data: {
              userId,
              referenceName: refData.referenceName,
              referenceContact: refData.referenceContact,
              status: ReferenceStatus.PENDING,
              whatsappSent: false,
            },
            select: {
              id: true,
              referenceName: true,
              referenceContact: true,
              status: true,
              whatsappSent: true,
              whatsappSentAt: true,
              createdAt: true,
            },
          });

          references.push(reference);
        }

        return references;
      }
    );

    // Send WhatsApp notifications asynchronously
    const notificationPromises = createdReferences.map(
      async (reference: any) => {
        try {
          const whatsappSent = await sendWhatsAppNotification(
            reference.referenceContact,
            reference.referenceName,
            user.fullName,
            user.contact
          );

          // Update WhatsApp sent status
          await prisma.reference.update({
            where: { id: reference.id },
            data: {
              whatsappSent,
              whatsappSentAt: whatsappSent ? new Date() : null,
            },
          });

          return { referenceId: reference.id, sent: whatsappSent };
        } catch (error) {
          logger.error('Error updating WhatsApp status', {
            error: error instanceof Error ? error.message : 'Unknown error',
            referenceId: reference.id,
          });
          return { referenceId: reference.id, sent: false };
        }
      }
    );

    // Wait for all notifications to complete
    const notificationResults = await Promise.all(notificationPromises);

    // Log reference creation for audit trail
    await logReferenceCreation(userId, createdReferences, req);

    // Index references in Elasticsearch for search functionality
    const indexingPromises = createdReferences.map(async (reference: any) => {
      try {
        await searchService.indexReference({
          ...reference,
          userId,
          updatedAt: reference.createdAt, // Use createdAt as updatedAt for new references
          statusUpdatedAt: null,
          user: {
            fullName: user.fullName,
            contact: user.contact,
            aadharNumber: '', // We don't have access to aadhar here, will be updated later if needed
          },
        });
        logger.debug('Reference indexed in Elasticsearch', {
          referenceId: reference.id,
        });
      } catch (error) {
        logger.warn('Failed to index reference in Elasticsearch', {
          referenceId: reference.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't fail the reference creation if indexing fails
      }
    });

    // Wait for all indexing operations to complete (non-blocking)
    Promise.all(indexingPromises).catch(error => {
      logger.warn('Some references failed to index in Elasticsearch', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    logger.info('References processed successfully', {
      userId,
      userName: user.fullName,
      totalSubmitted: validatedReferences.length,
      newReferencesAdded: createdReferences.length,
      duplicatesSkipped: duplicateContacts.length,
      whatsappSent: notificationResults.filter((r: any) => r.sent).length,
    });

    // Create appropriate success message
    let message = '';
    if (duplicateContacts.length > 0 && createdReferences.length > 0) {
      message = `${createdReferences.length} new reference(s) added successfully. ${duplicateContacts.length} duplicate(s) skipped.`;
    } else if (createdReferences.length > 0) {
      message = `${createdReferences.length} reference(s) added successfully.`;
    }

    return {
      success: true,
      references: createdReferences,
      whatsappResults: notificationResults,
      message,
      duplicatesSkipped: duplicateContacts.length,
      newReferencesAdded: createdReferences.length,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error adding user references', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      referenceCount: references.length,
    });

    throw new AppError(
      'Failed to add references',
      500,
      'REFERENCE_CREATION_FAILED'
    );
  }
};

/**
 * Get references for a user
 */
export const getUserReferences = async (userId: string) => {
  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Get user references
    const references = await prisma.reference.findMany({
      where: { userId },
      select: {
        id: true,
        referenceName: true,
        referenceContact: true,
        status: true,
        whatsappSent: true,
        whatsappSentAt: true,
        statusUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('User references retrieved', {
      userId,
      referenceCount: references.length,
    });

    return {
      success: true,
      references,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error retrieving user references', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });

    throw new AppError(
      'Failed to retrieve references',
      500,
      'REFERENCE_FETCH_FAILED'
    );
  }
};

/**
 * Get all references with filtering and pagination (for admin use)
 */
export const getAllReferencesWithFilters = async (
  page: number,
  limit: number,
  status?: ReferenceStatus,
  search?: string
) => {
  try {
    // Build where clause
    const where: any = {};

    if (status && Object.values(ReferenceStatus).includes(status)) {
      where.status = status;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Split search into words for relaxed matching
      const searchWords = searchTerm
        .split(/\s+/)
        .filter(word => word.length > 0);

      // Build OR conditions for each search word (relaxed matching)
      // Note: MySQL doesn't support mode: 'insensitive', so we'll use contains without mode
      const searchConditions = searchWords.flatMap(word => [
        { referenceName: { contains: word } },
        { referenceContact: { contains: word } },
        { user: { fullName: { contains: word } } },
      ]);

      where.OR = searchConditions;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get references with pagination
    const [references, total] = await Promise.all([
      prisma.reference.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          referenceName: true,
          referenceContact: true,
          status: true,
          whatsappSent: true,
          whatsappSentAt: true,
          statusUpdatedAt: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              contact: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.reference.count({ where }),
    ]);

    logger.info('All references retrieved', {
      page,
      limit,
      status: status || 'all',
      search: search ? 'provided' : 'none',
      total,
      returned: references.length,
    });

    return {
      success: true,
      references,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error retrieving all references', {
      error: error instanceof Error ? error.message : 'Unknown error',
      page,
      limit,
      status,
      search,
    });

    throw new AppError(
      'Failed to retrieve references',
      500,
      'REFERENCE_FETCH_FAILED'
    );
  }
};

/**
 * Get contacts who have referred this user (where user's contact appears as referenceContact)
 */
export const getWhoReferredUser = async (userId: string) => {
  try {
    // Get user's contact number
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        contact: true,
        fullName: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const cleanUserContact = cleanContactNumber(user.contact);

    // Find all references where this user's contact number appears as referenceContact
    const whoReferredMe = await prisma.reference.findMany({
      where: {
        referenceContact: cleanUserContact,
      },
      select: {
        id: true,
        referenceName: true,
        referenceContact: true,
        status: true,
        whatsappSent: true,
        whatsappSentAt: true,
        statusUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            contact: true,
            aadharNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Who referred user retrieved', {
      userId,
      userContact:
        cleanUserContact.substring(0, 4) +
        '****' +
        cleanUserContact.substring(8),
      referredByCount: whoReferredMe.length,
    });

    return {
      success: true,
      whoReferredMe,
      userInfo: {
        id: user.id,
        fullName: user.fullName,
        contact: user.contact,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error retrieving who referred user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });

    throw new AppError(
      'Failed to retrieve who referred user',
      500,
      'WHO_REFERRED_USER_FETCH_FAILED'
    );
  }
};

/**
 * Get contacts referred by a user (references that this user has added)
 */
export const getReferredContacts = async (userId: string) => {
  try {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        contact: true,
        fullName: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Find all references that this user has added (where userId matches)
    const referredContacts = await prisma.reference.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        referenceName: true,
        referenceContact: true,
        status: true,
        whatsappSent: true,
        whatsappSentAt: true,
        statusUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            contact: true,
            aadharNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Referred contacts retrieved', {
      userId,
      referredCount: referredContacts.length,
    });

    return {
      success: true,
      referredContacts,
      userInfo: {
        id: user.id,
        fullName: user.fullName,
        contact: user.contact,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error retrieving referred contacts', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });

    throw new AppError(
      'Failed to retrieve referred contacts',
      500,
      'REFERRED_CONTACTS_FETCH_FAILED'
    );
  }
};

/**
 * Update reference status (for admin use)
 */
export const updateReferenceStatus = async (
  referenceId: string,
  status: ReferenceStatus,
  adminId?: string,
  req?: Request
) => {
  try {
    // Get current reference data
    const currentReference = await prisma.reference.findUnique({
      where: { id: referenceId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!currentReference) {
      throw new AppError('Reference not found', 404, 'REFERENCE_NOT_FOUND');
    }

    // Update reference status
    const updatedReference = await prisma.reference.update({
      where: { id: referenceId },
      data: {
        status,
        statusUpdatedAt: new Date(),
      },
      select: {
        id: true,
        referenceName: true,
        referenceContact: true,
        status: true,
        whatsappSent: true,
        whatsappSentAt: true,
        statusUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Log reference update for audit trail
    await logReferenceUpdate(
      referenceId,
      { status: currentReference.status },
      { status },
      req,
      adminId
    );

    // Update reference in Elasticsearch index
    try {
      await searchService.indexReference({
        ...updatedReference,
        userId: updatedReference.user.id,
        user: {
          fullName: updatedReference.user.fullName,
          contact: '', // We don't have access to contact here
          aadharNumber: '', // We don't have access to aadhar here
        },
      });
      logger.debug('Reference updated in Elasticsearch', { referenceId });
    } catch (error) {
      logger.warn('Failed to update reference in Elasticsearch', {
        referenceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't fail the reference update if indexing fails
    }

    logger.info('Reference status updated', {
      referenceId,
      referenceName: updatedReference.referenceName,
      oldStatus: currentReference.status,
      newStatus: status,
      userId: updatedReference.user.id,
      adminId,
    });

    return {
      success: true,
      reference: updatedReference,
      message: 'Reference status updated successfully',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error updating reference status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      referenceId,
      status,
      adminId,
    });

    throw new AppError(
      'Failed to update reference status',
      500,
      'REFERENCE_UPDATE_FAILED'
    );
  }
};
