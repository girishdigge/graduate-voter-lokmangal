import { z } from 'zod';

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: Date): number => {
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

// Personal Information Schema
export const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Please select your sex',
  }),
  guardianSpouse: z
    .string()
    .min(2, 'Guardian/Spouse name must be at least 2 characters'),
  qualification: z.string().min(1, 'Please select your qualification'),
  occupation: z.string().min(2, 'Occupation must be at least 2 characters'),
  contact: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      'Contact number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
    ),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .transform(val => new Date(val))
    .refine(date => !isNaN(date.getTime()), 'Invalid date format')
    .refine(date => {
      const age = calculateAge(date);
      return age >= 18;
    }, 'You must be at least 18 years old to register')
    .refine(date => {
      const age = calculateAge(date);
      return age <= 120;
    }, 'Invalid date of birth - age cannot exceed 120 years')
    .transform(date => date.toISOString().split('T')[0]), // Convert back to string format
});

// Address Information Schema
export const addressSchema = z.object({
  houseNumber: z.string().min(1, 'House number is required'),
  street: z.string().min(2, 'Street name must be at least 2 characters'),
  area: z.string().min(2, 'Area must be at least 2 characters'),
  city: z.string().default('PUNE'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
});

// Elector Information Schema
export const electorSchema = z
  .object({
    isRegisteredElector: z.boolean(),
    assemblyNumber: z.string().optional(),
    assemblyName: z.string().optional(),
    pollingStationNumber: z.string().optional(),
    epicNumber: z.string().optional(),
    disabilities: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRegisteredElector) {
      if (!data.assemblyNumber || data.assemblyNumber.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Assembly number is required for registered electors',
          path: ['assemblyNumber'],
        });
      }
      if (!data.assemblyName || data.assemblyName.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Assembly name is required for registered electors',
          path: ['assemblyName'],
        });
      }
      if (
        !data.pollingStationNumber ||
        data.pollingStationNumber.trim() === ''
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Polling station number is required for registered electors',
          path: ['pollingStationNumber'],
        });
      }
      if (!data.epicNumber || data.epicNumber.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'EPIC number is required for registered electors',
          path: ['epicNumber'],
        });
      }
    }
  });

// Education Information Schema
export const educationSchema = z.object({
  university: z
    .string()
    .min(2, 'University name must be at least 2 characters'),
  graduationYear: z
    .string()
    .regex(/^\d{4}$/, 'Graduation year must be a valid 4-digit year')
    .transform(val => parseInt(val, 10))
    .refine(year => year >= 1950, 'Graduation year cannot be before 1950')
    .refine(
      year => year <= new Date().getFullYear(),
      'Graduation year cannot be in the future'
    ),
  graduationDocumentType: z.enum(
    ['DEGREE_CERTIFICATE', 'DIPLOMA', 'MARKSHEET', 'OTHER'],
    {
      message: 'Please select document type',
    }
  ),
});

// Complete Enrollment Form Schema
export const enrollmentFormSchema = z.object({
  personalInfo: personalInfoSchema,
  address: addressSchema,
  elector: electorSchema,
  education: educationSchema,
});

// Reference Schema
export const referenceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  contact: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      'Contact number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
    ),
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type ElectorFormData = z.infer<typeof electorSchema>;
export type EducationFormData = z.infer<typeof educationSchema>;
export type EnrollmentFormData = z.infer<typeof enrollmentFormSchema>;
export type ReferenceFormData = z.infer<typeof referenceSchema>;
