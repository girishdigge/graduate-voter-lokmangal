# Profile Update Validation Fix

## Issue

Profile updates still failing with 400 Bad Request despite previous fixes. Backend validation is rejecting the payload.

## Enhanced Debugging

Added comprehensive logging to identify specific validation errors:

- Transformed data being sent
- Backend error response details
- Original edit data for comparison

## New Approach - Selective Field Updates

### Problem with Previous Approach

- Sending all fields including empty strings and null values
- Backend validation schema is strict about data types and required fields
- Some fields might not be updatable or have specific validation rules

### Solution - Conditional Field Inclusion

Only include fields that have actual values in the update payload:

```typescript
const transformedData: any = {};

// Only include fields that have values
if (editData.fullName) transformedData.fullName = editData.fullName;
if (editData.sex) transformedData.sex = editData.sex;
if (editData.guardianSpouse)
  transformedData.guardianSpouse = editData.guardianSpouse;
// ... etc for all fields

// Special handling for boolean
transformedData.isRegisteredElector = Boolean(editData.isRegisteredElector);

// Conditional electoral fields
if (editData.isRegisteredElector) {
  if (editData.assemblyNumber)
    transformedData.assemblyNumber = editData.assemblyNumber;
  // ... etc
}

// Array handling for disabilities
if (editData.disabilities) {
  transformedData.disabilities = editData.disabilities
    .split(', ')
    .map(d => d.trim())
    .filter(d => d);
}
```

## Key Changes

### 1. Conditional Field Inclusion

- Only send fields that have actual values
- Avoid sending empty strings or null values that might fail validation
- Reduce payload size and potential validation conflicts

### 2. Electoral Fields Logic

- Only include electoral fields when `isRegisteredElector` is true
- Matches backend validation logic that requires these fields only for registered electors

### 3. Data Type Handling

- `graduationYear`: Only include if value exists, convert to number
- `disabilities`: Only include if value exists, convert to array
- `isRegisteredElector`: Always include as boolean

### 4. Enhanced Error Reporting

- Log the exact transformed data being sent
- Display validation error details to user
- Better error message formatting

## Expected Benefits

1. **Reduced Validation Conflicts**: Only sending fields with values
2. **Better Error Visibility**: Clear logging of what's being sent vs what's failing
3. **Conditional Logic**: Proper handling of dependent fields (electoral info)
4. **Type Safety**: Proper data type conversion for each field

## Debugging Steps

1. **Check Console Logs**: Look for "Sending transformed data" to see exact payload
2. **Backend Error Details**: Check error response for specific validation failures
3. **Field-by-Field**: Identify which specific fields are causing validation errors
4. **Data Types**: Verify each field is being sent with correct data type

## Next Steps if Still Failing

1. **Backend Logs**: Check backend validation logs for specific error details
2. **Schema Comparison**: Compare sent data structure with backend validation schema
3. **Field Mapping**: Verify all field names match backend expectations
4. **Required Fields**: Ensure all required fields are included in payload

This approach should resolve the validation issues by sending only valid, properly formatted data to the backend.
