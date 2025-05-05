'use client'


import { chatHrefConstructor } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import UnseenChatToast from './UnseenChatToast'
import { createChat } from '@/lib/buttonactions'
import { MessageSquareDiff } from 'lucide-react';
import Image from 'next/image';

interface SidebarChatListProps {
  friends: User[]
  sessionId: string,
  chatrooms: Chat[],
}

interface ExtendedMessage extends Message {
  senderImg: string
  senderName: string
}

interface EmptyChat {
  id: string,
  name: ''
}

interface ActiveChat {
  partner: User[],
  chatroom: Chat,
  type: string,
}


const SidebarChatList: FC<SidebarChatListProps> = ({ friends, sessionId, chatrooms }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [unseenMessages, setUnseenMessages] = useState<Message[]>([])
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([])
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({})

  // Process chatrooms and map them to active chats
  useEffect(() => {
    const processChats = () => {
      if (!friends.length) return
      
      const chats: ActiveChat[] = []
      const processedFriendIds: string[] = []
      
      // Go through each chatroom
      if (chatrooms && chatrooms.length > 0) {
        chatrooms.forEach((chatroom) => {
          // Find the participant that isn't the current user
          const partnerIds = chatroom.participants.filter(id => id !== sessionId)
          const chatroom_participants: User[] = [] 
          
          // For each partner in this chatroom
          partnerIds.forEach(partnerId => {
            // Find the friend object for this partner
            const partner = friends.find(friend => friend.id === partnerId)
            
            if (!partner) return // Skip if partner isn't in friends list
            
            chatroom_participants.push(partner)
            
            // Track processed friend IDs
            processedFriendIds.push(partnerId)
          })

          chats.push({
            partner: chatroom_participants,
            chatroom,
            type: 'link',
          })
        })
      }
      
      // Add unprocessed friends with EmptyChat objects
      friends.forEach(friend => {
        if (!processedFriendIds.includes(friend.id)) {
          // Create EmptyChat for this friend
          const emptyChat: EmptyChat = {
            id: `${friend.id}`,
            name: ''
          }
          
          chats.push({
            partner: [friend],
            chatroom: emptyChat as unknown as Chat,
            type: 'create'
          })
        }
      })

      setActiveChats(chats)
    }
    
    processChats()
  }, [friends, chatrooms, sessionId])

  useEffect(() => {
    if (pathname?.includes('chat')) {
      setUnseenMessages((prev) => {
        return prev.filter((msg) => !pathname.includes(msg.senderId))
      })
    }
  }, [pathname])


  const handleCreateChat = async (friendId: string) => {
    try {
      setIsLoading(prev => ({ ...prev, [friendId]: true }))
      
      // Create the participants array with both user IDs
      const participants = [sessionId, friendId]
      
      // Call the createChat action
      const result = await createChat(sessionId, participants, null)
      
      if (result.success) {
        toast.success('Chat created successfully!')
        // Navigate to the new chat room
        router.push(`/dashboard/chat/${result.data.id}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to create chat')
      }
    } catch (error) {
      console.error('Failed to create chat:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(prev => ({ ...prev, [friendId]: false }))
    }
  }

  return (
    <ul role='list' className='max-h-[25rem] overflow-y-auto -mx-2 space-y-1'>
      {activeChats.sort().map((chatMap) => {
        if (chatMap.type === 'create') {
          const friend = chatMap.partner[0]
          return (
            <li key={friend.id}>
              <div className='text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center justify-between gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'>
                <span>{friend.name}</span>
                <button
                  onClick={() => handleCreateChat(friend.id)}
                  disabled={isLoading[friend.id]}
                  className='ml-auto bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded-md text-xs font-medium transition flex items-center justify-center h-6 w-8'
                >
                  {isLoading[friend.id] ? 
                    <div className="relative h-4 w-4">
                      <Image
                        src='/static/loading.gif'
                        alt='Loading'
                        fill
                        referrerPolicy='no-referrer'
                        className='object-contain'
                      />
                    </div> : 
                    <MessageSquareDiff className='h-4 w-4 text-indigo-700' />
                  }
                </button>
              </div>
            </li>
          )
        } else if (chatMap.type === 'link') {
          const unseenMessagesCount = unseenMessages.filter((unseenMsg) => {
            return chatMap.partner.find((partner) => partner.id === unseenMsg.sender_id) ? true : false
          }).length
  
          return (
            <li key={chatMap.chatroom.id}>
              <a
                href={`/dashboard/chat/${chatMap.chatroom.id}`}
                className='text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'>
                {chatMap.chatroom.chatroom_name ? chatMap.chatroom.chatroom_name : chatMap.partner.map((partner) => {
                  return partner.name
                })}
                {unseenMessagesCount > 0 ? (
                  <div className='bg-indigo-600 font-medium text-xs text-white w-4 h-4 rounded-full flex justify-center items-center'>
                    {unseenMessagesCount}
                  </div>
                ) : null}
              </a>
            </li>
          )
        } else {
          console.log('Skip item')
        }




      
      
      
      })}
    </ul>
  )
}

export default SidebarChatList
