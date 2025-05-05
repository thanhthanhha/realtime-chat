#!/bin/bash

# Set the base URLs for the API
BASE_URL="http://localhost:3000/api"
USER_URL="$BASE_URL/users"
AUTH_URL="$BASE_URL/auth"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${YELLOW}$1${NC}"
    echo "=============================="
}

# Function to store and check JWT token
TOKEN=""
store_token() {
    TOKEN=$1
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}No token received${NC}"
    else
        echo -e "${GREEN}Token stored successfully${NC}"
    fi
}

print_header "Starting User API Tests with Authentication"

# Test 1: Create a new user
echo -e "\n${GREEN}Test 1: Creating a new user${NC}"
CREATE_USER_RESPONSE=$(curl -s -X POST $USER_URL \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ariana",
    "email": "ariana@example.com",
    "image": "https://example.com/mac.jpg",
    "friendlist_id": [],
    "password": "admin123"
  }')


# Test 1: Create a new user
echo -e "\n${GREEN}Test 1: Creating a new user${NC}"
CREATE_USER_RESPONSE=$(curl -s -X POST $USER_URL \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Miley BB",
    "email": "miley@example.com",
    "image": "https://example.com/mac.jpg",
    "friendlist_id": [],
    "password": "admin123"
  }')
# # Extract user ID from response for further tests
# USER_ID=$(echo $CREATE_USER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
# echo "Created user with ID: $USER_ID"
# echo "Response: $CREATE_USER_RESPONSE"

# # Test 2: Test Login with created user
# echo -e "\n${GREEN}Test 2: Testing login with created user${NC}"
# LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "mac@example.com",
#     "password": "admin123"
#   }')

# # Extract and store token
# TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
# store_token "$TOKEN"
# echo "Login Response: $LOGIN_RESPONSE"

# # Test 3: Test Login with wrong password
# echo -e "\n${GREEN}Test 3: Testing login with wrong password${NC}"
# FAILED_LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "mac@example.com",
#     "password": "wrongpassword"
#   }')
# echo "Failed Login Response: $FAILED_LOGIN_RESPONSE"

# # Test 4: Create a second user
# echo -e "\n${GREEN}Test 4: Creating a second user${NC}"
# CREATE_FRIEND_RESPONSE=$(curl -s -X POST $USER_URL \
#   -H "Content-Type: application/json" \
#   -d '{
#     "name": "Sirius BB",
#     "email": "sirius@example.com",
#     "image": "https://example.com/sirius.jpg",
#     "friendlist_id": [],
#     "password": "friend123"
#   }')
# FRIEND_ID=$(echo $CREATE_FRIEND_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
# echo "Created friend with ID: $FRIEND_ID"
# echo "Response: $CREATE_FRIEND_RESPONSE"

# # Test 5: Get user by ID (with authentication)
# echo -e "\n${GREEN}Test 5: Getting user by ID with auth token${NC}"
# GET_USER_RESPONSE=$(curl -s -X GET "$USER_URL/$USER_ID" \
#   -H "Authorization: Bearer $TOKEN")
# echo "Response: $GET_USER_RESPONSE"

# # Test 6: Update user password
# echo -e "\n${GREEN}Test 6: Updating user password${NC}"
# UPDATE_PASSWORD_RESPONSE=$(curl -s -X PUT "$USER_URL/$USER_ID/password" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $TOKEN" \
#   -d '{
#     "password": "newpassword123"
#   }')
# echo "Response: $UPDATE_PASSWORD_RESPONSE"

# # Test 7: Login with new password
# echo -e "\n${GREEN}Test 7: Testing login with new password${NC}"
# NEW_LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "mac@example.com",
#     "password": "newpassword123"
#   }')
# echo "New Login Response: $NEW_LOGIN_RESPONSE"

# # Test 8: Update user details
# echo -e "\n${GREEN}Test 8: Updating user details${NC}"
# UPDATE_USER_RESPONSE=$(curl -s -X PUT "$USER_URL/$USER_ID" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $TOKEN" \
#   -d '{
#     "name": "Mac Mac Baby",
#     "email": "mac.updated@example.com"
#   }')
# echo "Response: $UPDATE_USER_RESPONSE"

# # Test 9: Add friend (with authentication)
# echo -e "\n${GREEN}Test 9: Adding friend${NC}"
# ADD_FRIEND_RESPONSE=$(curl -s -X POST "$USER_URL/friends/add" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $TOKEN" \
#   -d "{
#     \"userId\": \"$USER_ID\",
#     \"friendId\": \"$FRIEND_ID\"
#   }")
# echo "Response: $ADD_FRIEND_RESPONSE"

# # Test 10: Get friendlist (with authentication)
# echo -e "\n${GREEN}Test 10: Getting friendlist${NC}"
# GET_FRIENDS_RESPONSE=$(curl -s -X GET "$USER_URL/$USER_ID/friends" \
#   -H "Authorization: Bearer $TOKEN")
# echo "Response: $GET_FRIENDS_RESPONSE"

# # Test 11: Remove friend (with authentication)
# echo -e "\n${GREEN}Test 11: Removing friend${NC}"
# REMOVE_FRIEND_RESPONSE=$(curl -s -X POST "$USER_URL/friends/remove" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $TOKEN" \
#   -d "{
#     \"userId\": \"$USER_ID\",
#     \"friendId\": \"$FRIEND_ID\"
#   }")
# echo "Response: $REMOVE_FRIEND_RESPONSE"

# # Test 12: Cleanup - Delete second user
# echo -e "\n${GREEN}Test 12: Deleting second user${NC}"
# DELETE_FRIEND_RESPONSE=$(curl -s -X DELETE "$USER_URL/$FRIEND_ID" \
#   -H "Authorization: Bearer $TOKEN")
# echo "Response: $DELETE_FRIEND_RESPONSE"

# # Test 13: Cleanup - Delete first user
# echo -e "\n${GREEN}Test 13: Deleting first user${NC}"
# DELETE_USER_RESPONSE=$(curl -s -X DELETE "$USER_URL/$USER_ID" \
#   -H "Authorization: Bearer $TOKEN")
# echo "Response: $DELETE_USER_RESPONSE"

echo -e "\n${GREEN}All tests completed!${NC}"