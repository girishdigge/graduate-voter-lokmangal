#!/bin/bash

# Test script to verify document upload with actual curl request
# This will help us see exactly what the server receives

echo "🧪 Testing Document Upload with curl"
echo "===================================="
echo ""

# Configuration
API_URL="http://localhost:3000/api/documents"
USER_ID="test-user-123"
DOCUMENT_TYPE="PHOTO"

# Create a test file if it doesn't exist
mkdir -p test-files
if [ ! -f "test-files/sample-photo.jpg" ]; then
    echo "Creating test file..."
    # Create a minimal valid JPEG file
    printf '\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49\x46\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00\xff\xdb\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\x09\x09\x08\x0a\x0c\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c\x20\x24\x2e\x27\x20\x22\x2c\x23\x1c\x1c\x28\x37\x29\x2c\x30\x31\x34\x34\x34\x1f\x27\x39\x3d\x38\x32\x3c\x2e\x33\x34\x32\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\x8a\x00\xff\xd9' > test-files/sample-photo.jpg
    echo "✅ Test file created"
fi

echo ""
echo "📤 Sending upload request..."
echo "   URL: ${API_URL}/${USER_ID}/upload"
echo "   Document Type: ${DOCUMENT_TYPE}"
echo "   File: test-files/sample-photo.jpg"
echo ""

# Make the request (without authentication for now to see the error)
curl -v -X POST "${API_URL}/${USER_ID}/upload" \
  -F "document=@test-files/sample-photo.jpg" \
  -F "documentType=${DOCUMENT_TYPE}" \
  2>&1 | tee curl-output.log

echo ""
echo ""
echo "📋 Check the server logs to see what was received in req.body"
echo ""
echo "💡 If you see 'MISSING_DOCUMENT_TYPE' error, check:"
echo "   1. Is 'documentType' in the form data? (should be in curl output above)"
echo "   2. What does the server log show for 'bodyKeys'?"
echo "   3. Is multer configured correctly to parse text fields?"
