'use client'

import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import Image from 'next/image'
import { FC, useRef, useMemo } from 'react'
import { useWebSocketMessages } from './WebSocketMessageWrapper'

interface MessagesProps {
  session: Session;
  chatPartners: User[];
}

const Messages: FC<MessagesProps> = ({
  session,
  chatPartners
}) => {
  const { messages: unsortedMessages } = useWebSocketMessages();
  const scrollDownRef = useRef<HTMLDivElement | null>(null);
  const sessionId = session.user.id;
  const sessionUserName = session.user.name;

  const messages = useMemo(() => {
    return [...unsortedMessages].sort((a, b) => {
      // Convert to number if it's a string
      const timestampA = typeof a.timestamp === 'string' ? Number(a.timestamp) : a.timestamp;
      const timestampB = typeof b.timestamp === 'string' ? Number(b.timestamp) : b.timestamp;
      
      // Sort in descending order (newest first)
      return timestampB - timestampA;
    });
  }, [unsortedMessages]);
  
  const partnersMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    // Add all chat partners to the map
    chatPartners.forEach((partner) => {
      map[partner.id] = partner.name;
    });
    
    // Add the current user to the map as well
    map[sessionId] = sessionUserName;
    
    return map;
  }, [chatPartners, sessionId, sessionUserName]);

  const formatTimestamp = (timestamp: number) => {
    // If timestamp is in milliseconds (13 digits), convert to Date object
    // If it's in seconds (10 digits), multiply by 1000 first
    const date = new Date(timestamp);
    
    // Check if the date is valid before formatting
    if (isNaN(date.getTime())) {
      console.log('Invalid timestamp:', timestamp);
      return 'Invalid time';
    }
    
    return format(date, 'HH:mm');
  };

  return (
    <div
      id='messages'
      className='flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch'>
      <div ref={scrollDownRef} />

      {messages.map((message, index) => {
        const isCurrentUser = message.sender_id === sessionId;
        let test = 0

        const hasNextMessageFromSameUser =
          messages[index - 1]?.sender_id === messages[index].sender_id;


        const hasPrevMessageFromSameUser =
          messages[index + 1]?.sender_id === messages[index].sender_id;

        return (
          <div
            className='chat-message'
            key={`${message.id}-${message.timestamp}`}>
            <div
              className={cn('flex items-end', {
                'justify-end': isCurrentUser,
              })}>
              <div
                className={cn(
                  'flex flex-col space-y-2 text-base max-w-xs mx-2',
                  {
                    'order-1 items-end': isCurrentUser,
                    'order-2 items-start': !isCurrentUser,
                  }
                )}>
                {hasPrevMessageFromSameUser ? null : (
                <span className='ml-2 text-xs text-gray-400'>
                    {isCurrentUser ? sessionUserName : partnersMap[message.sender_id]}
                </span>
                )}
                <span
                  className={cn('px-4 py-2 rounded-lg inline-block', {
                    'bg-indigo-600 text-white': isCurrentUser,
                    'bg-gray-200 text-gray-900': !isCurrentUser,
                    'rounded-br-none':
                      !hasNextMessageFromSameUser && isCurrentUser,
                    'rounded-bl-none':
                      !hasNextMessageFromSameUser && !isCurrentUser,
                  })}>
                  {message.text}{' '}
                  <span className='ml-2 text-xs text-gray-400'>
                    {`${formatTimestamp(Number(message.timestamp))}`}
                  </span>
                </span>
              </div>

              <div
                className={cn('relative w-6 h-6', {
                  'order-2': isCurrentUser,
                  'order-1': !isCurrentUser,
                  invisible: hasNextMessageFromSameUser,
                })}>
                <Image
                  fill
                  src={
                    isCurrentUser ? '/static/default_img.png' : '/static/default_img.png'
                  }
                  alt='Profile picture'
                  referrerPolicy='no-referrer'
                  className='rounded-full'
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Messages;