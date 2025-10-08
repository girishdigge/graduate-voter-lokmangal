# Enrollment Page Fixes

## Issues Fixed

### 1. Missing Aadhar Number

**Problem**: Backend requires `aadharNumber` field but frontend wasn't sending it.
**Solution**: Get Aadhar number from navigation state (passed from AadharCheckModal) and include it in the enrollment data.

### 2. Field Name Mismatch

**Problem**: Frontend sends `graduationDocumentType` but backend expects `graduationDocType`.
**Solution**: Updated field name mapping in data transformation.

### 3. Data Type Mismatch

**Problem**: Frontend sends `graduationYear` as string but backend expects number.
**Solution**: Convert string to number using `parseInt()`.

### 4. Navigation State Handling

**Problem**: Enrollment page needs Aadhar number from previous step.
**Solution**:

- Get Aadhar number from `location.state.aadharNumber`
- Redirect to home if no Aadhar number is provided
- Show loading state while checking

### 5. Better Error Handling

**Problem**: Generic error messages don't help users understand validation issues.
**Solution**: Display specific validation errors from backend response.

## Data Transformation

The enrollment data is now properly transformed:

```typescript
{
  // Required field from navigation state
  aadharNumber: aadharNumber,

  // Personal info (strings)
  fullName, sex, guardianSpouse, qualification, occupation, contact, email, dateOfBirth,

  // Address info (strings)
  houseNumber, street, area, city, state, pincode,

  // Elector info (mixed types)
  isRegisteredElector: boolean,
  assemblyNumber, assemblyName, pollingStationNumber, epicNumber: strings,
  disabilities: array (backend converts to JSON string),

  // Education info
  university: string,
  graduationYear: number (converted from string),
  graduationDocType: string (correct field name)
}
```

## Backend Validation Requirements

Based on `userValidation.ts`, the backend expects:

- **aadharNumber**: 12-digit string
- **graduationYear**: number (1950 to current year)
- **graduationDocType**: string (not graduationDocumentType)
- **disabilities**: array (gets converted to JSON string)
- **dateOfBirth**: string that can be parsed to Date
- **contact**: 10-digit Indian mobile number (6-9 prefix)
- **pincode**: 6-digit string
- **email**: valid email or empty string

## Testing

To test the enrollment:

1. Go to landing page
2. Click "Check Aadhar & Register"
3. Enter a 12-digit Aadhar number that doesn't exist
4. Fill out the enrollment form completely
5. Submit and check for validation errors

If validation errors occur, they will now be displayed with specific field names and messages.
