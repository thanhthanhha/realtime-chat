export interface User {
  id: string;           // hash_key
  name: string;         // used in NameIndex GSI
  email: string;        // used in EmailIndex GSI
  user_id: string;      // used in UserIdIndex GSI
  image?: string;       // optional since not in schema
  password?: string;
  password_salt?: string;
  friendlist_id: string[];
}

export interface Chat {
  id: string;           // hash_key
  chat_owner: string;   // used in ChatOwnerIndex GSI - Note: changed from string[] to string
  messages?: string[];  // optional since not in schema
  participants: string[];
  chatroom_name?: string;
}

export interface Message {
  id: string;           // hash_key
  chatroom_id: string;  // used in ChatroomIndex GSI
  sender_id: string;    // used in SenderIndex GSI - Note: changed from senderId to sender_id
  receiver_id: string;  // used in ReceiverIndex GSI - Note: changed from receiverId to receiver_id
  text?: string;        // optional since not in schema
  timestamp?: string;   // optional since not in schema
}

export interface FriendRequest {
  id: string;           // hash_key
  sender_id: string;    // used in SenderIndex GSI - Note: changed from senderId to sender_id
  receiver_id: string;  // used in ReceiverIndex GSI - Note: changed from receiverId to receiver_id
  sender_name?: string;
  approved: boolean;
}