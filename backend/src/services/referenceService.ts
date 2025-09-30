import { PrismaClient, ReferenceStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';
import { Request } from 'express';
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
    components: Array<{
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
  return `91${cleanContact}`; // Add India country code
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

    // Create WhatsApp message payload
    const messagePayload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: formattedContact,
      type: 'template',
      template: {
        name: 'voter_reference_notification', // This template needs to be created in WhatsApp Business
        language: {
          code: 'en_US',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: referenceName,
              },
              {
                type: 'text',
                text: voterName,
              },
              {
                type: 'text',
                text: voterContact,
              },
            ],
          },
        ],
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
      logger.error('WhatsApp API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        referenceContact:
          referenceContact.substring(0, 4) +
          '****' +
          referenceContact.substring(8),
      });
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
      const ref = references[i];

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
          in: validatedReferences.map(ref => ref.referenceContact),
        },
      },
    });

    if (existingReferences.length > 0) {
      const duplicateContacts = existingReferences.map(
        ref =>
          ref.referenceContact.substring(0, 4) +
          '****' +
          ref.referenceContact.substring(8)
      );
      throw new AppError(
        `Reference contacts already exist: ${duplicateContacts.join(', ')}`,
        409,
        'REFERENCE_ALREADY_EXISTS'
      );
    }

    // Create references in database transaction
    const createdReferences = await prisma.$transaction(async tx => {
      const references = [];

      for (const refData of validatedReferences) {
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
    });

    // Send WhatsApp notifications asynchronously
    const notificationPromises = createdReferences.map(async reference => {
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
    });

    // Wait for all notifications to complete
    const notificationResults = await Promise.all(notificationPromises);

    // Log reference creation for audit trail
    await logReferenceCreation(userId, createdReferences, req);

    // Index references in Elasticsearch for search functionality
    const indexingPromises = createdReferences.map(async reference => {
      try {
        await searchService.indexReference({
          ...reference,
          userId,
          updatedAt: reference.createdAt, // Use createdAt as updatedAt for new references
          statusUpdatedAt: null,
          user: {
            full_name: user.fullName,
            contact: user.contact,
            aadhar_number: '', // We don't have access to aadhar here, will be updated later if needed
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

    logger.info('References added successfully', {
      userId,
      userName: user.fullName,
      referenceCount: createdReferences.length,
      whatsappSent: notificationResults.filter(r => r.sent).length,
    });

    return {
      success: true,
      references: createdReferences,
      whatsappResults: notificationResults,
      message: `${createdReferences.length} reference(s) added successfully`,
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
          full_name: updatedReference.user.fullName,
          contact: '', // We don't have access to contact here
          aadhar_number: '', // We don't have access to aadhar here
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
