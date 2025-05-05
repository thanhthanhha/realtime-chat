'use client'

import { FC, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import TextareaAutosize from 'react-textarea-autosize'
import Button from './ui/Button'
import { useWebSocketMessages } from './WebSocketMessageWrapper'

interface ChatInputProps {
  chatPartners: User[];
}

const ChatInput: FC<ChatInputProps> = ({ chatPartners }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const { sendMessage, isConnected } = useWebSocketMessages();

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      sendMessage(input.trim());
      setInput('');
      textareaRef.current?.focus();
    } catch (error) {
      toast.error('Something went wrong. Please try again later.');
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='border-t border-gray-200 px-4 pt-4 mb-2 sm:mb-0'>
      <div className='relative flex-1 overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600'>
        <TextareaAutosize
          ref={textareaRef}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${chatPartners.length > 1 ? "Group" : chatPartners[0].name}`}
          className='block w-full resize-none border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:py-1.5 sm:text-sm sm:leading-6'
          disabled={!isConnected}
        />

        <div
          onClick={() => textareaRef.current?.focus()}
          className='py-2'
          aria-hidden='true'>
          <div className='py-px'>
            <div className='h-9' />
          </div>
        </div>

        <div className='absolute right-0 bottom-0 flex justify-between py-2 pl-3 pr-2'>
          <div className='flex-shrin-0'>
            <Button 
              isLoading={isLoading} 
              onClick={handleSendMessage} 
              type='submit'
              disabled={!isConnected}
            >
              Post
            </Button>
          </div>
        </div>
        
        {!isConnected && (
          <div className="absolute bottom-0 left-0 w-full bg-red-100 text-red-800 text-xs px-2 py-1">
            Reconnecting to chat...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;