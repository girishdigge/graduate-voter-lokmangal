# Document Upload Frontend Integration Guide

## 🚨 Issue Resolution

**Problem**: Getting "MISSING_DOCUMENT_TYPE" error during upload

**Root Cause**: The `documentType` parameter was not being sent as a form field

**Solution**: Always include `documentType` as a form field in multipart/form-data requests

## ✅ Correct Implementation

### 1. **Frontend JavaScript (Vanilla)**

```javascript
async function uploadDocument(
  userId,
  documentType,
  file,
  authToken,
  csrfToken
) {
  try {
    // Create FormData object
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType); // CRITICAL: Must include this!

    // Make the request
    const response = await fetch(`/api/documents/${userId}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-CSRF-Token': csrfToken,
        // DO NOT set Content-Type - let browser handle it with boundary
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Upload successful:', result);
      return result;
    } else {
      console.error('Upload failed:', result);
      throw new Error(result.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Usage example
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

if (file) {
  try {
    const result = await uploadDocument(
      'user-123', // userId
      'PHOTO', // documentType
      file, // file object
      'your-jwt-token', // authToken
      'your-csrf-token' // csrfToken
    );

    alert('Upload successful!');
  } catch (error) {
    alert('Upload failed: ' + error.message);
  }
}
```

### 2. **React Implementation**

```jsx
import React, { useState } from 'react';

const DocumentUpload = ({ userId, authToken, csrfToken }) => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('PHOTO');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileChange = e => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async e => {
    e.preventDefault();

    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType); // CRITICAL!

      const response = await fetch(`/api/documents/${userId}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-CSRF-Token': csrfToken,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({ success: true, data: result });
        setFile(null); // Reset file input
      } else {
        setUploadResult({ success: false, error: result.error });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: { message: error.message },
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload">
      <h3>Upload Document</h3>

      <form onSubmit={handleUpload}>
        <div>
          <label>Document Type:</label>
          <select
            value={documentType}
            onChange={e => setDocumentType(e.target.value)}
          >
            <option value="PHOTO">Photo</option>
            <option value="AADHAR">Aadhar Card</option>
            <option value="DEGREE_CERTIFICATE">Degree Certificate</option>
          </select>
        </div>

        <div>
          <label>File:</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        <button type="submit" disabled={!file || uploading}>
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>

      {uploadResult && (
        <div className={`result ${uploadResult.success ? 'success' : 'error'}`}>
          {uploadResult.success ? (
            <div>
              <p>✅ Upload successful!</p>
              <p>Document ID: {uploadResult.data.document.id}</p>
              <p>File: {uploadResult.data.document.fileName}</p>
            </div>
          ) : (
            <div>
              <p>❌ Upload failed!</p>
              <p>Error: {uploadResult.error.message}</p>
              <p>Code: {uploadResult.error.code}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
```

### 3. **Multiple Document Upload**

```javascript
async function uploadMultipleDocuments(userId, files, authToken, csrfToken) {
  try {
    const formData = new FormData();

    // Add files with specific field names
    if (files.aadhar) formData.append('aadhar', files.aadhar);
    if (files.degree) formData.append('degree', files.degree);
    if (files.photo) formData.append('photo', files.photo);

    const response = await fetch(`/api/documents/${userId}/upload-multiple`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-CSRF-Token': csrfToken,
      },
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error;
  }
}

// Usage
const files = {
  aadhar: document.getElementById('aadharFile').files[0],
  degree: document.getElementById('degreeFile').files[0],
  photo: document.getElementById('photoFile').files[0],
};

const result = await uploadMultipleDocuments(
  userId,
  files,
  authToken,
  csrfToken
);
```

## 🔧 Authentication Setup

Since your API requires authentication, you need to:

### 1. **Get JWT Token** (User Login)

```javascript
async function loginUser(credentials) {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const result = await response.json();

  if (response.ok) {
    // Store token for future requests
    localStorage.setItem('authToken', result.token);
    return result.token;
  } else {
    throw new Error(result.error?.message || 'Login failed');
  }
}
```

### 2. **Get CSRF Token**

```javascript
async function getCSRFToken() {
  const response = await fetch('/api/health'); // This endpoint sets CSRF token
  const csrfToken = getCookie('csrf-token'); // Extract from cookie
  return csrfToken;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
```

## 🚨 Common Mistakes to Avoid

### ❌ **Wrong: Missing documentType**

```javascript
// This will cause "MISSING_DOCUMENT_TYPE" error
const formData = new FormData();
formData.append('document', file);
// Missing: formData.append('documentType', 'PHOTO');
```

### ❌ **Wrong: Setting Content-Type header**

```javascript
// This will break multipart/form-data
fetch('/api/documents/user/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data', // DON'T DO THIS!
  },
  body: formData,
});
```

### ❌ **Wrong: Missing authentication**

```javascript
// This will cause "MISSING_AUTH_HEADER" error
fetch('/api/documents/user/upload', {
  method: 'POST',
  // Missing: Authorization header
  body: formData,
});
```

### ✅ **Correct: Complete implementation**

```javascript
const formData = new FormData();
formData.append('document', file);
formData.append('documentType', documentType); // ✅ Include this

fetch('/api/documents/user/upload', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`, // ✅ Include auth
    'X-CSRF-Token': csrfToken, // ✅ Include CSRF
    // ✅ Don't set Content-Type - let browser handle it
  },
  body: formData,
});
```

## 📋 Valid Values

### Document Types

- `AADHAR` - Aadhar card documents
- `DEGREE_CERTIFICATE` - Educational certificates
- `PHOTO` - Profile photos

### File Types

- `image/jpeg` - .jpg, .jpeg files
- `image/png` - .png files
- `application/pdf` - .pdf files

### File Size Limit

- Maximum: 2MB per file
- Configurable via `MAX_FILE_SIZE_MB` environment variable

## 🧪 Testing with curl

```bash
# Test single document upload
curl -X POST "http://localhost:3000/api/documents/USER_ID/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -F "document=@/path/to/your/file.jpg" \
  -F "documentType=PHOTO"

# Test multiple document upload
curl -X POST "http://localhost:3000/api/documents/USER_ID/upload-multiple" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -F "photo=@/path/to/photo.jpg" \
  -F "aadhar=@/path/to/aadhar.pdf" \
  -F "degree=@/path/to/degree.pdf"
```

## 🔍 Debugging Tips

1. **Check Network Tab**: Verify that `documentType` is included in form data
2. **Check Authentication**: Ensure JWT token is valid and not expired
3. **Check File Size**: Ensure file is under 2MB limit
4. **Check File Type**: Ensure file type is supported (JPEG, PNG, PDF)
5. **Check User ID**: Ensure the user exists in the database

## 📱 Complete Working Example

Here's a complete HTML page that demonstrates the correct implementation:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Document Upload Test</title>
  </head>
  <body>
    <h1>Document Upload Test</h1>

    <form id="uploadForm">
      <div>
        <label>User ID:</label>
        <input type="text" id="userId" value="test-user-123" required />
      </div>

      <div>
        <label>Document Type:</label>
        <select id="documentType" required>
          <option value="PHOTO">Photo</option>
          <option value="AADHAR">Aadhar Card</option>
          <option value="DEGREE_CERTIFICATE">Degree Certificate</option>
        </select>
      </div>

      <div>
        <label>File:</label>
        <input
          type="file"
          id="fileInput"
          accept=".jpg,.jpeg,.png,.pdf"
          required
        />
      </div>

      <div>
        <label>Auth Token:</label>
        <input type="text" id="authToken" placeholder="JWT token" required />
      </div>

      <button type="submit">Upload Document</button>
    </form>

    <div id="result"></div>

    <script>
      document
        .getElementById('uploadForm')
        .addEventListener('submit', async e => {
          e.preventDefault();

          const userId = document.getElementById('userId').value;
          const documentType = document.getElementById('documentType').value;
          const file = document.getElementById('fileInput').files[0];
          const authToken = document.getElementById('authToken').value;

          if (!file) {
            alert('Please select a file');
            return;
          }

          const formData = new FormData();
          formData.append('document', file);
          formData.append('documentType', documentType); // CRITICAL!

          try {
            const response = await fetch(`/api/documents/${userId}/upload`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
              body: formData,
            });

            const result = await response.json();

            document.getElementById('result').innerHTML = `
                    <h3>Result:</h3>
                    <pre>${JSON.stringify(result, null, 2)}</pre>
                `;

            if (response.ok) {
              alert('Upload successful!');
            } else {
              alert('Upload failed: ' + result.error?.message);
            }
          } catch (error) {
            alert('Error: ' + error.message);
          }
        });
    </script>
  </body>
</html>
```

This guide should resolve your "MISSING_DOCUMENT_TYPE" error and help you implement document uploads correctly in your frontend!
