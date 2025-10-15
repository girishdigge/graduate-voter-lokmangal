#!/usr/bin/env node

/**
 * Debug script to test document upload and see exactly what's being received
 */

import express from 'express';
import multer from 'multer';
import cors from 'cors';

const app = express();
const PORT = 3001; // Different port to avoid conflicts

// Enable CORS
app.use(cors());

// Create multer instance for debugging
const debugUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

// Debug middleware to log everything
const debugMiddleware = (req, res, next) => {
  console.log('\n🔍 DEBUG: Request received');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  next();
};

// Test endpoint with single file upload
app.post(
  '/test-single',
  debugMiddleware,
  debugUpload.single('document'),
  (req, res) => {
    console.log('\n📋 SINGLE FILE UPLOAD DEBUG:');
    console.log('req.body:', req.body);
    console.log(
      'req.file:',
      req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : 'NO FILE'
    );
    console.log('req.files:', req.files);

    res.json({
      success: true,
      body: req.body,
      file: req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
      files: req.files,
    });
  }
);

// Test endpoint with fields upload (like your current setup)
app.post(
  '/test-fields',
  debugMiddleware,
  debugUpload.fields([{ name: 'document', maxCount: 1 }]),
  (req, res) => {
    console.log('\n📋 FIELDS UPLOAD DEBUG:');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('req.files:', req.files);

    if (req.files && req.files.document) {
      console.log('Document file:', {
        fieldname: req.files.document[0].fieldname,
        originalname: req.files.document[0].originalname,
        mimetype: req.files.document[0].mimetype,
        size: req.files.document[0].size,
      });
    }

    res.json({
      success: true,
      body: req.body,
      file: req.file,
      files: req.files,
      documentType: req.body.documentType,
      hasDocumentType: !!req.body.documentType,
    });
  }
);

// Test endpoint with any field name
app.post('/test-any', debugMiddleware, debugUpload.any(), (req, res) => {
  console.log('\n📋 ANY UPLOAD DEBUG:');
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);

  res.json({
    success: true,
    body: req.body,
    files: req.files,
    documentType: req.body.documentType,
    hasDocumentType: !!req.body.documentType,
  });
});

app.listen(PORT, () => {
  console.log(`🔍 Debug server running on port ${PORT}`);
  console.log('\nTest endpoints:');
  console.log(`- POST http://localhost:${PORT}/test-single`);
  console.log(`- POST http://localhost:${PORT}/test-fields`);
  console.log(`- POST http://localhost:${PORT}/test-any`);
  console.log('\nTest with curl:');
  console.log(`curl -X POST "http://localhost:${PORT}/test-single" \\`);
  console.log('  -F "document=@./test-files/sample-photo.jpg" \\');
  console.log('  -F "documentType=PHOTO"');
  console.log('\nOr test all endpoints:');
  console.log('node test-debug-upload.js');
});
