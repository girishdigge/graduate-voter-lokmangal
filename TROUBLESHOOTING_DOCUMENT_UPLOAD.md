# Troubleshooting Document Upload - MISSING_DOCUMENT_TYPE Error

## Problem

Getting error: `{"success": false,"error": {"code": "MISSING_DOCUMENT_TYPE","message": "Document type is required"}}`

## Diagnostic Steps

### Step 1: Test with Debug Endpoint

I've added a debug endpoint to help diagnose the issue. Run this test:

```bash
chmod +x backend/test-debug-upload.sh
./backend/test-debug-upload.sh
```

This will show you exactly what the server is receiving in `req.body`.

### Step 2: Check What Your Frontend is Sending

The most common causes:

#### ❌ **Cause 1: Field name mismatch**

```javascript
// WRONG - using wrong field name
formData.append('type', 'PHOTO'); // Should be 'documentType'

// CORRECT
formData.append('documentType', 'PHOTO');
```

#### ❌ **Cause 2: Sending as JSON instead of form field**

```javascript
// WRONG - trying to send as JSON
const data = {
  documentType: 'PHOTO',
  file: file,
};
fetch(url, {
  method: 'POST',
  body: JSON.stringify(data), // This won't work!
});

// CORRECT - using FormData
const formData = new FormData();
formData.append('document', file);
formData.append('documentType', 'PHOTO');
fetch(url, {
  method: 'POST',
  body: formData,
});
```

#### ❌ **Cause 3: Setting Content-Type header manually**

```javascript
// WRONG - manually setting Content-Type
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data', // Don't do this!
  },
  body: formData,
});

// CORRECT - let browser set it with boundary
fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`, // Only auth headers
  },
  body: formData, // Browser will set correct Content-Type
});
```

#### ❌ **Cause 4: Using axios with wrong config**

```javascript
// WRONG - axios without proper config
axios.post(url, formData);

// CORRECT - axios with proper headers
axios.post(url, formData, {
  headers: {
    Authorization: `Bearer ${token}`,
    // Don't set Content-Type - axios will handle it
  },
});
```

### Step 3: Verify with curl

Test with curl to confirm the server works correctly:

```bash
curl -X POST "http://localhost:3000/api/debug/test-upload" \
  -F "document=@/path/to/your/file.jpg" \
  -F "documentType=PHOTO"
```

If this works but your frontend doesn't, the issue is in your frontend code.

### Step 4: Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Make the upload request
4. Click on the request
5. Go to "Payload" or "Request" tab
6. Verify you see:

   ```
   ------WebKitFormBoundary...
   Content-Disposition: form-data; name="document"; filename="photo.jpg"
   Content-Type: image/jpeg

   [binary data]
   ------WebKitFormBoundary...
   Content-Disposition: form-data; name="documentType"

   PHOTO
   ------WebKitFormBoundary...
   ```

If you don't see the `documentType` field, your frontend is not sending it.

## Solutions by Framework

### Vanilla JavaScript

```javascript
const formData = new FormData();
formData.append('document', fileInput.files[0]);
formData.append('documentType', 'PHOTO');

fetch('/api/documents/USER_ID/upload', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### React

```jsx
const handleUpload = async (file, documentType) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);

  const response = await fetch(`/api/documents/${userId}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: formData,
  });

  return response.json();
};
```

### Axios

```javascript
const formData = new FormData();
formData.append('document', file);
formData.append('documentType', 'PHOTO');

axios.post(`/api/documents/${userId}/upload`, formData, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### jQuery

```javascript
var formData = new FormData();
formData.append('document', $('#fileInput')[0].files[0]);
formData.append('documentType', 'PHOTO');

$.ajax({
  url: '/api/documents/' + userId + '/upload',
  type: 'POST',
  data: formData,
  processData: false, // Important!
  contentType: false, // Important!
  headers: {
    Authorization: 'Bearer ' + token,
  },
  success: function (response) {
    console.log('Success:', response);
  },
});
```

## Common Frontend Mistakes

### 1. **React - Using controlled input incorrectly**

```jsx
// WRONG
const [file, setFile] = useState(null);
<input type="file" value={file} onChange={...} />  // Can't set value on file input

// CORRECT
const [file, setFile] = useState(null);
<input type="file" onChange={(e) => setFile(e.target.files[0])} />
```

### 2. **Not checking if file exists**

```javascript
// WRONG
formData.append('document', file); // file might be null/undefined

// CORRECT
if (file) {
  formData.append('document', file);
  formData.append('documentType', documentType);
} else {
  alert('Please select a file');
  return;
}
```

### 3. **Appending file object incorrectly**

```javascript
// WRONG
formData.append('document', file.name); // Sending filename, not file

// CORRECT
formData.append('document', file); // Send the actual File object
```

## Debugging Checklist

- [ ] Verify `documentType` is being appended to FormData
- [ ] Verify field name is exactly `documentType` (case-sensitive)
- [ ] Verify not setting Content-Type header manually
- [ ] Verify file is a valid File/Blob object
- [ ] Verify using FormData, not JSON
- [ ] Check browser Network tab shows both fields
- [ ] Test with curl to confirm server works
- [ ] Check server logs show `documentType` in `bodyKeys`

## Server-Side Verification

The server logs should show:

```
debug: Upload request debug info {
  userId: 'user-123',
  documentType: 'PHOTO',  // ← This should be present
  bodyKeys: ['documentType'],  // ← Should include 'documentType'
  body: { documentType: 'PHOTO' },
  hasFile: true,
  fileName: 'photo.jpg'
}
```

If `documentType` is missing from the logs, the frontend is not sending it correctly.

## Still Not Working?

1. **Share your exact frontend code** - The complete function that makes the upload request
2. **Share browser Network tab screenshot** - Showing the request payload
3. **Share server logs** - The debug output showing what was received
4. **Test with the debug endpoint** - Run `./backend/test-debug-upload.sh`

## Quick Test

Run this in your browser console on your upload page:

```javascript
// Test if FormData is working correctly
const testFormData = new FormData();
testFormData.append(
  'document',
  document.querySelector('input[type="file"]').files[0]
);
testFormData.append('documentType', 'PHOTO');

// Check what's in FormData
for (let pair of testFormData.entries()) {
  console.log(pair[0], pair[1]);
}
// Should output:
// document File {...}
// documentType PHOTO
```

If you don't see both entries, there's an issue with how you're creating the FormData.
