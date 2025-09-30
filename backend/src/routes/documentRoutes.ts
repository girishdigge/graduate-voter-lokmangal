import { Router } from 'express';
import {
  uploadUserDocument,
  getUserDocument,
  getAllUserDocuments,
  replaceUserDocument,
  deleteUserDocument,
  uploadMultipleDocuments,
} from '../controllers/documentController.js';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  handleMulterError,
  validateUploadedFiles,
  scanForMalware,
} from '../config/multer.js';
import { authenticateUser } from '../middleware/auth.js';
import { documentUploadLimiter } from '../config/rateLimiter.js';

const router = Router();

/**
 * Document upload and management routes
 * All routes require user authentication
 */

/**
 * @route   POST /api/documents/:userId/upload
 * @desc    Upload a single document for a user
 * @access  Private (User must be authenticated and match userId)
 * @body    { documentType: string }
 * @file    document (multipart/form-data)
 */
router.post(
  '/:userId/upload',
  documentUploadLimiter, // Rate limiting for uploads
  authenticateUser, // User authentication
  uploadSingleFile, // Multer file upload
  handleMulterError, // Handle multer errors
  validateUploadedFiles, // Validate uploaded files
  scanForMalware, // Malware scanning
  uploadUserDocument // Controller
);

/**
 * @route   POST /api/documents/:userId/upload-multiple
 * @desc    Upload multiple documents for a user
 * @access  Private (User must be authenticated and match userId)
 * @files   aadhar, degree, photo (multipart/form-data)
 */
router.post(
  '/:userId/upload-multiple',
  documentUploadLimiter, // Rate limiting for uploads
  authenticateUser, // User authentication
  uploadMultipleFiles, // Multer multiple file upload
  handleMulterError, // Handle multer errors
  validateUploadedFiles, // Validate uploaded files
  scanForMalware, // Malware scanning
  uploadMultipleDocuments // Controller
);

/**
 * @route   GET /api/documents/:userId/:documentType
 * @desc    Get a specific document for a user
 * @access  Private (User must be authenticated and match userId)
 */
router.get(
  '/:userId/:documentType',
  authenticateUser, // User authentication
  getUserDocument // Controller
);

/**
 * @route   GET /api/documents/:userId
 * @desc    Get all documents for a user
 * @access  Private (User must be authenticated and match userId)
 */
router.get(
  '/:userId',
  authenticateUser, // User authentication
  getAllUserDocuments // Controller
);

/**
 * @route   PUT /api/documents/:userId/:documentType
 * @desc    Replace an existing document for a user
 * @access  Private (User must be authenticated and match userId)
 * @file    document (multipart/form-data)
 */
router.put(
  '/:userId/:documentType',
  documentUploadLimiter, // Rate limiting for uploads
  authenticateUser, // User authentication
  uploadSingleFile, // Multer file upload
  handleMulterError, // Handle multer errors
  validateUploadedFiles, // Validate uploaded files
  scanForMalware, // Malware scanning
  replaceUserDocument // Controller
);

/**
 * @route   DELETE /api/documents/:userId/:documentType
 * @desc    Delete a document for a user
 * @access  Private (User must be authenticated and match userId)
 */
router.delete(
  '/:userId/:documentType',
  authenticateUser, // User authentication
  deleteUserDocument // Controller
);

export default router;
