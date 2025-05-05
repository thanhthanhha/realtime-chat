#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Base URL
BASE_URL="http://localhost:3000/api/chat"

# Test users from database
USER1_ID="bae4eef4-403c-47a1-bdc9-d683d07b4992"  # Jane Smith
USER2_ID="cecd3654-f30a-4b97-8b87-53212a02337d"  # John Doe Updated
USER3_ID="73e97142-c5a8-4226-964c-468726ce96e5"  # John Doe Updated

# Function to print test step
print_step() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to check response
check_response() {
    if [ $1 -eq $2 ]; then
        echo -e "${GREEN}✓ Test passed${NC}"
    else
        echo -e "${RED}✗ Test failed - Expected status $2, got $1${NC}"
    fi
}

# 1. Create a new chat
print_step "Creating a new chat between Jane and John"
CREATE_CHAT_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "{
        \"chat_owner\": \"$USER1_ID\",
        \"participants\": [\"$USER1_ID\", \"$USER2_ID\"]
    }")

HTTP_STATUS=${CREATE_CHAT_RESPONSE: -3}
CHAT_DATA=${CREATE_CHAT_RESPONSE:0:-3}
check_response $HTTP_STATUS 201

# Extract chat ID from response
CHAT_ID=$(echo $CHAT_DATA | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Created chat ID: $CHAT_ID"

# # 2. Get chat by ID
# print_step "Getting chat by ID"
# GET_CHAT_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/$CHAT_ID")
# HTTP_STATUS=${GET_CHAT_RESPONSE: -3}
# check_response $HTTP_STATUS 200

# # 3. Get chats by user ID (Jane's chats)
# print_step "Getting chats for Jane"
# GET_USER_CHATS_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/user/$USER1_ID")
# HTTP_STATUS=${GET_USER_CHATS_RESPONSE: -3}
# check_response $HTTP_STATUS 200

# # 4. Get chats by participant ID (John's chats)
# print_step "Getting chats where John is a participant"
# GET_PARTICIPANT_CHATS_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/participant/$USER2_ID")
# HTTP_STATUS=${GET_PARTICIPANT_CHATS_RESPONSE: -3}
# check_response $HTTP_STATUS 200

# # 5. Add a new participant (this is a hypothetical third user)
# print_step "Adding a new participant to the chat"
# NEW_PARTICIPANT_ID="test-user-3"
# ADD_PARTICIPANT_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/participant" \
#     -H "Content-Type: application/json" \
#     -d "{
#         \"chatId\": \"$CHAT_ID\",
#         \"participantId\": \"$NEW_PARTICIPANT_ID\"
#     }")
# HTTP_STATUS=${ADD_PARTICIPANT_RESPONSE: -3}
# check_response $HTTP_STATUS 200


# Test adding a message to chat
print_step "Adding message to chat"
# CHAT_ID="4897d003-ce74-4531-8f3d-7c8b002f274f"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/$CHAT_ID/messages" \
    -H "Content-Type: application/json" \
    -d "{
        \"sender_id\": \"$USER1_ID\",
        \"receiver_id\": \"$USER2_ID\",
        \"text\": \"Hello, this is a test message!\"
    }")

HTTP_STATUS=${RESPONSE: -3}
RESPONSE_BODY=${RESPONSE:0:${#RESPONSE}-3}

echo "Response body: $RESPONSE_BODY"
check_response $HTTP_STATUS 201

# Test adding a message to chat
print_step "Adding message to chat"
# CHAT_ID="4897d003-ce74-4531-8f3d-7c8b002f274f"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/$CHAT_ID/messages" \
    -H "Content-Type: application/json" \
    -d "{
        \"sender_id\": \"$USER2_ID\",
        \"receiver_id\": \"$USER1_ID\",
        \"text\": \"Hello, I'm here!\"
    }")

HTTP_STATUS=${RESPONSE: -3}
RESPONSE_BODY=${RESPONSE:0:${#RESPONSE}-3}

echo "Response body: $RESPONSE_BODY"
check_response $HTTP_STATUS 201


# 1. Create a new chat
print_step "Creating a new chat between Jane and John"
CREATE_CHAT_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "{
        \"chat_owner\": \"$USER1_ID\",
        \"participants\": [\"$USER1_ID\", \"$USER3_ID\"]
    }")

HTTP_STATUS=${CREATE_CHAT_RESPONSE: -3}
CHAT_DATA=${CREATE_CHAT_RESPONSE:0:-3}
check_response $HTTP_STATUS 201

# Extract chat ID from response
CHAT_ID=$(echo $CHAT_DATA | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Created chat ID: $CHAT_ID"


# Test adding a message to chat
print_step "Adding message to chat"
# CHAT_ID="4897d003-ce74-4531-8f3d-7c8b002f274f"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/$CHAT_ID/messages" \
    -H "Content-Type: application/json" \
    -d "{
        \"sender_id\": \"$USER1_ID\",
        \"receiver_id\": \"$USER3_ID\",
        \"text\": \"Hello, this is ssssa test message!\"
    }")

HTTP_STATUS=${RESPONSE: -3}
RESPONSE_BODY=${RESPONSE:0:${#RESPONSE}-3}

echo "Response body: $RESPONSE_BODY"
check_response $HTTP_STATUS 201

# Test adding a message to chat
print_step "Adding message to chat"
# CHAT_ID="4897d003-ce74-4531-8f3d-7c8b002f274f"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/$CHAT_ID/messages" \
    -H "Content-Type: application/json" \
    -d "{
        \"sender_id\": \"$USER3_ID\",
        \"receiver_id\": \"$USER1_ID\",
        \"text\": \"Hello, I'm tes test here!\"
    }")

HTTP_STATUS=${RESPONSE: -3}
RESPONSE_BODY=${RESPONSE:0:${#RESPONSE}-3}

echo "Response body: $RESPONSE_BODY"
check_response $HTTP_STATUS 201
# # 6. Delete chat
# print_step "Deleting chat"
# DELETE_CHAT_RESPONSE=$(curl -s -w "%{http_code}" -X DELETE "$BASE_URL/$CHAT_ID")
# HTTP_STATUS=${DELETE_CHAT_RESPONSE: -3}
# check_response $HTTP_STATUS 204

echo -e "\n${GREEN}All tests completed!${NC}"