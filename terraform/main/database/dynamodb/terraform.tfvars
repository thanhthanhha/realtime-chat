

common_config = {
    table_class                 = "STANDARD"
    deletion_protection_enabled = false
    stream_enabled             = true
    stream_view_type           = "NEW_AND_OLD_IMAGES"
    billing_mode               = "PAY_PER_REQUEST"
}

# Define all tables
tables = {
    users = {
        name     = "users"
        hash_key = "id"
        attributes = [
            {
                name = "id"
                type = "S"
            },
            {
                name = "name"
                type = "S"
            },
            {
                name = "email"
                type = "S"
            },
            {
                name = "user_id"
                type = "S"
            },
            # {
            #     name = "password"
            #     type = "S"
            # },
        ]
        global_secondary_indexes = [
            {
                name             = "NameIndex"
                hash_key         = "name"
                projection_type  = "ALL"
            },
            {
                name             = "EmailIndex"
                hash_key         = "email"
                projection_type  = "ALL"
            },
            {
                name             = "UserIdIndex"
                hash_key         = "user_id"
                projection_type  = "ALL"
            }
        ]
        tags = {
            Environment = "production"
            Service     = "user-management"
        }
    }

    chats = {
        name     = "chats"
        hash_key = "id"
        attributes = [
            {
                name = "id"
                type = "S"
            },
            {
                name = "chat_owner"
                type = "S"
            }
        ]
        global_secondary_indexes = [
            {
                name             = "ChatOwnerIndex"
                hash_key         = "chat_owner"
                projection_type  = "ALL"
            }
        ]
        tags = {
            Environment = "production"
            Service     = "chat-service"
        }
    }

    messages = {
        name     = "messages"
        hash_key = "id"
        range_key = "timestamp" 
        attributes = [
            {
                name = "id"
                type = "S"
            },
            {
                name = "chatroom_id"
                type = "S"
            },
            {
                name = "sender_id"
                type = "S"
            },
            {
                name = "receiver_id"
                type = "S"
            },
            {
                name = "timestamp"
                type = "S"  # Using string for ISO format timestamps
            }
        ]
        global_secondary_indexes = [
            {
                name             = "ChatroomIndex"
                hash_key         = "chatroom_id"
                projection_type  = "ALL"
            },
            {
                name             = "SenderIndex"
                hash_key         = "sender_id"
                projection_type  = "ALL"
            },
            {
                name             = "ReceiverIndex"
                hash_key         = "receiver_id"
                projection_type  = "ALL"
            }
            ,
            {
                name             = "TimeStampIndex"
                hash_key         = "timestamp"
                projection_type  = "ALL"
            }
        ]
        tags = {
            Environment = "production"
            Service     = "messaging-service"
        }
    }

    friend_requests = {
        name     = "friend_requests"
        hash_key = "id"
            attributes = [
            {
                name = "id"
                type = "S"
            },
            {
                name = "sender_id"
                type = "S"
            },
            {
                name = "receiver_id"
                type = "S"
            }
        ]
        global_secondary_indexes = [
            {
                name             = "SenderIndex"
                hash_key         = "sender_id"
                projection_type  = "ALL"
            },
            {
                name             = "ReceiverIndex"
                hash_key         = "receiver_id"
                projection_type  = "ALL"
            }
        ]
        tags = {
            Environment = "production"
            Service     = "friend-service"
        }
    }
}
