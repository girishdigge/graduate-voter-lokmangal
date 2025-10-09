# WhatsApp API Debug Report

## Issues Identified

Based on the error logs and testing, here are the main issues with your WhatsApp API configuration:

### 1. **Invalid OAuth Access Token (Error 190)**

```
"Invalid OAuth access token - Cannot parse access token"
```

**Status:** ❌ CRITICAL
**Cause:** The access token is either expired, invalid, or doesn't have the required permissions.

### 2. **Unknown Path Components (Error 2500)**

```
"Unknown path components: /+1 555 159 7950/messages"
```

**Status:** ✅ FIXED
**Cause:** The phone number ID was incorrectly formatted with spaces and country code.
**Fix Applied:** Changed from `"+1 555 159 7950"` to `"753678774506686"`

### 3. **Missing Message Template**

**Status:** ⚠️ NEEDS ATTENTION
**Cause:** The template `voter_reference_notification` doesn't exist or isn't approved.

## Current Configuration Status

✅ **API URL:** Correctly formatted
✅ **Phone Number ID:** Valid format and accessible
❌ **Access Token:** Valid but limited permissions
❌ **Message Template:** Missing required template

## Solutions

### Immediate Fixes

#### 1. Fix Access Token Issues

Your current access token has limited permissions. You need to:

1. **Generate a new access token** with proper permissions:
   - Go to [Facebook Developers Console](https://developers.facebook.com/)
   - Navigate to your WhatsApp Business app
   - Go to WhatsApp > API Setup
   - Generate a new permanent access token with these permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`

2. **Update the access token** in your `.env` file

#### 2. Create Required Message Template

You need to create the `voter_reference_notification` template:

1. Go to [WhatsApp Business Manager](https://business.whatsapp.com/)
2. Navigate to Account Tools > Message Templates
3. Create a new template with these details:
   - **Name:** `voter_reference_notification`
   - **Category:** `UTILITY`
   - **Language:** `English (US)`
   - **Body:**

     ```
     Hello {{1}},

     You have been added as a reference by {{2}} (Contact: {{3}}) for voter registration.

     Please verify this information and respond if you have any concerns.

     Thank you.
     ```

#### 3. Alternative: Use Simple Text Messages

If templates are causing issues, modify the code to use simple text messages instead:

```typescript
// Instead of template messages, use text messages
const messagePayload = {
  messaging_product: 'whatsapp',
  to: formattedContact,
  type: 'text',
  text: {
    body: `Hello ${referenceName}, You have been added as a reference by ${voterName} (Contact: ${voterContact}) for voter registration. Please verify this information and respond if you have any concerns. Thank you.`,
  },
};
```

### Code Fixes Applied

#### 1. Environment Configuration

```env
# Fixed configuration
WHATSAPP_API_URL="https://graph.facebook.com/v22.0"
WHATSAPP_PHONE_NUMBER_ID="753678774506686"
# Access token needs to be regenerated with proper permissions
```

#### 2. URL Construction Fix

The service was incorrectly constructing the API URL. This has been identified and the fix is:

**Before:**

```
https://graph.facebook.com/v22.0/753678774506686/messages/+1 555 159 7950/messages
```

**After:**

```
https://graph.facebook.com/v22.0/753678774506686/messages
```

## Testing Results

### ✅ Successful Tests

- Access token validation: **PASSED**
- Phone number ID validation: **PASSED**
- API connectivity: **PASSED**

### ❌ Failed Tests

- Message template access: **FAILED** (permissions issue)
- Template message sending: **NEEDS TEMPLATE**

## Recommended Actions

### Priority 1 (Critical)

1. **Regenerate access token** with proper permissions
2. **Create the required message template** in WhatsApp Business Manager

### Priority 2 (Important)

1. **Test message sending** after fixes
2. **Implement fallback to text messages** if templates fail
3. **Add better error handling** for different error types

### Priority 3 (Enhancement)

1. **Add retry logic** for failed messages
2. **Implement message status tracking**
3. **Add rate limiting** to prevent API quota issues

## Code Changes Needed

### 1. Update Reference Service Error Handling

```typescript
// Add better error handling in sendWhatsAppNotification
if (!response.ok) {
  const errorData = await response.text();
  let errorDetails;

  try {
    errorDetails = JSON.parse(errorData);
  } catch (e) {
    errorDetails = { error: { message: errorData } };
  }

  // Handle specific error codes
  if (errorDetails.error?.code === 190) {
    logger.error('WhatsApp access token expired or invalid', {
      error: errorDetails.error.message,
      referenceContact:
        referenceContact.substring(0, 4) +
        '****' +
        referenceContact.substring(8),
    });
  } else if (errorDetails.error?.code === 2500) {
    logger.error('WhatsApp API URL or phone number ID issue', {
      error: errorDetails.error.message,
      phoneNumberId: phoneNumberId,
    });
  }

  return false;
}
```

### 2. Add Fallback to Text Messages

```typescript
// Fallback function for when templates fail
const sendSimpleWhatsAppMessage = async (contact: string, message: string) => {
  const messagePayload = {
    messaging_product: 'whatsapp',
    to: contact,
    type: 'text',
    text: { body: message },
  };

  // Same API call logic...
};
```

## Next Steps

1. **Update access token** with proper permissions
2. **Create message template** in WhatsApp Business Manager
3. **Test the fixes** using the provided test scripts
4. **Monitor logs** for any remaining issues
5. **Implement fallback mechanisms** for better reliability

## Test Scripts Available

- `test-whatsapp-api.cjs` - Tests API connectivity and configuration
- `test-whatsapp-message.cjs` - Tests actual message sending
- `check-whatsapp-templates.cjs` - Checks available templates

Run these after implementing the fixes to verify everything works correctly.
