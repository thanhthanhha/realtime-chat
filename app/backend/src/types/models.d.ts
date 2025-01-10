export interface User {
    id: string;
    name: string;
    email: string;
    image: string;
    friendlist_id: string[];
  }
  
  export interface Chat {
    id: string;
    messages: string[];
    chat_owner: string[];
  }
  
  export interface Message {
    id: string;
    chatroom_id: string;
    senderId: string;
    receiverId: string;
    text: string;
    timestamp: number;
  }
  
  export interface FriendRequest {
    id: string;
    senderId: string;
    receiverId: string;
  }
