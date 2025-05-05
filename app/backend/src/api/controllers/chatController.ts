import { Request, Response } from 'express';
import { ChatRepository } from '@/db/repositories/chatRepository';
import { Message } from '../../types/models';
import { MessageRepository } from '@/db/repositories/messageRepository';
import { UserRepository } from '@/db/repositories/userRepository';
import Logger from '@/utils/logger';

export class ChatController {
  private chatRepository: ChatRepository;
  private messageRepository: MessageRepository;
  private userRepository = new UserRepository();
  private readonly MODULE_NAME = 'ChatController';

  constructor() {
    Logger.debug(this.MODULE_NAME, 'Initializing ChatController');
    this.chatRepository = new ChatRepository();
    this.messageRepository = new MessageRepository();
    this.userRepository = new UserRepository();

    this.createChat = this.createChat.bind(this);
    this.getChatById = this.getChatById.bind(this);
    this.getChatsByUserId = this.getChatsByUserId.bind(this);
    this.deleteChat = this.deleteChat.bind(this);
    this.getChatsByParticipantId = this.getChatsByParticipantId.bind(this);
    this.addParticipantToChat = this.addParticipantToChat.bind(this);
    this.addMessageToChat = this.addMessageToChat.bind(this);
  }

  async createChat(req: Request, res: Response): Promise<void> {
    const chatOwner = req.body.chat_owner;
    Logger.info(this.MODULE_NAME, `Attempting to create chat for owner: ${chatOwner}`);
    
    try {
      let chatName = req.body.chatroom_name;

      const chatData = {
        messages: [],
        chat_owner: chatOwner,
        participants: req.body.participants,
        chatroom_name: chatName
      };
      
      const chat = await this.chatRepository.createChat(chatData);
      Logger.info(this.MODULE_NAME, `Successfully created chat with ID: ${chat.id}`);
      res.status(201).json(chat);
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to create chat: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
      res.status(500).json({ error: 'Failed to create chat' });
    }
  }

  async getChatById(req: Request, res: Response): Promise<void> {
    const chatId = req.params.id;
    Logger.info(this.MODULE_NAME, `Attempting to retrieve chat with ID: ${chatId}`);
    
    try {
      const chat = await this.chatRepository.getChatById(chatId);
      
      if (!chat) {
        Logger.warn(this.MODULE_NAME, `Chat not found with ID: ${chatId}`);
        res.status(404).json({ error: 'Chat not found' });
        return;
      }
      
      let messages: Message[] = [];
      if (chat.messages?.length && chat.messages?.length > 0) {
        // If getMessagesByChatroomId returns a Promise for a single message
        messages = await this.messageRepository.getMessagesByChatroomId(chatId);
        
        Logger.info(this.MODULE_NAME, `Successfully retrieved chat messages with ID: ${chatId} length is ${messages.length}`);
      }
      
      Logger.info(this.MODULE_NAME, `Successfully retrieved chat with ID: ${chatId}`);
      
      // Return chat with extended messages
      res.json({
        ...chat,
        messages: messages
      });
      
    } catch (error) {
      Logger.error(
        this.MODULE_NAME, 
        `Error retrieving chat ${chatId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        error instanceof Error ? error : undefined
      );
      res.status(500).json({ error: 'Failed to get chat' });
    }
  }

  async getChatsByUserId(req: Request, res: Response): Promise<void> {
    const userId = req.params.user_id;
    Logger.info(this.MODULE_NAME, `Attempting to retrieve chats for user ID: ${userId}`);

    try {
      const chats = await this.chatRepository.getChatsByUserId(userId);
      Logger.info(this.MODULE_NAME, `Successfully retrieved ${chats.length} chats for user ID: ${userId}`);
      res.json(chats);
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Error retrieving chats for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
      res.status(500).json({ error: 'Failed to get user chats' });
    }
  }

  async deleteChat(req: Request, res: Response): Promise<void> {
    const chatId = req.params.id;
    Logger.info(this.MODULE_NAME, `Attempting to delete chat with ID: ${chatId}`);

    try {
      const success = await this.chatRepository.deleteChat(chatId);
      
      if (!success) {
        Logger.warn(this.MODULE_NAME, `Chat not found for deletion with ID: ${chatId}`);
        res.status(404).json({ error: 'Chat not found' });
        return;
      }

      Logger.info(this.MODULE_NAME, `Successfully deleted chat with ID: ${chatId}`);
      res.status(204).send();
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Error deleting chat ${chatId}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
      res.status(500).json({ error: 'Failed to delete chat' });
    }
  }

  async getChatsByParticipantId(req: Request, res: Response): Promise<void> {
    const participantId = req.params.participantId;
    Logger.info(this.MODULE_NAME, `Attempting to retrieve chats for participant ID: ${participantId}`);

    try {
      const chats = await this.chatRepository.getChatsByParticipantId(participantId);
      Logger.info(this.MODULE_NAME, `Successfully retrieved ${chats.length} chats for participant ID: ${participantId}`);
      res.json(chats);
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Error retrieving chats for participant ${participantId}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
      res.status(500).json({ error: 'Failed to get participant chats' });
    }
  }
  
  async addParticipantToChat(req: Request, res: Response): Promise<void> {
    const { chatId, participantId } = req.body;
    Logger.info(this.MODULE_NAME, `Attempting to add participant ${participantId} to chat ${chatId}`);

    try {
      const updatedChat = await this.chatRepository.addParticipantToChat(chatId, participantId);
      
      if (!updatedChat) {
        Logger.warn(this.MODULE_NAME, `Chat not found when adding participant ${participantId} to chat ${chatId}`);
        res.status(404).json({ error: 'Chat not found' });
        return;
      }

      Logger.info(this.MODULE_NAME, `Successfully added participant ${participantId} to chat ${chatId}`);
      res.json(updatedChat);
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Error adding participant ${participantId} to chat ${chatId}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
      res.status(500).json({ error: 'Failed to add participant to chat' });
    }
  }

  async addMessageToChat(req: Request, res: Response): Promise<void> {
    
    try {
      const chatId = req.params.id;
      const { sender_id, receiver_id, text } = req.body;
      
      Logger.info(this.MODULE_NAME, `Adding message to chat ${chatId} from ${sender_id} to ${receiver_id}`);
  
      // First verify the chat exists
      const chat = await this.chatRepository.getChatById(chatId);
      if (!chat) {
        Logger.warn(this.MODULE_NAME, `Chat not found with ID: ${chatId}`);
        res.status(404).json({ error: 'Chat not found' });
        return;
      }
  
      // Create the message
      const messageData = {
        sender_id,
        receiver_id,
        chatroom_id: chatId,
        text,
        timestamp: `${new Date().getTime()}`
      };
  
      const message = await this.messageRepository.createMessage(messageData);
      Logger.info(this.MODULE_NAME, `Created message with ID: ${message.id}`);
  
      // Add message ID to the chat's messages array
      const messages = Array.isArray(chat.messages) ? chat.messages : [];
      const updatedChat = await this.chatRepository.updateChat(chatId, {
        messages: [...messages, message.id]
      });
  
      if (!updatedChat) {
        Logger.error(this.MODULE_NAME, `Failed to update chat ${chatId} with new message ${message.id}`);
        // Even though chat update failed, message was created, so return 500
        res.status(500).json({ error: 'Failed to update chat with new message' });
        return;
      }
  
      Logger.info(this.MODULE_NAME, `Successfully added message ${message.id} to chat ${chatId}`);
      res.status(201).json({ message, chat: updatedChat });
    } catch (error) {
      Logger.error(this.MODULE_NAME, 'Failed to add message to chat', error as Error);
      res.status(500).json({ error: 'Failed to add message to chat' });
    }
  }
}