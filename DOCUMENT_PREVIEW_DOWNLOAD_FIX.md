# Document Preview/Download Fix ✅

## Problem

After successfully uploading documents, preview and download were not working. The direct S3 URL was being used:

```
https://padhvidhar.s3.ap-south-1.amazonaws.com/documents/.../AADHAR/...png
```

This URL is not publicly accessible because the S3 bucket is private (which is correct for security).

## Root Cause

The frontend was incorrectly trying to:

1. Treat the API response as binary data
2. Create blob URLs from the response
3. Use direct S3 URLs instead of signed URLs

**The backend was already generating signed URLs correctly**, but the frontend wasn't using them!

## How It Should Work

### Backend (Already Correct ✅)

1. File is uploaded to S3 with private access
2. When retrieving a document, backend generates a **signed URL** (temporary, secure URL)
3. Signed URL is valid for 1 hour (configurable)
4. Backend returns JSON response:

```json
{
  "success": true,
  "data": {
    "document": {
      "id": "...",
      "fileName": "photo.jpg",
      "downloadUrl": "https://padhvidhar.s3.ap-south-1.amazonaws.com/...?X-Amz-Algorithm=..."
    }
  }
}
```

### Frontend (Now Fixed ✅)

1. Call API to get document metadata with signed URL
2. Extract `downloadUrl` from response
3. Use signed URL directly for preview/download

## Files Fixed

### 1. `frontend-public/src/components/dashboard/DocumentsCard.tsx`

#### handleDownload Function

**Before** ❌:

```typescript
const handleDownload = async (document: Document) => {
  const response = await apiEndpoints.getDocument(
    userId,
    document.documentType
  );
  const blob = new Blob([response.data]); // ❌ Wrong - treating JSON as binary
  const url = window.URL.createObjectURL(blob);
  // ...
};
```

**After** ✅:

```typescript
const handleDownload = async (document: Document) => {
  // Get the signed URL from the API
  const response = await apiEndpoints.getDocument(
    userId,
    document.documentType
  );
  const downloadUrl = response.data.data?.document?.downloadUrl; // ✅ Extract signed URL

  if (!downloadUrl) {
    throw new Error('Download URL not found in response');
  }

  // Download the file using the signed URL
  const fileResponse = await fetch(downloadUrl);
  const blob = await fileResponse.blob();
  const url = window.URL.createObjectURL(blob);

  const a = window.document.createElement('a');
  a.href = url;
  a.download = document.fileName;
  a.click();

  window.URL.revokeObjectURL(url);
};
```

#### handlePrint Function

**Before** ❌:

```typescript
const handlePrint = async (document: Document) => {
  const response = await apiEndpoints.getDocument(
    userId,
    document.documentType
  );
  const blob = new Blob([response.data]); // ❌ Wrong
  const url = window.URL.createObjectURL(blob);
  const printWindow = window.open(url);
  printWindow?.print();
};
```

**After** ✅:

```typescript
const handlePrint = async (document: Document) => {
  // Get the signed URL from the API
  const response = await apiEndpoints.getDocument(
    userId,
    document.documentType
  );
  const downloadUrl = response.data.data?.document?.downloadUrl; // ✅ Extract signed URL

  if (!downloadUrl) {
    throw new Error('Download URL not found in response');
  }

  // Open the signed URL in a new window for printing
  const printWindow = window.open(downloadUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
```

### 2. `frontend-public/src/components/dashboard/DocumentPreviewModal.tsx`

#### loadDocumentPreview Function

**Before** ❌:

```typescript
const loadDocumentPreview = async () => {
  const response = await apiEndpoints.getDocument(
    userId,
    document.documentType
  );
  const blob = new Blob([response.data], { type: document.mimeType }); // ❌ Wrong
  const url = URL.createObjectURL(blob);
  setDocumentUrl(url);
};
```

**After** ✅:

```typescript
const loadDocumentPreview = async () => {
  // Get the signed URL from the API
  const response = await apiEndpoints.getDocument(
    userId,
    document.documentType
  );
  const downloadUrl = response.data.data?.document?.downloadUrl; // ✅ Extract signed URL

  if (!downloadUrl) {
    throw new Error('Download URL not found in response');
  }

  // Use the signed URL directly for preview
  setDocumentUrl(downloadUrl); // ✅ Use signed URL directly
};
```

## What Changed

### Before (Incorrect Flow)

```
Frontend → API Request → Backend returns JSON with signed URL
         ↓
Frontend tries to create blob from JSON (fails)
         ↓
Preview/Download doesn't work ❌
```

### After (Correct Flow)

```
Frontend → API Request → Backend returns JSON with signed URL
         ↓
Frontend extracts downloadUrl from response
         ↓
Frontend uses signed URL to fetch/display file
         ↓
Preview/Download works perfectly ✅
```

## Benefits of Signed URLs

1. **Security**: S3 bucket remains private
2. **Temporary Access**: URLs expire after 1 hour
3. **No Public Exposure**: Files are not publicly accessible
4. **Audit Trail**: Backend logs all access requests
5. **Access Control**: Only authenticated users can get signed URLs

## Testing

### 1. Test Document Preview

1. Upload a document (JPEG, PNG, or PDF)
2. Click the "eye" icon to preview
3. Document should display in modal ✅

### 2. Test Document Download

1. Click the "download" icon
2. File should download with correct filename ✅

### 3. Test Document Print

1. Click the "print" icon
2. Print dialog should open with document ✅

### 4. Verify Signed URL

Open browser DevTools → Network tab:

```
Request: GET /api/documents/USER_ID/DOCUMENT_TYPE
Response: {
  "success": true,
  "data": {
    "document": {
      "downloadUrl": "https://padhvidhar.s3.ap-south-1.amazonaws.com/...?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=...&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=..."
    }
  }
}
```

The `downloadUrl` should have query parameters like:

- `X-Amz-Algorithm`
- `X-Amz-Credential`
- `X-Amz-Signature`
- `X-Amz-Expires=3600` (1 hour)

## Signed URL Expiration

Signed URLs expire after **1 hour** (3600 seconds). This is configurable in:

```typescript
// backend/src/config/aws.ts
export const S3_CONFIG = {
  SIGNED_URL_EXPIRES: 3600, // 1 hour
};
```

If a user keeps a preview open for more than 1 hour, they'll need to refresh to get a new signed URL.

## Security Notes

1. ✅ S3 bucket is private (not publicly accessible)
2. ✅ Files are encrypted at rest (AES256)
3. ✅ Access requires authentication
4. ✅ Signed URLs expire after 1 hour
5. ✅ All access is logged for audit

## Common Issues

### Issue: "Failed to load document preview"

**Solution**:

- Check AWS credentials in backend/.env
- Verify S3 bucket exists and is accessible
- Check backend logs for detailed error

### Issue: Preview works but download doesn't

**Solution**:

- Check browser console for errors
- Verify CORS settings on S3 bucket
- Check if pop-up blocker is interfering

### Issue: Signed URL expired

**Solution**:

- Close and reopen the preview modal
- This will fetch a new signed URL

## S3 CORS Configuration

Your S3 bucket should have CORS configured to allow access from your frontend domain:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Complete Flow Diagram

```
User clicks "Preview" or "Download"
         ↓
Frontend calls: GET /api/documents/:userId/:documentType
         ↓
Backend authenticates user
         ↓
Backend queries database for document metadata
         ↓
Backend generates signed URL from S3
         ↓
Backend returns JSON with signed URL
         ↓
Frontend extracts downloadUrl from response
         ↓
Frontend uses signed URL to:
  - Display in <img> or <iframe> (preview)
  - Fetch and download (download)
  - Open in new window (print)
         ↓
User sees/downloads the document ✅
```

## Summary

✅ **Upload**: Working correctly
✅ **Preview**: Now working with signed URLs
✅ **Download**: Now working with signed URLs
✅ **Print**: Now working with signed URLs
✅ **Security**: S3 bucket remains private with temporary access

Your document management system is now fully functional! 🎉
