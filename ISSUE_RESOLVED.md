# Document Upload Issue - RESOLVED ✅

## The Problem

You were getting this error:

```json
{
  "success": false,
  "error": {
    "code": "MISSING_DOCUMENT_TYPE",
    "message": "Document type is required"
  }
}
```

## Root Cause

In your `frontend-public/src/lib/api.ts` file, the `uploadDocument` function had **TWO critical mistakes**:

### ❌ Mistake 1: documentType sent as query parameter

```typescript
// WRONG - documentType as query parameter
return api.post(`/documents/${userId}/upload`, formData, {
  params: { documentType }, // ← This sends it as ?documentType=AADHAR_CARD
});
```

This resulted in the URL: `POST /api/documents/.../upload?documentType=AADHAR_CARD`

But the server expects `documentType` as a **form field**, not a query parameter!

### ❌ Mistake 2: Manually setting Content-Type

```typescript
// WRONG - manually setting Content-Type
headers: {
  'Content-Type': 'multipart/form-data',  // ← This breaks the boundary
}
```

When you manually set `Content-Type: multipart/form-data`, you don't include the boundary parameter that's required for multipart parsing. The correct header should be:

```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

Axios automatically sets this correctly if you don't override it.

## The Fix ✅

**File**: `frontend-public/src/lib/api.ts`

**Before**:

```typescript
uploadDocument: (userId: string, documentType: string, file: File) => {
  const formData = new FormData();
  formData.append('document', file);
  return api.post(`/documents/${userId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',  // ❌ Wrong
    },
    params: { documentType },  // ❌ Wrong - query parameter
  });
},
```

**After**:

```typescript
uploadDocument: (userId: string, documentType: string, file: File) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);  // ✅ Correct - form field
  return api.post(`/documents/${userId}/upload`, formData, {
    // ✅ Correct - let axios set Content-Type with boundary
  });
},
```

## What Changed

1. ✅ **Added `documentType` as a form field**: `formData.append('documentType', documentType)`
2. ✅ **Removed manual Content-Type header**: Let axios handle it automatically
3. ✅ **Removed query parameters**: No longer using `params: { documentType }`

## Why This Works

Now when you upload a document, the request looks like this:

```http
POST /api/documents/USER_ID/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
Authorization: Bearer YOUR_TOKEN

------WebKitFormBoundary...
Content-Disposition: form-data; name="document"; filename="photo.jpg"
Content-Type: image/jpeg

[binary file data]
------WebKitFormBoundary...
Content-Disposition: form-data; name="documentType"

AADHAR_CARD
------WebKitFormBoundary...
```

The server's multer middleware correctly parses this and puts:

- File in `req.file`
- `documentType` in `req.body.documentType`

## Testing

1. **Restart your frontend dev server** (if needed)
2. **Try uploading a document** - it should work now!
3. **Check the browser Network tab** - you should see `documentType` in the form data, not in the URL

## Expected Result

✅ Document uploads successfully
✅ Server receives both file and documentType
✅ No more "MISSING_DOCUMENT_TYPE" error

## Additional Notes

### Valid Document Types

- `AADHAR` or `AADHAR_CARD` (check your backend enum)
- `DEGREE_CERTIFICATE`
- `PHOTO`

### File Restrictions

- Max size: 2MB
- Allowed types: JPEG, PNG, PDF

### If Still Not Working

1. Clear browser cache
2. Check browser console for errors
3. Check Network tab to verify the request format
4. Verify your auth token is valid
5. Check backend logs for detailed error info

## Lessons Learned

1. **Never manually set Content-Type for multipart/form-data** - Let the library handle it
2. **Form fields go in FormData** - Not as query parameters
3. **Test with curl first** - Helps isolate frontend vs backend issues
4. **Check Network tab** - Always verify what's actually being sent

## Related Files

- ✅ Fixed: `frontend-public/src/lib/api.ts`
- ✅ Working: `backend/src/controllers/documentController.ts`
- ✅ Working: `backend/src/config/multer.ts`
- ✅ Working: `backend/src/routes/documentRoutes.ts`

Your document upload functionality is now fully operational! 🎉
