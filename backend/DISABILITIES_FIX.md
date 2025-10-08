# Disabilities Field Fix

## Issue

The disabilities field was being double-encoded and showing malformed data like:

```
["[&quot;[&amp;amp;quot;[]&amp;amp;quot;,&amp;amp;quot;Visual Impairment&amp;amp;quot;]&quot;,&quot;Speech Impairment&quot;,&quot;a&quot;,&quot;ab&quot;,&quot;Other&quot;,&quot;abc&quot;,&quot;Visual Impairment&quot;]"]
```

## Root Cause

The database expects the `disabilities` field to be a JSON string, but the `transformEnrollmentData` function was passing the array directly without converting it to JSON.

## Fix Applied

### Backend Fix (userValidation.ts)

```typescript
// Before
disabilities: data.disabilities || null,

// After
disabilities: Array.isArray(data.disabilities) && data.disabilities.length > 0
  ? JSON.stringify(data.disabilities)
  : null,
```

### Frontend Fix (EnrollmentPage.tsx)

```typescript
// Before
disabilities: data.elector.disabilities || [],

// After
disabilities: Array.isArray(data.elector.disabilities)
  ? data.elector.disabilities.filter(d => d && d.trim() !== '') // Clean array, remove empty strings
  : [],
```

## How It Works Now

1. **Frontend**: Sends clean array of disability strings (e.g., `["VISUAL_IMPAIRMENT", "OTHER"]`)
2. **Backend**: Converts array to JSON string before storing in database
3. **Database**: Stores as JSON string (e.g., `'["VISUAL_IMPAIRMENT", "OTHER"]'`)
4. **Display**: When retrieved, JSON string is parsed back to array for display

## Database Schema

```prisma
disabilities String? @map("disabilities") @db.Text
```

## Expected Data Flow

### Input (Frontend Form)

- User selects: "Visual Impairment" and "Other"
- Form data: `["VISUAL_IMPAIRMENT", "OTHER"]`

### Processing (Backend)

- Receives: `["VISUAL_IMPAIRMENT", "OTHER"]`
- Transforms: `'["VISUAL_IMPAIRMENT", "OTHER"]'` (JSON string)
- Stores in DB: `'["VISUAL_IMPAIRMENT", "OTHER"]'`

### Output (Display)

- Retrieves: `'["VISUAL_IMPAIRMENT", "OTHER"]'`
- Parses: `["VISUAL_IMPAIRMENT", "OTHER"]`
- Displays: "Visual Impairment, Other"

## Testing

To test the fix:

1. Fill out enrollment form with disabilities selected
2. Check console logs for clean data structure
3. Verify database stores proper JSON string
4. Confirm dashboard displays disabilities correctly
