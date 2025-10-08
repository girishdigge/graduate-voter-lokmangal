# Disabilities Data Storage Fix

## Problem

The disabilities data was being stored incorrectly in the database, resulting in double-encoded JSON strings like:

```
"[&quot;[&amp;amp;quot;[]&amp;amp;quot;,&amp;amp;quot;Visual Impairment&amp;amp;quot;]&quot;,&quot;Speech Impairment&quot;,&quot;a&quot;,&quot;ab&quot;,&quot;Other&quot;,&quot;abc&quot;,&quot;Visual Impairment&quot;]"
```

## Root Cause

Double JSON encoding was happening in two places:

1. **Validation Schema** (`userValidation.ts`):

   ```typescript
   disabilities: z.array(z.string())
     .optional()
     .transform(val => (val ? JSON.stringify(val) : null));
   ```

2. **Transform Function** (`userValidation.ts`):
   ```typescript
   disabilities: data.disabilities && data.disabilities.length > 0
     ? JSON.stringify(data.disabilities) // ❌ Double encoding!
     : null;
   ```

## Solution

Removed the JSON.stringify from the `transformEnrollmentData` function since the validation schema already handles the transformation:

```typescript
// Before (double encoding)
disabilities: data.disabilities && data.disabilities.length > 0
  ? JSON.stringify(data.disabilities)
  : null;

// After (single encoding)
disabilities: data.disabilities || null;
```

## Data Flow (Fixed)

### Frontend to Backend:

1. **Frontend Form**: `["VISUAL_IMPAIRMENT", "OTHER"]` (array)
2. **API Request**: `disabilities: ["VISUAL_IMPAIRMENT", "OTHER"]` (array)
3. **Validation Schema**: Transforms to `'["VISUAL_IMPAIRMENT","OTHER"]'` (JSON string)
4. **Database Storage**: `'["VISUAL_IMPAIRMENT","OTHER"]'` (JSON string)

### Backend to Frontend:

1. **Database**: `'["VISUAL_IMPAIRMENT","OTHER"]'` (JSON string)
2. **API Response**: `disabilities: '["VISUAL_IMPAIRMENT","OTHER"]'` (JSON string)
3. **Frontend Display**: Parses JSON and shows "Visual Impairment, Other"

## Frontend Display Logic

The UserProfile component correctly handles the JSON string:

```typescript
try {
  const disabilityList = JSON.parse(userData.disabilities);
  const disabilityLabels = {
    VISUAL_IMPAIRMENT: 'Visual Impairment',
    SPEECH_AND_HEARING_DISABILITY: 'Speech and Hearing Disability',
    LOCOMOTOR_DISABILITY: 'Locomotor Disability',
    OTHER: 'Other',
  };
  return disabilityList.map(d => disabilityLabels[d] || d).join(', ');
} catch {
  return userData.disabilities; // Fallback for malformed data
}
```

## Testing

After this fix:

- New enrollments will store disabilities correctly
- Existing malformed data will still display (fallback handling)
- Updates to existing records will fix the data format

## Database Migration (Optional)

For existing malformed data, a migration script could be created to clean up the double-encoded strings, but the fallback handling in the frontend makes this non-critical.
