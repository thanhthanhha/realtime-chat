import { Request, Response } from 'express';
import { MessageRepository } from '@/db/repositories/messageRepository';
import { Message } from '@/types/models';

export class MessageController {
  private messageRepository: MessageRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
  }

  async createMessage(req: Request, res: Response): Promise<void> {
    try {
      const chatroom_id = req.params.chatroom_id;
      const { senderId, receiverId, text } = req.body
      const messageData: Omit<Message, 'id'> = {
        senderId: senderId,
        receiverId: receiverId,
        chatroom_id: chatroom_id,
        text: text,
        timestamp: Date.now()
      };

      const message = await this.messageRepository.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create message' });
    }
  }

  async getMessageById(req: Request, res: Response): Promise<void> {
    try {
      const messageId = req.params.id;
      const message = await this.messageRepository.getMessageById(messageId);

      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      res.status(200).json(message);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve message' });
    }
  }

  async getMessagesBySenderId(req: Request, res: Response): Promise<void> {
    try {
      const senderId = req.params.senderId;
      const messages = await this.messageRepository.getMessagesBySenderId(senderId);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }

  async getMessagesByReceiverId(req: Request, res: Response): Promise<void> {
    try {
      const receiverId = req.params.receiverId;
      const messages = await this.messageRepository.getMessagesByReceiverId(receiverId);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }

  async getMessagesByChatroomId(req: Request, res: Response): Promise<void> {
    try {
      const chatroomId = req.params.chatroomId;
      const messages = await this.messageRepository.getMessagesByChatroomId(chatroomId);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }

  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const messageId = req.params.id;
      const success = await this.messageRepository.deleteMessage(messageId);

      if (!success) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete message' });
    }
  }
}