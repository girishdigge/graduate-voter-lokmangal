#!/usr/bin/env node

/**
 * Debug script to test multer behavior with form fields
 */

import express from 'express';
import multer from 'multer';

const app = express();

// Test multer.single() behavior
const upload = multer({ storage: multer.memoryStorage() });

app.post('/test-single', upload.single('document'), (req, res) => {
  console.log('=== multer.single() test ===');
  console.log('req.file:', req.file ? 'Present' : 'Missing');
  console.log('req.body:', req.body);
  console.log('req.body.documentType:', req.body.documentType);

  res.json({
    hasFile: !!req.file,
    body: req.body,
    documentType: req.body.documentType,
  });
});

// Test multer.fields() behavior
app.post(
  '/test-fields',
  upload.fields([{ name: 'document', maxCount: 1 }]),
  (req, res) => {
    console.log('=== multer.fields() test ===');
    console.log('req.files:', req.files ? 'Present' : 'Missing');
    console.log('req.body:', req.body);
    console.log('req.body.documentType:', req.body.documentType);

    res.json({
      hasFiles: !!req.files,
      body: req.body,
      documentType: req.body.documentType,
    });
  }
);

// Test multer.any() behavior
app.post('/test-any', upload.any(), (req, res) => {
  console.log('=== multer.any() test ===');
  console.log('req.files:', req.files ? 'Present' : 'Missing');
  console.log('req.body:', req.body);
  console.log('req.body.documentType:', req.body.documentType);

  res.json({
    hasFiles: !!req.files,
    body: req.body,
    documentType: req.body.documentType,
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log('- POST /test-single');
  console.log('- POST /test-fields');
  console.log('- POST /test-any');
  console.log('');
  console.log('Test with curl:');
  console.log(
    `curl -X POST "http://localhost:${PORT}/test-single" -F "document=@./test-files/sample-photo.jpg" -F "documentType=PHOTO"`
  );
  console.log(
    `curl -X POST "http://localhost:${PORT}/test-fields" -F "document=@./test-files/sample-photo.jpg" -F "documentType=PHOTO"`
  );
  console.log(
    `curl -X POST "http://localhost:${PORT}/test-any" -F "document=@./test-files/sample-photo.jpg" -F "documentType=PHOTO"`
  );
});
