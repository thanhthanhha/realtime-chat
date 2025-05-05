#!/bin/bash

# API base URL
BASE_URL="http://localhost:3000/api/friendRequest"

# Test users from dataset
JANE_ID="d2bf3e03-3e1e-412f-9ea7-e79f2f15d789"      # Jane Smith
JAMES_ID="bae4eef4-403c-47a1-bdc9-d683d07b4992"     # James Potter
JOHN_ID="a4497cc1-9870-4e63-aef4-a7f18822c4da"      # John Doe Updated
THANHHA_ID="818d08dc-a204-4c74-9d51-782e85ce8dba"   # thanhha

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

echo "Starting Friend Request API Tests..."
echo "=================================="

# Test 1: Create a friend request from Jane to James
echo -e "\nTest 1: Creating friend request (Jane -> James)"
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL \
    -H "Content-Type: application/json" \
    -d "{\"sender_id\": \"$JANE_ID\", \"receiver_id\": \"$JAMES_ID\"}")
REQUEST_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
print_result $? "Created friend request with ID: $REQUEST_ID"
echo "Response: $CREATE_RESPONSE"


# Test 1: Create a friend request from Jane to James
echo -e "\nTest 1: Creating friend request (Jane -> James)"
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL \
    -H "Content-Type: application/json" \
    -d "{\"sender_id\": \"$THANHHA_ID\", \"receiver_id\": \"$JAMES_ID\"}")
REQUEST_ID_2=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
print_result $? "Created friend request with ID: $REQUEST_ID"
echo "Response: $CREATE_RESPONSE"

# Test 2: Get pending requests for James
echo -e "\nTest 2: Getting pending requests for James"
PENDING_RESPONSE=$(curl -s -X GET "$BASE_URL/pending/$JAMES_ID")
print_result $? "Retrieved pending requests for James"
echo "Response: $PENDING_RESPONSE"

# Test 3: Get sent requests for Jane
echo -e "\nTest 3: Getting sent requests for Jane"
SENT_RESPONSE=$(curl -s -X GET "$BASE_URL/sent/$JANE_ID")
print_result $? "Retrieved sent requests for Jane"
echo "Response: $SENT_RESPONSE"

# # Test 4: Create a duplicate request (should fail)
# echo -e "\nTest 4: Attempting to create duplicate request (Jane -> James)"
# DUPLICATE_RESPONSE=$(curl -s -X POST $BASE_URL \
#     -H "Content-Type: application/json" \
#     -d "{\"sender_id\": \"$JANE_ID\", \"receiver_id\": \"$JAMES_ID\"}")
# echo "Response: $DUPLICATE_RESPONSE"
# echo $DUPLICATE_RESPONSE | grep -q "Friend request already exists"
# print_result $? "Duplicate request properly rejected"

# Test 5: Approve the friend request
echo -e "\nTest 5: Approving friend request from Jane"
APPROVE_RESPONSE=$(curl -s -X PUT "$BASE_URL/$REQUEST_ID/approve")
print_result $? "Approved friend request"
echo "Response: $APPROVE_RESPONSE"

# # Test 6: Create another request (John -> Thanhha)
# echo -e "\nTest 6: Creating friend request (John -> Thanhha)"
# SECOND_RESPONSE=$(curl -s -X POST $BASE_URL \
#     -H "Content-Type: application/json" \
#     -d "{\"sender_id\": \"$JOHN_ID\", \"receiver_id\": \"$THANHHA_ID\"}")
# SECOND_REQUEST_ID=$(echo $SECOND_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
# print_result $? "Created second friend request with ID: $SECOND_REQUEST_ID"
# echo "Response: $SECOND_RESPONSE"

# # Test 7: Delete the second friend request
# echo -e "\nTest 7: Deleting second friend request"
# DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/$SECOND_REQUEST_ID")
# print_result $? "Deleted friend request"
# echo "Response: $DELETE_RESPONSE"

# # Test 8: Try to approve deleted request (should fail)
# echo -e "\nTest 8: Attempting to approve deleted request"
# APPROVE_DELETED=$(curl -s -X PUT "$BASE_URL/$SECOND_REQUEST_ID/approve")
# echo "Response: $APPROVE_DELETED"
# echo $APPROVE_DELETED | grep -q "Friend request not found"
# print_result $? "Approving deleted request properly rejected"

echo -e "\nFriend Request API Tests Completed"
echo "=================================="