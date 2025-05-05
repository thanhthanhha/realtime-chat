import { Request, Response } from 'express';
import { MessageRepository } from '@/db/repositories/messageRepository';
import { Message } from '@/types/models';
import Logger from '@/utils/logger';

export class MessageController {
  private messageRepository: MessageRepository;
  private readonly MODULE = 'MessageController';

  constructor() {
    this.messageRepository = new MessageRepository();
    this.createMessage = this.createMessage.bind(this);
    this.getMessageById = this.getMessageById.bind(this);
    this.getMessagesBySenderId = this.getMessagesBySenderId.bind(this);
    this.getMessagesByReceiverId = this.getMessagesByReceiverId.bind(this);
    this.getMessagesByChatroomId = this.getMessagesByChatroomId.bind(this);
    this.deleteMessage = this.deleteMessage.bind(this);
    
    Logger.info(this.MODULE, 'MessageController initialized');
  }

  async createMessage(req: Request, res: Response): Promise<void> {
    try {
      const chatroom_id = req.params.chatroom_id;
      const { sender_id, receiver_id, text } = req.body;
      
      Logger.info(this.MODULE, `Creating message in chatroom ${chatroom_id} from ${sender_id} to ${receiver_id}`);
      
      const messageData: Omit<Message, 'id'> = {
        sender_id,
        receiver_id,
        chatroom_id,
        text,
        timestamp: `${new Date().getTime()}`
      };

      const message = await this.messageRepository.createMessage(messageData);
      Logger.info(this.MODULE, `Message created successfully with ID: ${message.id}`);
      
      res.status(201).json(message);
    } catch (error) {
      Logger.error(this.MODULE, 'Failed to create message', error as Error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  }

  async getMessageById(req: Request, res: Response): Promise<void> {
    try {
      const messageId = req.params.id;
      Logger.info(this.MODULE, `Fetching message with ID: ${messageId}`);

      const message = await this.messageRepository.getMessageById(messageId);
      
      if (!message) {
        Logger.warn(this.MODULE, `Message not found with ID: ${messageId}`);
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      Logger.info(this.MODULE, `Successfully retrieved message: ${messageId}`);
      res.status(200).json(message);
    } catch (error) {
      Logger.error(this.MODULE, `Failed to retrieve message: ${req.params.id}`, error as Error);
      res.status(500).json({ error: 'Failed to retrieve message' });
    }
  }

  async getMessagesBySenderId(req: Request, res: Response): Promise<void> {
    try {
      const sender_id = req.params.sender_id;
      Logger.info(this.MODULE, `Fetching messages for sender: ${sender_id}`);

      const messages = await this.messageRepository.getMessagesBySenderId(sender_id);
      
      Logger.info(this.MODULE, `Retrieved ${messages.length} messages for sender: ${sender_id}`);
      res.status(200).json(messages);
    } catch (error) {
      Logger.error(this.MODULE, `Failed to retrieve messages for sender: ${req.params.sender_id}`, error as Error);
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }

  async getMessagesByReceiverId(req: Request, res: Response): Promise<void> {
    try {
      const receiver_id = req.params.receiver_id;
      Logger.info(this.MODULE, `Fetching messages for receiver: ${receiver_id}`);

      const messages = await this.messageRepository.getMessagesByReceiverId(receiver_id);
      
      Logger.info(this.MODULE, `Retrieved ${messages.length} messages for receiver: ${receiver_id}`);
      res.status(200).json(messages);
    } catch (error) {
      Logger.error(this.MODULE, `Failed to retrieve messages for receiver: ${req.params.receiver_id}`, error as Error);
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }

  async getMessagesByChatroomId(req: Request, res: Response): Promise<void> {
    try {
      const chatroomId = req.params.chatroom_id;
      Logger.info(this.MODULE, `Fetching messages for chatroom: ${chatroomId}`);

      const messages = await this.messageRepository.getMessagesByChatroomId(chatroomId);
      
      Logger.info(this.MODULE, `Retrieved ${messages.length} messages for chatroom: ${chatroomId}`);
      res.status(200).json(messages);
    } catch (error) {
      Logger.error(this.MODULE, `Failed to retrieve messages for chatroom: ${req.params.chatroomId}`, error as Error);
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }

  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const messageId = req.params.id;
      Logger.info(this.MODULE, `Attempting to delete message: ${messageId}`);

      const success = await this.messageRepository.deleteMessage(messageId);
      
      if (!success) {
        Logger.warn(this.MODULE, `Message not found for deletion: ${messageId}`);
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      Logger.info(this.MODULE, `Successfully deleted message: ${messageId}`);
      res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
      Logger.error(this.MODULE, `Failed to delete message: ${req.params.id}`, error as Error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  }
}