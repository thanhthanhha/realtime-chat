import { getChannel } from '../config/rabbitmq';
import { ChatMessage,  NotificationPayload } from '../types/models';
import Logger from '../utils/logger';

const MODULE_NAME = 'RabbitMQService';

export const assertChatroomQueue = async (chatroomId: string): Promise<void> => {
  const queueName = `chatroom_${chatroomId}_queue`;
  const channel = getChannel();
  
  Logger.debug('RabbitMQService', `Attempting to assert queue: ${queueName}`);
  
  try {
      await channel.assertQueue(queueName, {
          durable: true,
          deadLetterExchange: 'dlx_exchange',
          deadLetterRoutingKey: 'dlx_routing_key'
      });
      Logger.info('RabbitMQService', `Queue ${queueName} successfully asserted`);

      // Bind the queue to the exchange
      Logger.debug('RabbitMQService', `Binding queue ${queueName} to exchange 'chat_exchange' with routing key ${chatroomId}`);
      await channel.bindQueue(queueName, 'chat_exchange', chatroomId);
      Logger.info('RabbitMQService', `Queue ${queueName} successfully bound to exchange`);
  } catch (error) {
      Logger.error(
          'RabbitMQService', 
          `Failed to assert/bind queue ${queueName}`,
          error instanceof Error ? error : new Error('Unknown error')
      );
      throw error;
  }
};

export const publishMessage = async (chatroomId: string, message: ChatMessage): Promise<void> => {
    const channel = getChannel();
    const queueName = `chatroom_${chatroomId}_queue`;
  
    Logger.debug(
      MODULE_NAME, 
      `Asserting queue for chatroom ${chatroomId}: ${queueName}`
    );

    try {
      await assertChatroomQueue(chatroomId);

      Logger.debug(
        MODULE_NAME,
        `Publishing message to exchange 'chat_exchange' for chatroom ${chatroomId}\nMessage: ${JSON.stringify(message)}`
      );
  
      channel.publish(
        'chat_exchange',
        chatroomId,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      Logger.info(
        MODULE_NAME,
        `Successfully published message from ${message.sender_id} to chatroom ${chatroomId}`
      );

    } catch (error) {
      Logger.error(
        MODULE_NAME,
        `Failed to publish message to queue ${queueName}`,
        error as Error
      );
      throw error;
    }
};



export const consumeMessages = async (chatroomId: string, callback: (message: ChatMessage) => void): Promise<void> => {
  const channel = getChannel();
  const queueName = `chatroom_${chatroomId}_queue`;
  await assertChatroomQueue(chatroomId);
  
  Logger.info(MODULE_NAME, `Setting up consumer for chatroom ${chatroomId}`);

  channel.consume(queueName, (msg) => {
    if (msg) {
      try {
        Logger.debug(
          MODULE_NAME,
          `Received message from queue ${queueName}: ${msg.content.toString()}`
        );

        const message: ChatMessage = JSON.parse(msg.content.toString());
        callback(message);
        channel.ack(msg);

        Logger.debug(
          MODULE_NAME,
          `Successfully processed and acknowledged message for chatroom ${chatroomId}`
        );

      } catch (error) {
        Logger.error(
          MODULE_NAME,
          `Error processing message from queue ${queueName}`,
          error as Error
        );
        
        channel.nack(msg);
        Logger.warn(
          MODULE_NAME,
          `Message negatively acknowledged and requeued for chatroom ${chatroomId}`
        );
      }
    } else {
      Logger.warn(MODULE_NAME, `Received null message from queue ${queueName}`);
    }
  });

  Logger.info(
    MODULE_NAME,
    `Consumer setup completed for chatroom ${chatroomId}`
  );
};

export const assertNotifQueue = async (userId: string): Promise<void> => {
  const queueName = `notification_${userId}_queue`;
  const channel = getChannel();
  
  Logger.debug('RabbitMQService', `Attempting to assert queue: ${queueName}`);
  
  try {
      await channel.assertQueue(queueName, {
          durable: true,
          deadLetterExchange: 'dlx_exchange',
          deadLetterRoutingKey: 'dlx_routing_key'
      });
      Logger.info('RabbitMQService', `Queue ${queueName} successfully asserted`);

      // Bind the queue to the exchange
      Logger.debug('RabbitMQService', `Binding queue ${queueName} to exchange 'notification_exchange' with routing key ${userId}`);
      await channel.bindQueue(queueName, 'notification_exchange', userId);
      Logger.info('RabbitMQService', `Queue ${queueName} successfully bound to exchange`);
  } catch (error) {
      Logger.error(
          'RabbitMQService', 
          `Failed to assert/bind queue ${queueName}`,
          error instanceof Error ? error : new Error('Unknown error')
      );
      throw error;
  }
};

export const publishNotification = async (userId: string, payload: NotificationPayload): Promise<void> => {
  const channel = getChannel();
  const queueName = `notification_${userId}_queue`;

  Logger.debug(
    MODULE_NAME, 
    `Asserting queue for notification of user ${userId}: ${queueName}`
  );

  try {
    await assertNotifQueue(userId);

    Logger.debug(
      MODULE_NAME,
      `Publishing notification to exchange 'notification_exchange' for user ${userId}\nPayload: ${JSON.stringify(payload)}`
    );

    channel.publish(
      'notification_exchange',
      userId,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );

    Logger.info(
      MODULE_NAME,
      `Successfully published notification for user ${userId}`
    );

  } catch (error) {
    Logger.error(
      MODULE_NAME,
      `Failed to publish notification to queue ${queueName}`,
      error as Error
    );
    throw error;
  }
};

export const consumeNotification = async (userId: string, callback: (payload: NotificationPayload) => void): Promise<void> => {
  const channel = getChannel();
  const queueName = `notification_${userId}_queue`;
  await assertNotifQueue(userId);

  Logger.info(MODULE_NAME, `Setting up notification consumer for user ${userId}`);

  channel.consume(queueName, (msg) => {
    if (msg) {
      try {
        Logger.debug(
          MODULE_NAME,
          `Received notification from queue ${queueName}: ${msg.content.toString()}`
        );

        const payload = JSON.parse(msg.content.toString());
        callback(payload);
        channel.ack(msg);

        Logger.debug(
          MODULE_NAME,
          `Successfully processed and acknowledged notification for user ${userId}`
        );

      } catch (error) {
        Logger.error(
          MODULE_NAME,
          `Error processing notification from queue ${queueName}`,
          error as Error
        );
        
        channel.nack(msg);
        Logger.warn(
          MODULE_NAME,
          `Notification negatively acknowledged and requeued for user ${userId}`
        );
      }
    } else {
      Logger.warn(MODULE_NAME, `Received null notification from queue ${queueName}`);
    }
  });

  Logger.info(
    MODULE_NAME,
    `Notification consumer setup completed for user ${userId}`
  );
};

export const setupDlxConsumer = () => {
    const channel = getChannel();
    Logger.info(MODULE_NAME, 'Setting up Dead Letter Exchange consumer');

    channel.consume('dlx_queue', (msg) => {
      if (msg) {
        try {
          const deadLetteredMessage = msg.content.toString();
          Logger.error(
            MODULE_NAME,
            `Processing dead lettered message: ${deadLetteredMessage}`
          );

          // Add your DLX handling logic here
          channel.ack(msg);
          
          Logger.debug(
            MODULE_NAME,
            'Dead lettered message acknowledged'
          );
        } catch (error) {
          Logger.error(
            MODULE_NAME,
            'Error processing dead lettered message',
            error as Error
          );
          // Still ack the message to prevent infinite loop
          channel.ack(msg);
        }
      } else {
        Logger.warn(MODULE_NAME, 'Received null message in DLX queue');
      }
    });

    Logger.info(MODULE_NAME, 'Dead Letter Exchange consumer setup completed');
};