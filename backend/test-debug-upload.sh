#!/bin/bash

echo "🧪 Testing Debug Upload Endpoint"
echo "================================"
echo ""

# Create test file
mkdir -p test-files
if [ ! -f "test-files/sample-photo.jpg" ]; then
    printf '\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49\x46\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00\xff\xdb\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\x09\x09\x08\x0a\x0c\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c\x20\x24\x2e\x27\x20\x22\x2c\x23\x1c\x1c\x28\x37\x29\x2c\x30\x31\x34\x34\x34\x1f\x27\x39\x3d\x38\x32\x3c\x2e\x33\x34\x32\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\x8a\x00\xff\xd9' > test-files/sample-photo.jpg
fi

echo "📤 Test 1: Sending with documentType as form field"
echo "---------------------------------------------------"
curl -X POST "http://localhost:3000/api/debug/test-upload" \
  -F "document=@test-files/sample-photo.jpg" \
  -F "documentType=PHOTO" \
  2>/dev/null | jq '.'

echo ""
echo ""
echo "📤 Test 2: Sending with different field name"
echo "---------------------------------------------"
curl -X POST "http://localhost:3000/api/debug/test-upload" \
  -F "document=@test-files/sample-photo.jpg" \
  -F "type=PHOTO" \
  2>/dev/null | jq '.'

echo ""
echo ""
echo "📤 Test 3: Sending without documentType"
echo "----------------------------------------"
curl -X POST "http://localhost:3000/api/debug/test-upload" \
  -F "document=@test-files/sample-photo.jpg" \
  2>/dev/null | jq '.'

echo ""
echo ""
echo "✅ Check the server logs for detailed information"
echo "💡 The response above shows what the server received"
