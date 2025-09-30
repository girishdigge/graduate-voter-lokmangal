// Document upload utilities and validation

export const DOCUMENT_TYPES = {
  AADHAR: 'aadhar',
  DEGREE: 'degree',
  PHOTO: 'photo',
} as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

export const DOCUMENT_CONFIG = {
  [DOCUMENT_TYPES.AADHAR]: {
    label: 'Aadhar Card',
    accept: 'image/*,.pdf',
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true,
  },
  [DOCUMENT_TYPES.DEGREE]: {
    label: 'Degree Certificate',
    accept: 'image/*,.pdf',
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true,
  },
  [DOCUMENT_TYPES.PHOTO]: {
    label: 'Personal Photo',
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true,
  },
} as const;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const ALLOWED_DOCUMENT_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
];

export interface FileValidationError {
  code: string;
  message: string;
}

export function validateFile(
  file: File,
  documentType: DocumentType
): FileValidationError | null {
  const config = DOCUMENT_CONFIG[documentType];

  // Check file size
  if (file.size > config.maxSize) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File size must be less than ${formatFileSize(config.maxSize)}`,
    };
  }

  // Check file type
  const isValidType =
    documentType === DOCUMENT_TYPES.PHOTO
      ? ALLOWED_IMAGE_TYPES.includes(file.type)
      : ALLOWED_DOCUMENT_TYPES.includes(file.type);

  if (!isValidType) {
    return {
      code: 'INVALID_FILE_TYPE',
      message: `Please upload a valid ${config.label.toLowerCase()} file`,
    };
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function createFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeFilePreview(url: string): void {
  URL.revokeObjectURL(url);
}
