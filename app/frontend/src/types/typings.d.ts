import { Icon } from "@/components/Icons"

interface SidebarOption {
  id: number
  name: string
  href: string
  Icon: Icon
}

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

declare interface User {
  id: string;           // hash_key
  name: string;         // used in NameIndex GSI
  email: string;        // used in EmailIndex GSI
  user_id: string;      // used in UserIdIndex GSI
  image?: string;       // optional since not in schema
  password?: string;
  password_salt?: string;
  friendlist_id: string[];
}

interface Chat {
  id: string;           // hash_key
  chat_owner: string;   // used in ChatOwnerIndex GSI - Note: changed from string[] to string
  messages?: string[];  // optional since not in schema
  participants: string[];
}


interface ChatRoom {
  id: string;           // hash_key
  chat_owner: string;   // used in ChatOwnerIndex GSI - Note: changed from string[] to string
  messages?: Message[];  // optional since not in schema
  participants: string[];
}

interface Message {
  id: string;           // hash_key
  chatroom_id: string;  // used in ChatroomIndex GSI
  sender_id: string;    // used in SenderIndex GSI - Note: changed from senderId to sender_id
  receiver_id: string;  // used in ReceiverIndex GSI - Note: changed from receiverId to receiver_id
  text?: string;        // optional since not in schema
  timestamp?: number;   // optional since not in schema
}

interface FriendRequestItem {
  id: string;           // hash_key
  sender_id: string;    // used in SenderIndex GSI - Note: changed from senderId to sender_id
  receiver_id: string;  // used in ReceiverIndex GSI - Note: changed from receiverId to receiver_id
  approved: boolean;
  metadata?: any;
}

export interface NotificationPayload {
  type: string;
  content: string;
  receiver?: string;
  sender?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}