import dotenv from 'dotenv';
dotenv.config();

export const TableNames = {
  CHAT_TABLE: process.env.DYNAMODB_CHAT_TABLE || 'chats',
  USER_TABLE: process.env.DYNAMODB_USER_TABLE || 'users',
  MESSAGE_TABLE: process.env.DYNAMODB_MESSAGE_TABLE || 'messages',
  FRIEND_REQUEST_TABLE: process.env.DYNAMODB_FRIEND_REQUEST_TABLE || 'friend_requests',
};