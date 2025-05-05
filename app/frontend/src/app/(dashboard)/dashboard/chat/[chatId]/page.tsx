import ChatInput from '@/components/ChatInput'
import Messages from '@/components/Messages'
import WebSocketMessageWrapper from '@/components/WebSocketMessageWrapper'
import { auth } from "@/auth"
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { getUserFromCache } from '@/lib/redis/redisUtils'
import { getChatRoomById } from '@/lib/buttonactions'
import logger from '@/lib/logger'
import { User } from '@/types/typings'

const MODULE_NAME = 'ChatPage'

interface PageProps {
  params: Promise<{ chatId: string }>
}

const page = async ({ params }: PageProps) => {
  const chatId = (await params).chatId
  const session = await auth()
  
  if (!session || !session.user) {
    return redirect('/login')
  }

  try {
    // Fetch the chatroom by ID
    const chatroom = await getChatRoomById(chatId)
    
    // If chatroom not found, show 401 error
    if (!chatroom || !chatroom.participants) {
      logger.warn(MODULE_NAME, 'Chatroom not found or invalid', { chatId })
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this chat or it doesnt exist.</p>
        </div>
      )
    }
    
    // Extract chat partners (users who are not the current user)
    const chatPartners = await Promise.all(
      chatroom.participants
        .filter((participantId: string) => participantId !== session.user.id)
        .map(async (participantId: string) => {
          return await getUserFromCache(participantId)
        })
    )
    
    // If no chat partners found, it's likely an error
    if (!chatPartners || chatPartners.length === 0) {
      logger.warn(MODULE_NAME, 'No chat partners found', { chatId, participants: chatroom.participants })
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold mb-4">Chat Error</h2>
          <p className="text-gray-600">Could not find participants for this chat.</p>
        </div>
      )
    }
    
    const initialMessages = chatroom.messages || []
    
    return (
      <div className='flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]'>
        {chatPartners.length === 1 ? (
          // Single chat partner view
          <div className='flex sm:items-center justify-between py-3 border-b-2 border-gray-200'>
            <div className='relative flex items-center space-x-4'>
              <div className='relative'>
                <div className='relative w-8 sm:w-12 h-8 sm:h-12'>
                  <Image
                    fill
                    referrerPolicy='no-referrer'
                    src={'/static/default_img.png'}
                    alt={`${chatPartners[0].name} profile picture`}
                    className='rounded-full'
                  />
                </div>
              </div>
              
              <div className='flex flex-col leading-tight'>
                <div className='text-xl flex items-center'>
                  <span className='text-gray-700 mr-3 font-semibold'>
                    {chatPartners[0].name}
                  </span>
                </div>
                <span className='text-sm text-gray-600'>{chatPartners[0].email}</span>
              </div>
            </div>
          </div>
        ) : (
          // Group chat view
          <div className='flex sm:items-center justify-between py-3 border-b-2 border-gray-200'>
            <div className='relative flex items-center space-x-4'>
              <div className='relative'>
                <div className='relative w-8 sm:w-12 h-8 sm:h-12'>
                  <Image
                    fill
                    referrerPolicy='no-referrer'
                    src='/static/default_img.png'
                    alt='group chat profile picture'
                    className='rounded-full'
                  />
                </div>
              </div>
              
              <div className='flex flex-col leading-tight'>
                <div className='text-xl flex items-center'> 
                  <span className='text-gray-700 mr-3 font-semibold'>
                    {chatPartners.map((user: User) => user.name).join(', ')}
                  </span>
                </div>
                <span className='text-sm text-gray-600 truncate max-w-[200px]'>
                  {chatPartners.map((user: User) => user.email).join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <WebSocketMessageWrapper
          chatId={chatId}
          sessionId={session.user.id}
          initialMessages={initialMessages}
          chatPartners={chatPartners}
        >
          <Messages
            chatPartners={chatPartners}
            session={session}
          />
          <ChatInput chatPartners={chatPartners} />
        </WebSocketMessageWrapper>
      </div>
    )
  } catch (error: any) {
    logger.error(MODULE_NAME, 'Error loading chat page', { 
      chatId, 
      error: {
        message: error.message,
        stack: error.stack
      } 
    })
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-600">We couldn&apos;t load this chat. Please try again later.</p>
      </div>
    )
  }
}

export default page