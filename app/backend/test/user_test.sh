#!/bin/bash

# Set the base URL for the API
BASE_URL="http://localhost:3000/api/users"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Testing User API Endpoints..."
echo "=============================="

# Test 1: Create a new user
echo -e "\n${GREEN}Test 1: Creating a new user${NC}"
CREATE_USER_RESPONSE=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ariana",
    "email": "ariana@example.com",
    "image": "https://example.com/mac.jpg",
    "friendlist_id": [],
    "password": "admin123"
  }')

# Extract user ID from response for further tests
USER_ID=$(echo $CREATE_USER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Created user with ID: $USER_ID"
echo "Response: $CREATE_USER_RESPONSE"

# Test 2: Create a second user (for friend operations)
echo -e "\n${GREEN}Test 2: Creating a second user${NC}"
CREATE_FRIEND_RESPONSE=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Miley BB",
    "email": "miley@example.com",
    "image": "https://example.com/Sirius.jpg",
    "friendlist_id": []
  }')

FRIEND_ID=$(echo $CREATE_FRIEND_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Created friend with ID: $FRIEND_ID"
echo "Response: $CREATE_FRIEND_RESPONSE"

# Test 3: Get user by ID
echo -e "\n${GREEN}Test 3: Getting user by ID${NC}"
GET_USER_RESPONSE=$(curl -s -X GET "$BASE_URL/$USER_ID")
echo "Response: $GET_USER_RESPONSE"

# # Test 4: Update user
# echo -e "\n${GREEN}Test 4: Updating user${NC}"
# UPDATE_USER_RESPONSE=$(curl -s -X PUT "$BASE_URL/$USER_ID" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "name": "Mac Mac Baby",
#     "email": "mac.updated@example.com"
#   }')
# echo "Response: $UPDATE_USER_RESPONSE"


# # Test 4: Update user ppassword
# echo -e "\n${GREEN}Test 4: Updating user${NC}"
# UPDATE_USER_RESPONSE=$(curl -s -X PUT "$BASE_URL/$USER_ID" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "password": "admimadmin",
#   }')
# echo "Response: $UPDATE_USER_RESPONSE"

# # Test 5: Add friend
# echo -e "\n${GREEN}Test 5: Adding friend${NC}"
# ADD_FRIEND_RESPONSE=$(curl -s -X POST "$BASE_URL/friends/add" \
#   -H "Content-Type: application/json" \
#   -d "{
#     \"userId\": \"$USER_ID\",
#     \"friendId\": \"$FRIEND_ID\"
#   }")
# echo "Response: $ADD_FRIEND_RESPONSE"

# # Test 6: Get friendlist
# echo -e "\n${GREEN}Test 6: Getting friendlist${NC}"
# GET_FRIENDS_RESPONSE=$(curl -s -X GET "$BASE_URL/$USER_ID/friends")
# echo "Response: $GET_FRIENDS_RESPONSE"

# # Test 7: Remove friend
# echo -e "\n${GREEN}Test 7: Removing friend${NC}"
# REMOVE_FRIEND_RESPONSE=$(curl -s -X POST "$BASE_URL/friends/remove" \
#   -H "Content-Type: application/json" \
#   -d "{
#     \"userId\": \"$USER_ID\",
#     \"friendId\": \"$FRIEND_ID\"
#   }")
# echo "Response: $REMOVE_FRIEND_RESPONSE"

# # Test 8: Delete second user
# echo -e "\n${GREEN}Test 8: Deleting second user${NC}"
# DELETE_FRIEND_RESPONSE=$(curl -s -X DELETE "$BASE_URL/$FRIEND_ID")
# echo "Response: $DELETE_FRIEND_RESPONSE"

# # Test 9: Delete first user
# echo -e "\n${GREEN}Test 9: Deleting first user${NC}"
# DELETE_USER_RESPONSE=$(curl -s -X DELETE "$BASE_URL/$USER_ID")
# echo "Response: $DELETE_USER_RESPONSE"

# echo -e "\n${GREEN}All tests completed!${NC}"