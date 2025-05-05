interface ChatMessage {
    sender_id: string;
    receiver_id?: string;  // Optional for group chats
    text: string;
    timestamp?: string;
    chatroom_id: string;
  }
  
interface WebSocketMessage {
    type: 'message' | 'error' | 'notification';
    payload: ChatMessage | string;
  }
  
interface ExternalAPIMessage {
    sender_id: string;
    receiver_id: string;
    text: string;
  }

 interface NotificationPayload {
    type: string;
    content: string;
    receiver?: string;
    sender?: string;
    metadata?: Record<string, any>;
    timestamp: Date;
  }