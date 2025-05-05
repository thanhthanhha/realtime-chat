import axios, { AxiosError } from 'axios';
import { ExternalAPIMessage } from '../types/models';
import Logger from '../utils/logger';

const MODULE_NAME = 'APIService';

export const processMessage = async (
  chatroomId: string,
  message: ExternalAPIMessage
): Promise<void> => {
  const apiUrl = `${process.env.EXTERNAL_API_URL}/api/chat/${chatroomId}/messages`;
  
  Logger.info(
    MODULE_NAME,
    `Processing message for chatroom ${chatroomId} from ${message.sender_id} to ${message.receiver_id || 'all'}`
  );

  try {
    Logger.debug(
      MODULE_NAME,
      `Sending request to external API: ${apiUrl}\nPayload: ${JSON.stringify(message)}`
    );

    const startTime = Date.now();
    await axios.post(apiUrl, message, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const duration = Date.now() - startTime;
    Logger.info(
      MODULE_NAME,
      `Successfully processed message through external API (${duration}ms)`
    );

  } catch (error) {
    const axiosError = error as AxiosError;
    
    Logger.error(
      MODULE_NAME,
      `Failed to process message through external API:
      Status: ${axiosError.response?.status}
      URL: ${apiUrl}
      Response: ${JSON.stringify(axiosError.response?.data)}`,
      axiosError
    );

    if (axiosError.response?.status === 429) {
      Logger.warn(MODULE_NAME, 'Rate limit exceeded for external API');
    }

    throw new Error('Failed to process message through external API');
  }
};