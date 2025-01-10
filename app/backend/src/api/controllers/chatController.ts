import { Request, Response } from 'express';
import { ChatRepository } from '@/db/repositories/chatRepository';
import { MessageRepository } from '@/db/repositories/messageRepository';

export class ChatController {
  private chatRepository: ChatRepository;
  private messageRepository: MessageRepository;

  constructor() {
    this.chatRepository = new ChatRepository();
    this.messageRepository = new MessageRepository();
  }

  async createChat(req: Request, res: Response): Promise<void> {
    try {
      const chatData = {
        messages: [],
        chat_owner: req.body.chat_owner
      };

      const chat = await this.chatRepository.createChat(chatData);
      res.status(201).json(chat);
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({ error: 'Failed to create chat' });
    }
  };

  async getChatById(req: Request, res: Response): Promise<void> {
    try {
      const chat = await this.chatRepository.getChatById(req.params.id);
      
      if (!chat) {
        res.status(404).json({ error: 'Chat not found' });
        return;
      }

      res.json(chat);
    } catch (error) {
      console.error('Error getting chat:', error);
      res.status(500).json({ error: 'Failed to get chat' });
    }
  };

  async getChatsByUserId(req: Request, res: Response): Promise<void> {
    try {
      const chats = await this.chatRepository.getChatsByUserId(req.params.userId);
      res.json(chats);
    } catch (error) {
      console.error('Error getting user chats:', error);
      res.status(500).json({ error: 'Failed to get user chats' });
    }
  };

  async deleteChat(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.chatRepository.deleteChat(req.params.id);
      
      if (!success) {
        res.status(404).json({ error: 'Chat not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({ error: 'Failed to delete chat' });
    }
  };


}