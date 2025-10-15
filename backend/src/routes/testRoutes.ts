import { Router, Request, Response, NextFunction } from 'express';
import {
  uploadUserDocument,
  getUserDocument,
  getAllUserDocuments,
} from '../controllers/documentController.js';
import {
  uploadSingleFile,
  handleMulterError,
  validateUploadedFiles,
} from '../config/multer.js';
import { generateUserToken } from '../utils/jwt.js';

const router = Router();

/**
 * Test routes for document upload without authentication
 * These should only be used for testing and removed in production
 */

/**
 * Generate a test JWT token for testing purposes
 */
router.get('/generate-test-token/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const token = generateUserToken(userId);

    res.json({
      success: true,
      data: {
        token,
        userId,
        expiresIn: '24h',
        usage: `Authorization: Bearer ${token}`,
      },
      message: 'Test token generated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_GENERATION_FAILED',
        message: 'Failed to generate test token',
      },
    });
  }
});

/**
 * Test document upload without authentication (for testing only)
 */
router.post(
  '/upload-test/:userId',
  uploadSingleFile,
  handleMulterError,
  validateUploadedFiles,
  (req: Request, res: Response, next: NextFunction) => {
    // Mock authentication for testing
    (req as any).user = {
      userId: req.params.userId,
      type: 'user',
    };
    next();
  },
  uploadUserDocument
);

/**
 * Test document retrieval without authentication (for testing only)
 */
router.get(
  '/document-test/:userId/:documentType',
  (req: Request, res: Response, next: NextFunction) => {
    // Mock authentication for testing
    (req as any).user = {
      userId: req.params.userId,
      type: 'user',
    };
    next();
  },
  getUserDocument
);

/**
 * Test get all documents without authentication (for testing only)
 */
router.get(
  '/documents-test/:userId',
  (req: Request, res: Response, next: NextFunction) => {
    // Mock authentication for testing
    (req as any).user = {
      userId: req.params.userId,
      type: 'user',
    };
    next();
  },
  getAllUserDocuments
);

export default router;
