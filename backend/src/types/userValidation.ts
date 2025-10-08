import { z } from 'zod';
import { Sex } from '@prisma/client';

/**
 * Validation schema for user enrollment
 * Comprehensive validation for all user input fields
 */

// Helper function to calculate age from date of birth
export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

// Aadhar number validation
const aadharSchema = z
  .string()
  .min(1, 'Aadhar number is required')
  .regex(/^\d{12}$/, 'Aadhar number must be exactly 12 digits')
  .transform(val => val.replace(/[\s-]/g, '')); // Clean spaces and hyphens

// Contact number validation
const contactSchema = z
  .string()
  .min(1, 'Contact number is required')
  .regex(
    /^[6-9]\d{9}$/,
    'Contact number must be a valid 10-digit Indian mobile number'
  );

// Email validation (optional)
const emailSchema = z
  .string()
  .email('Invalid email format')
  .optional()
  .or(z.literal(''));

// Date validation with age check
const dateOfBirthSchema = z
  .string()
  .min(1, 'Date of birth is required')
  .transform(val => new Date(val))
  .refine(date => !isNaN(date.getTime()), 'Invalid date format')
  .refine(date => {
    const age = calculateAge(date);
    return age >= 18;
  }, 'User must be at least 18 years old to register')
  .refine(date => {
    const age = calculateAge(date);
    return age <= 120;
  }, 'Invalid date of birth - age cannot exceed 120 years');

// Pincode validation
const pincodeSchema = z
  .string()
  .min(1, 'Pincode is required')
  .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits');

// Assembly number validation (optional)
const assemblyNumberSchema = z
  .string()
  .regex(/^\d{1,3}$/, 'Assembly number must be 1-3 digits')
  .optional()
  .or(z.literal(''));

// Polling station number validation (optional)
const pollingStationSchema = z
  .string()
  .regex(/^\d{1,4}$/, 'Polling station number must be 1-4 digits')
  .optional()
  .or(z.literal(''));

// EPIC number validation (optional)
const epicNumberSchema = z
  .string()
  .regex(
    /^[A-Z]{3}\d{7}$/,
    'EPIC number must be in format ABC1234567 (3 letters + 7 digits)'
  )
  .optional()
  .or(z.literal(''));

// Graduation year validation (optional)
const graduationYearSchema = z
  .number()
  .int('Graduation year must be a whole number')
  .min(1950, 'Graduation year cannot be before 1950')
  .max(new Date().getFullYear(), 'Graduation year cannot be in the future')
  .optional();

// Main user enrollment schema
export const userEnrollmentSchema = z
  .object({
    // Personal Information
    aadharNumber: aadharSchema,
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Full name must be at least 2 characters')
      .max(255, 'Full name cannot exceed 255 characters')
      .regex(
        /^[a-zA-Z\s.'-]+$/,
        'Full name can only contain letters, spaces, dots, apostrophes, and hyphens'
      ),

    sex: z.nativeEnum(Sex, {
      message: 'Sex must be MALE, FEMALE, or OTHER',
    }),

    guardianSpouse: z
      .string()
      .min(2, 'Guardian/Spouse name must be at least 2 characters')
      .max(255, 'Guardian/Spouse name cannot exceed 255 characters')
      .regex(
        /^[a-zA-Z\s.'-]+$/,
        'Guardian/Spouse name can only contain letters, spaces, dots, apostrophes, and hyphens'
      )
      .optional()
      .or(z.literal('')),

    qualification: z
      .string()
      .max(255, 'Qualification cannot exceed 255 characters')
      .optional()
      .or(z.literal('')),

    occupation: z
      .string()
      .max(255, 'Occupation cannot exceed 255 characters')
      .optional()
      .or(z.literal('')),

    contact: contactSchema,
    email: emailSchema,
    dateOfBirth: dateOfBirthSchema,

    // Address Information
    houseNumber: z
      .string()
      .min(1, 'House number is required')
      .max(50, 'House number cannot exceed 50 characters'),

    street: z
      .string()
      .min(1, 'Street is required')
      .max(255, 'Street cannot exceed 255 characters'),

    area: z
      .string()
      .min(1, 'Area is required')
      .max(255, 'Area cannot exceed 255 characters'),

    city: z
      .string()
      .min(1, 'City is required')
      .max(100, 'City cannot exceed 100 characters')
      .default('PUNE'),

    state: z
      .string()
      .min(1, 'State is required')
      .max(100, 'State cannot exceed 100 characters'),

    pincode: pincodeSchema,

    // Elector Information (conditional)
    isRegisteredElector: z.boolean().default(false),
    assemblyNumber: assemblyNumberSchema,
    assemblyName: z
      .string()
      .max(255, 'Assembly name cannot exceed 255 characters')
      .optional()
      .or(z.literal('')),
    pollingStationNumber: pollingStationSchema,
    epicNumber: epicNumberSchema,
    disabilities: z.array(z.string()).optional(),

    // Education Information
    university: z
      .string()
      .max(255, 'University name cannot exceed 255 characters')
      .optional()
      .or(z.literal('')),
    graduationYear: graduationYearSchema,
    graduationDocType: z
      .string()
      .max(100, 'Graduation document type cannot exceed 100 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    data => {
      // If registered elector, assembly number is required
      if (data.isRegisteredElector && !data.assemblyNumber) {
        return false;
      }
      return true;
    },
    {
      message: 'Assembly number is required for registered electors',
      path: ['assemblyNumber'],
    }
  )
  .refine(
    data => {
      // If registered elector, assembly name is required
      if (data.isRegisteredElector && !data.assemblyName) {
        return false;
      }
      return true;
    },
    {
      message: 'Assembly name is required for registered electors',
      path: ['assemblyName'],
    }
  )
  .refine(
    data => {
      // If registered elector, polling station is required
      if (data.isRegisteredElector && !data.pollingStationNumber) {
        return false;
      }
      return true;
    },
    {
      message: 'Polling station number is required for registered electors',
      path: ['pollingStationNumber'],
    }
  )

  .refine(
    data => {
      // If registered elector, EPIC number is required
      if (data.isRegisteredElector && !data.epicNumber) {
        return false;
      }
      return true;
    },
    {
      message: 'EPIC number is required for registered electors',
      path: ['epicNumber'],
    }
  );

// Type inference for TypeScript
export type UserEnrollmentData = z.infer<typeof userEnrollmentSchema>;

// Schema for user enrollment input validation
export const validateUserEnrollmentInput = (data: unknown) => {
  return userEnrollmentSchema.safeParse(data);
};

// Schema for user profile update validation (all fields optional)
const userUpdateSchema = userEnrollmentSchema.partial();

export const validateUserUpdateInput = (data: unknown) => {
  return userUpdateSchema.safeParse(data);
};

// Helper function to transform enrollment data for database
export const transformEnrollmentData = (data: UserEnrollmentData) => {
  const age = calculateAge(data.dateOfBirth);

  return {
    aadharNumber: data.aadharNumber,
    fullName: data.fullName.trim(),
    sex: data.sex,
    guardianSpouse: data.guardianSpouse?.trim() || null,
    qualification: data.qualification?.trim() || null,
    occupation: data.occupation?.trim() || null,
    contact: data.contact,
    email: data.email?.trim() || null,
    dateOfBirth: data.dateOfBirth,
    age,
    houseNumber: data.houseNumber.trim(),
    street: data.street.trim(),
    area: data.area.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    pincode: data.pincode,
    isRegisteredElector: data.isRegisteredElector,
    assemblyNumber: data.assemblyNumber?.trim() || null,
    assemblyName: data.assemblyName?.trim() || null,
    pollingStationNumber: data.pollingStationNumber?.trim() || null,
    epicNumber: data.epicNumber?.trim() || null,
    disabilities:
      Array.isArray(data.disabilities) && data.disabilities.length > 0
        ? JSON.stringify(data.disabilities)
        : null,
    university: data.university?.trim() || null,
    graduationYear: data.graduationYear || null,
    graduationDocType: data.graduationDocType?.trim() || null,
  };
};
