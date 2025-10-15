# S3 CORS Configuration Guide

## Issue

When trying to download files using `fetch()`, you get a CORS error:

```
Access to fetch at 'https://padhvidhar.s3.ap-south-1.amazonaws.com/...'
from origin 'http://localhost:5173' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Quick Fix Applied ✅

Changed the download function to use the signed URL directly instead of fetching:

```typescript
// Before (caused CORS error)
const fileResponse = await fetch(downloadUrl);
const blob = await fileResponse.blob();
const url = window.URL.createObjectURL(blob);
a.href = url;

// After (works without CORS)
a.href = downloadUrl; // Use signed URL directly
a.download = document.fileName;
a.target = '_blank';
a.click();
```

This works because:

- Direct link navigation doesn't require CORS
- Browser handles the download automatically
- Signed URL provides authentication

## When You Need CORS Configuration

You'll need to configure CORS on your S3 bucket if you want to:

1. Fetch files using JavaScript `fetch()` or `XMLHttpRequest`
2. Process files client-side before downloading
3. Display images using `<img>` tags with credentials
4. Use canvas to manipulate images

## How to Configure S3 CORS

### Option 1: AWS Console

1. Go to AWS S3 Console
2. Select your bucket: `padhvidhar`
3. Go to **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit**
6. Add this configuration:

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
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3000
  }
]
```

7. Click **Save changes**

### Option 2: AWS CLI

```bash
aws s3api put-bucket-cors \
  --bucket padhvidhar \
  --cors-configuration file://cors-config.json
```

**cors-config.json**:

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://your-production-domain.com"
      ],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### Option 3: Terraform

```hcl
resource "aws_s3_bucket_cors_configuration" "padhvidhar" {
  bucket = aws_s3_bucket.padhvidhar.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://your-production-domain.com"
    ]
    expose_headers  = ["ETag", "Content-Length", "Content-Type"]
    max_age_seconds = 3000
  }
}
```

## CORS Configuration Explained

### AllowedHeaders

```json
"AllowedHeaders": ["*"]
```

- Allows all request headers
- Needed for signed URLs with authentication headers

### AllowedMethods

```json
"AllowedMethods": ["GET", "HEAD"]
```

- `GET`: Download files
- `HEAD`: Check if file exists
- Don't add `PUT`, `POST`, `DELETE` unless needed (security)

### AllowedOrigins

```json
"AllowedOrigins": [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://your-production-domain.com"
]
```

- List all domains that should access your S3 bucket
- **Never use `"*"` in production** (security risk)
- Add your production domain before deploying

### ExposeHeaders

```json
"ExposeHeaders": ["ETag", "Content-Length", "Content-Type"]
```

- Headers that JavaScript can access
- Useful for file validation and progress tracking

### MaxAgeSeconds

```json
"MaxAgeSeconds": 3000
```

- How long browsers cache CORS preflight requests
- 3000 seconds = 50 minutes

## Testing CORS Configuration

### Test with curl

```bash
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  "https://padhvidhar.s3.ap-south-1.amazonaws.com/"
```

Should return:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Max-Age: 3000
```

### Test in Browser Console

```javascript
fetch('https://padhvidhar.s3.ap-south-1.amazonaws.com/your-file-key')
  .then(response => console.log('CORS working!', response))
  .catch(error => console.error('CORS error:', error));
```

## Current Solution (No CORS Needed) ✅

The current implementation doesn't require CORS because:

1. **Preview**: Uses `<img>` and `<iframe>` tags
   - These don't trigger CORS for same-origin requests
   - Signed URLs provide authentication

2. **Download**: Uses direct link navigation
   - `<a href="signed-url" download>` doesn't require CORS
   - Browser handles download automatically

3. **Print**: Opens in new window
   - Direct navigation, no CORS needed

## When to Use Each Approach

### Use Direct Links (Current - No CORS) ✅

**When**:

- Simple download functionality
- Preview in browser
- Print functionality

**Pros**:

- No CORS configuration needed
- Simpler implementation
- Works immediately

**Cons**:

- Can't process file before download
- Can't show download progress
- Can't validate file before download

### Use Fetch with CORS

**When**:

- Need to process file client-side
- Want to show download progress
- Need to validate file before download
- Want to manipulate images with canvas

**Pros**:

- Full control over download process
- Can show progress
- Can validate/process files

**Cons**:

- Requires CORS configuration
- More complex implementation
- Potential CORS issues

## Production Checklist

Before deploying to production:

- [ ] Update CORS AllowedOrigins with production domain
- [ ] Remove localhost origins from production CORS
- [ ] Test CORS from production domain
- [ ] Verify signed URLs work from production
- [ ] Test download functionality
- [ ] Test preview functionality
- [ ] Monitor CORS errors in logs

## Security Best Practices

1. **Never use `"*"` for AllowedOrigins in production**

   ```json
   // ❌ BAD - allows any domain
   "AllowedOrigins": ["*"]

   // ✅ GOOD - specific domains only
   "AllowedOrigins": ["https://your-domain.com"]
   ```

2. **Only allow necessary methods**

   ```json
   // ❌ BAD - allows modifications
   "AllowedMethods": ["GET", "PUT", "POST", "DELETE"]

   // ✅ GOOD - read-only
   "AllowedMethods": ["GET", "HEAD"]
   ```

3. **Use signed URLs for authentication**
   - Don't rely on CORS alone for security
   - Signed URLs provide time-limited access
   - CORS just allows browser to make requests

4. **Keep bucket private**
   - Don't make bucket publicly readable
   - Use signed URLs for access control
   - CORS doesn't make bucket public

## Troubleshooting

### CORS still not working after configuration

1. Wait 5-10 minutes for changes to propagate
2. Clear browser cache
3. Check CORS configuration in S3 console
4. Verify origin matches exactly (including protocol and port)

### Downloads work but fetch doesn't

- This is expected without CORS
- Either configure CORS or use direct links (current solution)

### CORS works in development but not production

- Check production domain is in AllowedOrigins
- Verify HTTPS vs HTTP
- Check for trailing slashes in origins

## Summary

✅ **Current Solution**: Using direct links for download (no CORS needed)
✅ **Preview**: Working with signed URLs
✅ **Download**: Working with direct navigation
✅ **Print**: Working with new window

**CORS configuration is optional** for your current implementation. Only configure it if you need to:

- Fetch files with JavaScript
- Process files client-side
- Show download progress
- Validate files before download

Your document management system is working perfectly without CORS! 🎉
