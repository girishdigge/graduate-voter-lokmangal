import { z } from 'zod';

// Personal Information Schema
export const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    required_error: 'Please select your sex',
  }),
  guardianSpouse: z
    .string()
    .min(2, 'Guardian/Spouse name must be at least 2 characters'),
  qualification: z.string().min(1, 'Please select your qualification'),
  occupation: z.string().min(2, 'Occupation must be at least 2 characters'),
  contact: z
    .string()
    .regex(/^\d{10}$/, 'Contact number must be exactly 10 digits'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
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
    electorDob: z.string().optional(),
    epicNumber: z.string().optional(),
  })
  .refine(
    data => {
      if (data.isRegisteredElector) {
        return (
          data.assemblyNumber &&
          data.assemblyName &&
          data.pollingStationNumber &&
          data.electorDob &&
          data.epicNumber
        );
      }
      return true;
    },
    {
      message: 'All elector fields are required when registered as elector',
      path: ['isRegisteredElector'],
    }
  );

// Education Information Schema
export const educationSchema = z.object({
  university: z
    .string()
    .min(2, 'University name must be at least 2 characters'),
  graduationYear: z
    .string()
    .regex(/^\d{4}$/, 'Graduation year must be a valid 4-digit year'),
  graduationDocumentType: z.enum(
    ['DEGREE_CERTIFICATE', 'DIPLOMA', 'MARKSHEET', 'OTHER'],
    {
      required_error: 'Please select document type',
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
    .regex(/^\d{10}$/, 'Contact number must be exactly 10 digits'),
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type ElectorFormData = z.infer<typeof electorSchema>;
export type EducationFormData = z.infer<typeof educationSchema>;
export type EnrollmentFormData = z.infer<typeof enrollmentFormSchema>;
export type ReferenceFormData = z.infer<typeof referenceSchema>;
