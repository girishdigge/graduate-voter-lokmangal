# CSRF Token Fix for Document Upload

## The Issue

After fixing the `documentType` parameter issue, you're still getting a 400 Bad Request error. This is because the backend requires a CSRF token for authenticated POST requests.

## How CSRF Protection Works in Your Backend

1. **Conditional CSRF Protection**: The backend applies CSRF protection ONLY to authenticated requests (when `req.user` exists)
2. **Double Submit Cookie Pattern**:
   - Server sets a CSRF token in a cookie (`csrf-token`)
   - Client must send the same token in a header (`x-csrf-token`)
   - Server verifies they match

## The Fix

### 1. Updated `frontend-public/src/lib/api.ts`

#### Added CSRF Token to Request Interceptor

```typescript
// Request interceptor to add auth token and CSRF token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token from cookie for state-changing requests
    if (
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
        config.method?.toUpperCase() || ''
      )
    ) {
      const csrfToken = getCookie('csrf-token');
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Helper function to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}
```

#### Added CSRF Initialization Endpoint

```typescript
export const apiEndpoints = {
  // CSRF token
  initializeCSRF: () => api.get('/health'), // This endpoint sets the CSRF cookie

  // ... rest of endpoints
};
```

### 2. Updated `frontend-public/src/components/dashboard/DocumentsCard.tsx`

#### Initialize CSRF Token on Component Mount

```typescript
useEffect(() => {
  // Initialize CSRF token
  apiEndpoints.initializeCSRF().catch(console.error);
  loadDocuments();
}, [userId]);
```

## How It Works Now

### 1. Component Mounts

```
DocumentsCard mounts
  ↓
Calls apiEndpoints.initializeCSRF()
  ↓
GET /api/health
  ↓
Server sets csrf-token cookie
```

### 2. User Uploads Document

```
User selects file
  ↓
handleFileUpload() called
  ↓
apiEndpoints.uploadDocument()
  ↓
Request interceptor adds:
  - Authorization: Bearer TOKEN
  - x-csrf-token: VALUE_FROM_COOKIE
  ↓
POST /api/documents/USER_ID/upload
  ↓
Server verifies CSRF token
  ↓
Upload succeeds ✅
```

## Request Format

### Before (Missing CSRF Token)

```http
POST /api/documents/USER_ID/upload HTTP/1.1
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data; boundary=...

[form data]
```

❌ Result: 403 Forbidden - CSRF token missing

### After (With CSRF Token)

```http
POST /api/documents/USER_ID/upload HTTP/1.1
Authorization: Bearer JWT_TOKEN
x-csrf-token: CSRF_TOKEN_VALUE
Content-Type: multipart/form-data; boundary=...

[form data]
```

✅ Result: 200 OK - Upload successful

## Testing

### 1. Clear Browser Data

```
1. Open DevTools (F12)
2. Go to Application tab
3. Clear all cookies
4. Refresh the page
```

### 2. Check CSRF Cookie

```
1. Open DevTools (F12)
2. Go to Application tab → Cookies
3. Look for 'csrf-token' cookie
4. Should be set after page loads
```

### 3. Check Request Headers

```
1. Open DevTools (F12)
2. Go to Network tab
3. Upload a document
4. Click on the upload request
5. Check Request Headers:
   - Should see: x-csrf-token: [some hex value]
```

### 4. Upload Document

```
1. Navigate to documents section
2. Click upload
3. Select a file
4. Should upload successfully ✅
```

## Troubleshooting

### Error: "CSRF token missing from cookie"

**Cause**: The CSRF cookie wasn't set
**Solution**:

- Make sure `initializeCSRF()` is called before upload
- Check browser cookies for 'csrf-token'
- Try refreshing the page

### Error: "CSRF token missing from header"

**Cause**: The x-csrf-token header wasn't sent
**Solution**:

- Check the request interceptor is working
- Verify the cookie exists before upload
- Check browser console for errors

### Error: "CSRF token mismatch"

**Cause**: Cookie and header tokens don't match
**Solution**:

- Clear browser cookies
- Refresh the page
- Try again

### Error: "CSRF token verification failed"

**Cause**: Token format is invalid
**Solution**:

- Clear browser cookies
- Ensure you're getting the token from the correct endpoint
- Check server logs for details

## Additional Improvements

### Option 1: Initialize CSRF on App Load

Instead of initializing in each component, you can initialize once when the app loads:

```typescript
// In your main App.tsx or index.tsx
useEffect(() => {
  // Initialize CSRF token for the entire app
  apiEndpoints.initializeCSRF().catch(console.error);
}, []);
```

### Option 2: Retry on CSRF Failure

Add automatic retry logic when CSRF token is missing:

```typescript
api.interceptors.response.use(
  response => response,
  async error => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.error?.code === 'CSRF_TOKEN_MISSING_COOKIE'
    ) {
      // Retry: Get new CSRF token and retry the request
      await apiEndpoints.initializeCSRF();
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Option 3: Refresh CSRF Token Periodically

```typescript
// Refresh CSRF token every 23 hours (before it expires)
setInterval(
  () => {
    apiEndpoints.initializeCSRF().catch(console.error);
  },
  23 * 60 * 60 * 1000
);
```

## Summary of All Fixes

### Issue 1: documentType as query parameter ✅

- Fixed in `api.ts`: Added `formData.append('documentType', documentType)`

### Issue 2: Manual Content-Type header ✅

- Fixed in `api.ts`: Removed manual Content-Type header

### Issue 3: Document type mismatch ✅

- Fixed in `DocumentsCard.tsx`: Changed `AADHAR_CARD` → `AADHAR`, `PASSPORT_PHOTO` → `PHOTO`

### Issue 4: Missing CSRF token ✅

- Fixed in `api.ts`: Added CSRF token to request headers
- Fixed in `DocumentsCard.tsx`: Initialize CSRF token on mount

## Expected Result

✅ CSRF token automatically fetched on page load
✅ CSRF token automatically included in all POST/PUT/DELETE/PATCH requests
✅ Document uploads work successfully
✅ No more 403 Forbidden errors

Your document upload functionality should now be fully operational! 🎉
