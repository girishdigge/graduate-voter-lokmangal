import { Router, Request, Response } from 'express';
import { uploadSingleFile } from '../config/multer.js';
import logger from '../config/logger.js';

const router = Router();

/**
 * Debug endpoint to test multipart form data parsing
 * This will help us see exactly what multer is receiving
 */
router.post('/test-upload', uploadSingleFile, (req: Request, res: Response) => {
  logger.info('Debug upload test', {
    body: req.body,
    bodyKeys: Object.keys(req.body || {}),
    bodyType: typeof req.body,
    file: req.file
      ? {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        }
      : null,
    headers: {
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
    },
    params: req.params,
    query: req.query,
  });

  res.json({
    success: true,
    debug: {
      receivedBody: req.body,
      bodyKeys: Object.keys(req.body || {}),
      hasFile: !!req.file,
      file: req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
      documentType: req.body?.documentType,
      hasDocumentType: !!req.body?.documentType,
    },
  });
});

export default router;
