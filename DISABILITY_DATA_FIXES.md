# Disability Data and Profile Update Fixes

## Issues Fixed

### 1. Profile Update 400 Error

**Problem**: Profile updates were failing with 400 Bad Request errors because the backend was using the full enrollment validation schema for updates, which requires all fields to be present.

**Solution**:

- Created a new `validateUserUpdateInput()` function that uses a partial validation schema
- Updated the `updateUserProfile` controller to use the new validation function
- All fields are now optional for updates, allowing partial profile updates

### 2. Disability Data Storage and Display Issues

**Problem**: Disabilities were being stored and displayed incorrectly:

- During enrollment: Array was being malformed
- During updates: Frontend was sending string instead of array
- During display: Frontend couldn't properly parse stored JSON data

**Solutions**:

#### Backend Changes:

- **User Validation**: Created separate update validation schema (`userUpdateSchema.partial()`)
- **User Controller**: Updated `updateUserProfile` to use proper validation
- **Data Handling**: Backend correctly converts disability arrays to JSON strings for storage

#### Frontend Changes:

- **Enrollment**: Fixed to send disabilities as proper array
- **ProfileModal**:
  - Fixed to handle disabilities stored as JSON strings
  - Added fallback parsing for both JSON and comma-separated formats
  - Fixed TypeScript errors with proper type annotations
  - Send disabilities as array to backend for proper processing
- **Display**: UserProfile component already handled JSON parsing correctly

## Data Flow

### Enrollment Flow:

1. User selects disabilities in form → stored as array in form state
2. Form submission → disabilities sent as array to backend
3. Backend validation → array is valid
4. Backend storage → array converted to JSON string in database

### Update Flow:

1. User edits disabilities → stored as comma-separated string in edit state
2. Form submission → string converted back to array for backend
3. Backend validation → array is valid (using new partial schema)
4. Backend storage → array converted to JSON string in database

### Display Flow:

1. Database → JSON string retrieved
2. Frontend → JSON.parse() converts to array
3. Display → array items joined with labels

## Technical Details

### Backend Validation Schema:

```typescript
// New partial schema for updates
const userUpdateSchema = userEnrollmentSchema.partial();

export const validateUserUpdateInput = (data: unknown) => {
  return userUpdateSchema.safeParse(data);
};
```

### Frontend Disability Parsing:

```typescript
// Robust parsing that handles both formats
const selectedDisabilities = editData.disabilities
  ? (() => {
      try {
        // Try JSON first (database format)
        return JSON.parse(editData.disabilities);
      } catch {
        // Fallback to comma-separated string
        return editData.disabilities.split(', ');
      }
    })()
  : [];
```

### Data Transformation:

```typescript
// Frontend sends array to backend
transformedData.disabilities = editData.disabilities
  .split(', ')
  .map(d => d.trim())
  .filter(d => d);

// Backend converts array to JSON string for storage
transformedData.disabilities = Array.isArray(updateData.disabilities)
  ? JSON.stringify(updateData.disabilities)
  : updateData.disabilities;
```

## Testing

To verify the fixes:

1. **Enrollment**: Create new user with disabilities selected
2. **Display**: Check that disabilities show correctly in profile
3. **Update**: Edit profile and modify disabilities
4. **Validation**: Ensure updates work without 400 errors

## Benefits

- ✅ Profile updates now work correctly
- ✅ Disability data is properly stored and displayed
- ✅ Robust parsing handles both data formats
- ✅ Proper validation for both enrollment and updates
- ✅ Type-safe TypeScript implementation
