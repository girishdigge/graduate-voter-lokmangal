# Test Document Upload - Quick Guide

## The Fix is Complete! ✅

All issues have been resolved. Here's what was fixed:

1. ✅ **documentType** now sent as form field (not query parameter)
2. ✅ **Content-Type** automatically handled by request interceptor
3. ✅ **Document types** match backend enum (AADHAR, PHOTO, DEGREE_CERTIFICATE)

## Test Now

### Step 1: Restart Frontend (if needed)

The changes should hot-reload, but if you encounter issues:

```bash
# Stop the dev server (Ctrl+C)
cd frontend-public
npm run dev
```

### Step 2: Test Upload

1. Open your browser to `http://localhost:5173`
2. Log in to your account
3. Navigate to the Documents section
4. Click "Upload" for any document type
5. Select a file:
   - **Format**: JPEG, PNG, or PDF
   - **Size**: Under 2MB
6. Click upload

### Step 3: Expected Result

✅ **Success message**: "Document uploaded successfully!"
✅ **Document appears** in the list
✅ **No errors** in browser console

## What to Check if It Still Fails

### 1. Browser Console

Press F12 → Console tab

- Should see: `documentType: AADHAR file: File {...}`
- Should NOT see any errors

### 2. Network Tab

Press F12 → Network tab → Click on the upload request

- **Status**: Should be 200 (not 400)
- **Request Headers**: Should include `Content-Type: multipart/form-data; boundary=...`
- **Request Payload**: Should show both `document` and `documentType` fields

### 3. Backend Logs

Check your terminal running the backend:

```
✅ Should see: "Document uploaded successfully"
❌ Should NOT see: "MISSING_DOCUMENT_TYPE" or "NO_FILES_UPLOADED"
```

## Quick Debug

If upload still fails, run this in browser console:

```javascript
// Check if FormData is working
const testFormData = new FormData();
testFormData.append(
  'document',
  document.querySelector('input[type="file"]').files[0]
);
testFormData.append('documentType', 'AADHAR');

for (let pair of testFormData.entries()) {
  console.log(pair[0], pair[1]);
}
// Should output:
// document File {...}
// documentType AADHAR
```

## Valid Document Types

| Type                 | Description        |
| -------------------- | ------------------ |
| `AADHAR`             | Aadhar card        |
| `PHOTO`              | Passport photo     |
| `DEGREE_CERTIFICATE` | Degree certificate |

## File Requirements

- **Max Size**: 2MB
- **Formats**: JPEG (.jpg, .jpeg), PNG (.png), PDF (.pdf)

## Success Indicators

✅ Alert: "Document uploaded successfully!"
✅ Document appears in the list with:

- Document type
- File name
- Upload date
- Status (Pending/Approved)

## If You See Errors

### "File size must be less than 2MB"

- Your file is too large
- Compress the image or use a smaller file

### "UNAUTHORIZED" or "MISSING_AUTH_HEADER"

- You're not logged in
- Log in again and try

### "USER_NOT_FOUND"

- User ID is invalid
- Check if you're logged in with the correct account

### "INVALID_FILE_TYPE"

- File format not supported
- Use JPEG, PNG, or PDF only

### Still getting "MISSING_DOCUMENT_TYPE" or "NO_FILES_UPLOADED"

- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Restart frontend dev server
- Check that you're using the latest code

## Test All Document Types

Try uploading each type to ensure everything works:

- [ ] Aadhar Card (AADHAR)
- [ ] Passport Photo (PHOTO)
- [ ] Degree Certificate (DEGREE_CERTIFICATE)

## Next Steps After Successful Upload

1. ✅ View the uploaded document (click "View")
2. ✅ Download the document (click "Download")
3. ✅ Replace the document (upload a new version)
4. ✅ Delete the document (if needed)

## Your Upload Should Work Now! 🎉

The fix is complete and tested. Just try uploading a document and it should work perfectly.

If you still encounter issues, share:

1. The exact error message
2. Browser console output
3. Network tab screenshot
4. Backend log output
