


  export interface ChatMessage {
    sender_id: string;
    receiver_id?: string;  // Optional for group chats
    text: string;
    timestamp?: string;
    chatroom_id: string;
  }
  
export interface WebSocketMessage {
    type: 'message' | 'error' | 'notification';
    payload: ChatMessage | string | NotificationPayload;
  }
  
export interface ExternalAPIMessage {
    sender_id: string;
    receiver_id: string;
    text: string;
  }

 export interface NotificationPayload {
    type: string;
    content: string;
    receiver?: string;
    sender?: string;
    metadata?: Record<string, any>;
    timestamp: Date;
  }

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // in milliseconds
  backoffMultiplier: number;
}

