import express from 'express';
import { MessageController } from '@/api/controllers/messageController';

const router = express.Router();
const messageController = new MessageController();

// Create a new message in a chatroom
router.post('/chatroom/:chatroom_id/messages',messageController.createMessage);

// Get a specific message by ID
router.get('/:id',messageController.getMessageById);

// Get all messages for a sender
router.get('/sender/:sender_id',messageController.getMessagesBySenderId);

// Get all messages for a receiver
router.get('/receiver/:receiver_id',messageController.getMessagesByReceiverId);

// Get all messages in a chatroom
router.get('/chatroom/:chatroom_id/messages',messageController.getMessagesByChatroomId);

// Delete a specific message
router.delete('/:id',messageController.deleteMessage);

export default router;