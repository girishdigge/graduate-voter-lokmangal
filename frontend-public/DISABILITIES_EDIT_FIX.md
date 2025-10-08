# Disabilities Edit Form Fix

## Issue

The disability section was not consistent between the enrollment form and the edit form in the dashboard. When editing, existing disabilities were not pre-checked, and changes were not properly stored in the backend.

## Root Causes

1. **Missing Edit Component**: The UserProfile component only displayed disabilities in read-only mode but had no editable disabilities section
2. **Data Format Mismatch**: Frontend stored disabilities as JSON string, but backend API expected array format
3. **No Pre-population**: Existing disabilities from the database were not being parsed and pre-checked in edit mode

## Fixes Applied

### 1. Added Editable Disabilities Section (UserProfile.tsx)

```typescript
// New DisabilitiesSection component for editing
const DisabilitiesSection: React.FC<DisabilitiesSectionProps> = ({
  selectedDisabilities,
  onChange,
  disabled = false,
}) => {
  // Parse existing disabilities and pre-check them
  useEffect(() => {
    if (selectedDisabilities) {
      try {
        const parsed = JSON.parse(selectedDisabilities);
        setCurrentDisabilities(Array.isArray(parsed) ? parsed : []);
      } catch {
        setCurrentDisabilities([]);
      }
    } else {
      setCurrentDisabilities([]);
    }
  }, [selectedDisabilities]);

  // Handle checkbox changes (replace, not append)
  const handleDisabilityChange = (value: string, checked: boolean) => {
    let newDisabilities = checked
      ? [...currentDisabilities, value]
      : currentDisabilities.filter(d => d !== value);

    setCurrentDisabilities(newDisabilities);
    onChange(JSON.stringify(newDisabilities));
  };
};
```

### 2. Data Transformation in Save Logic (UserDashboard.tsx)

```typescript
const handleSave = async (updatedData: Partial<UserData>) => {
  // Transform disabilities from JSON string to array for backend API
  const transformedData: any = { ...updatedData };
  if (transformedData.disabilities !== undefined) {
    try {
      const disabilitiesArray = transformedData.disabilities
        ? JSON.parse(transformedData.disabilities)
        : [];
      transformedData.disabilities = Array.isArray(disabilitiesArray)
        ? disabilitiesArray
        : [];
    } catch {
      transformedData.disabilities = [];
    }
  }

  const response = await apiEndpoints.updateUserProfile(transformedData);
};
```

### 3. Consistent Disability Options

Both enrollment and edit forms now use the same disability options:

- Visual Impairment
- Speech and Hearing Disability
- Locomotor Disability
- Other

## Data Flow

### Edit Mode Flow

1. **Load**: Database JSON string → Parse to array → Pre-check checkboxes
2. **Edit**: User checks/unchecks → Update array → Convert to JSON string
3. **Save**: JSON string → Parse to array → Send to backend API
4. **Store**: Backend converts array → JSON string → Database

### Consistency with Enrollment

- Same disability options and values
- Same validation logic
- Same storage format (JSON string in database)
- Same display format (parsed and labeled)

## Key Features

### ✅ Pre-population

- Existing disabilities are automatically checked when entering edit mode
- Handles malformed data gracefully

### ✅ Replace, Not Append

- Changes completely replace existing disabilities
- No duplicate or accumulated values

### ✅ Consistent UI

- Same checkboxes and labels as enrollment form
- Same styling and layout

### ✅ Error Handling

- Graceful handling of malformed JSON data
- Fallback to empty array if parsing fails

## Testing Scenarios

1. **New User**: No disabilities → Edit → Select some → Save → Verify stored correctly
2. **Existing User**: Has disabilities → Edit → See pre-checked → Modify → Save → Verify changes
3. **Clear All**: Has disabilities → Edit → Uncheck all → Save → Verify cleared
4. **Malformed Data**: Corrupted JSON → Edit → Should show empty → Select new → Save → Verify fixed

## Backend Compatibility

- Backend expects array format: `["VISUAL_IMPAIRMENT", "OTHER"]`
- Backend stores as JSON string: `'["VISUAL_IMPAIRMENT", "OTHER"]'`
- Frontend handles conversion between formats seamlessly
