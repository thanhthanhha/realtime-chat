#!/bin/bash

# Base URL for the API
API_URL="http://localhost:3000/api/message"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Function to print colored test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        echo -e "${RED}Error: $3${NC}"
    fi
}

# Test data based on the dataset
CHATROOM_ID="822a81a2-3972-4ae9-8a8e-a1b8bd91477f"
SENDER_ID="a6e80ab9-7190-41ed-bcc9-d87df006ee6c"  # Jane Smith
RECEIVER_ID="73e97142-c5a8-4226-964c-468726ce96e5" # John Doe Updated

echo -e "${BLUE}Starting Message API Tests...${NC}"
echo "----------------------------------------"

# Test 1: Create a new message
echo "Testing Create Message..."
RESPONSE=$(curl -s -X POST \
    "${API_URL}/chatroom/${CHATROOM_ID}/messages" \
    -H "Content-Type: application/json" \
    -d '{
        "sender_id": "'${SENDER_ID}'",
        "receiver_id": "'${RECEIVER_ID}'",
        "text": "Hello, this is a test message!"
    }')
MESSAGE_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
print_result $? "Create Message" "$RESPONSE"
echo "Created Message ID: $MESSAGE_ID"
echo "----------------------------------------"

# Test 2: Get message by ID
echo "Testing Get Message by ID..."
RESPONSE=$(curl -s -X GET "${API_URL}/${MESSAGE_ID}")
print_result $? "Get Message by ID" "$RESPONSE"
echo "----------------------------------------"

# Test 3: Get messages by sender ID
echo "Testing Get Messages by Sender ID..."
RESPONSE=$(curl -s -X GET "${API_URL}/sender/${SENDER_ID}")
print_result $? "Get Messages by Sender ID" "$RESPONSE"
echo "----------------------------------------"

# Test 4: Get messages by receiver ID
echo "Testing Get Messages by Receiver ID..."
RESPONSE=$(curl -s -X GET "${API_URL}/receiver/${RECEIVER_ID}")
print_result $? "Get Messages by Receiver ID" "$RESPONSE"
echo "----------------------------------------"

# Test 5: Get messages by chatroom ID
echo "Testing Get Messages by Chatroom ID..."
RESPONSE=$(curl -s -X GET "${API_URL}/chatroom/${CHATROOM_ID}/messages")
print_result $? "Get Messages by Chatroom ID" "$RESPONSE"
echo "----------------------------------------"

# # Test 6: Delete message
# echo "Testing Delete Message..."
# RESPONSE=$(curl -s -X DELETE "${API_URL}/${MESSAGE_ID}")
# print_result $? "Delete Message" "$RESPONSE"
# echo "----------------------------------------"

# # Test 7: Verify message deletion
# echo "Testing Get Deleted Message (should fail)..."
# RESPONSE=$(curl -s -X GET "${API_URL}/${MESSAGE_ID}")
# if echo "$RESPONSE" | grep -q "Message not found"; then
#     print_result 0 "Message Successfully Deleted" "$RESPONSE"
# else
#     print_result 1 "Message Still Exists" "$RESPONSE"
# fi
# echo "----------------------------------------"

echo -e "${BLUE}Message API Tests Completed${NC}"