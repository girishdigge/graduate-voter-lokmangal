# Profile Update API Fix

## Issue

Profile updates were failing with 400 Bad Request errors due to data format mismatches between frontend and backend.

## Root Cause Analysis

### Backend Expectations

The backend uses the same validation schema as enrollment (`userEnrollmentSchema`) which expects:

- `graduationDocType` (not `graduationDocumentType`)
- `disabilities` as an array (not comma-separated string)
- Proper data types for all fields
- Empty strings for optional fields (not undefined/null)

### Frontend Issues

1. **Field Name Mismatch**: Frontend was sending `graduationDocumentType` but backend expects `graduationDocType`
2. **Data Type Issues**: Some fields were being sent as wrong types
3. **Disabilities Format**: Backend expects array but frontend was sending comma-separated string
4. **Optional Fields**: Backend validation was strict about optional field formats

## Solution Implemented

### Data Transformation

Created explicit data transformation in `handleSave` function:

```typescript
const transformedData = {
  fullName: editData.fullName,
  sex: editData.sex,
  guardianSpouse: editData.guardianSpouse || '',
  qualification: editData.qualification || '',
  occupation: editData.occupation,
  contact: editData.contact,
  email: editData.email || '',
  dateOfBirth: editData.dateOfBirth,
  houseNumber: editData.houseNumber,
  street: editData.street,
  area: editData.area,
  city: editData.city,
  state: editData.state,
  pincode: editData.pincode,
  isRegisteredElector: Boolean(editData.isRegisteredElector),
  assemblyNumber: editData.assemblyNumber || '',
  assemblyName: editData.assemblyName || '',
  pollingStationNumber: editData.pollingStationNumber || '',
  epicNumber: editData.epicNumber || '',
  disabilities: editData.disabilities
    ? editData.disabilities
        .split(', ')
        .map(d => d.trim())
        .filter(d => d)
    : [],
  university: editData.university || '',
  graduationYear: editData.graduationYear
    ? parseInt(editData.graduationYear.toString())
    : undefined,
  graduationDocType: editData.graduationDocumentType || '', // Correct field name
};
```

### Key Fixes

1. **Field Name Mapping**:
   - `graduationDocumentType` → `graduationDocType`

2. **Data Type Conversion**:
   - `graduationYear`: String to Number conversion
   - `isRegisteredElector`: Explicit boolean conversion
   - `disabilities`: Comma-separated string to array

3. **Optional Field Handling**:
   - Empty strings for optional text fields instead of undefined
   - Empty array for disabilities instead of null
   - Proper undefined handling for graduationYear

4. **Disabilities Array Format**:
   - Split by `', '` (comma + space)
   - Trim whitespace from each item
   - Filter out empty strings
   - Return empty array if no disabilities

## Backend Validation Schema Alignment

The transformation now matches the backend's `userEnrollmentSchema` expectations:

- **Required Fields**: Properly formatted with correct types
- **Optional Fields**: Empty strings or appropriate defaults
- **Arrays**: Proper array format for disabilities
- **Numbers**: Parsed integers where expected
- **Booleans**: Explicit boolean conversion

## Testing Recommendations

1. **Field Updates**: Test updating each field type individually
2. **Disabilities**: Test multiple selections and "Other" option
3. **Electoral Info**: Test conditional fields when isRegisteredElector changes
4. **Data Types**: Verify number fields accept valid ranges
5. **Validation**: Test invalid data to ensure proper error handling

## Benefits

1. **Successful Updates**: Profile updates now work correctly
2. **Data Integrity**: Proper data types ensure database consistency
3. **User Experience**: Clear error messages for validation failures
4. **Maintainability**: Explicit transformation makes debugging easier
5. **Compatibility**: Frontend data format matches backend expectations
