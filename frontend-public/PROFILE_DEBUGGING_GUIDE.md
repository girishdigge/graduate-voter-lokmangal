# Profile View Details Debugging Guide

## Issue

Profile view details are not working in the dashboard.

## Debugging Steps

### 1. Check Browser Console

Open browser developer tools (F12) and check the Console tab for:

- API request logs
- Error messages
- Network failures

### 2. Check Network Tab

In browser developer tools, go to Network tab and:

- Look for the `/api/users/profile` request
- Check if it returns 200 OK or an error status
- Verify the response data structure

### 3. Check Authentication

Verify that:

- User token exists in localStorage: `localStorage.getItem('userToken')`
- Token is being sent in request headers
- Token is valid and not expired

### 4. Check Backend Server

Ensure that:

- Backend server is running on `http://localhost:3000`
- `/api/users/profile` endpoint is accessible
- Database connection is working

### 5. Common Issues and Solutions

#### Issue: 401 Unauthorized

**Cause**: Invalid or missing authentication token
**Solution**:

- Re-login to get a fresh token
- Check if token is being sent in Authorization header

#### Issue: 404 Not Found

**Cause**: API endpoint not found
**Solution**:

- Verify backend server is running
- Check if route is properly configured

#### Issue: 500 Internal Server Error

**Cause**: Backend server error
**Solution**:

- Check backend server logs
- Verify database connection
- Check if user data exists in database

#### Issue: Network Error

**Cause**: Cannot connect to backend server
**Solution**:

- Verify backend server is running on correct port
- Check if CORS is properly configured
- Verify API_URL environment variable

### 6. Manual Testing

#### Test API Endpoint Directly

```bash
# Test with curl (replace TOKEN with actual token)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/users/profile
```

#### Test in Browser Console

```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('userToken'));

// Test API call manually
fetch('http://localhost:3000/api/users/profile', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('userToken')}`,
    'Content-Type': 'application/json',
  },
})
  .then(response => response.json())
  .then(data => console.log('Profile data:', data))
  .catch(error => console.error('Error:', error));
```

### 7. Expected Response Structure

The API should return:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "fullName": "User Name",
      "email": "user@example.com"
      // ... other user fields
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 8. Temporary Workaround

If the issue persists, you can temporarily use mock data:

```typescript
// In UserDashboard.tsx, replace the API call with:
const mockUserData = {
  id: user?.id || 'mock-id',
  aadharNumber: '1234-5678-9012',
  fullName: user?.fullName || 'Test User',
  // ... add other required fields
};
setUserData(mockUserData);
```

This will help identify if the issue is with the API or the UI components.
