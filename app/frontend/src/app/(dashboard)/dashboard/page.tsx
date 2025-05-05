import { serverApi } from '@/lib/axios'
import { Chat, Message } from '@/types/typings'
import { ChevronRight } from 'lucide-react'
import { auth } from "@/auth"
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getUserParticipatingChats } from '@/lib/buttonactions'

const Page = async () => {
  const session = await auth()
  if (!session) notFound()

  try {
    // Fetch all chats where the current user is a participant
    const response = await getUserParticipatingChats(session.user.id)
    //console.log(`check ${response}`)
    const chats = response.data

    // Early return if no chats found
    if (!chats || chats.length === 0) {
      return (
        <div className='container py-12'>
          <h1 className='font-bold text-5xl mb-8'>Recent chats</h1>
          <p className='text-sm text-zinc-500'>Nothing to show here...</p>
        </div>
      )
    }

    // Process each chat to get the other participant's info
    const chatDetails = await Promise.all(chats.map(async (chat) => {
      // Get the other participant's ID (not the current user)
      const otherParticipantId = chat.participants.find(id => id !== session.user.id)
      
      if (!otherParticipantId) {
        return null
      }

      try {
        // Fetch the other participant's user details
        const userResponse = await serverApi.get(`/api/users/${otherParticipantId}`)
        const otherUser = userResponse.data

        // Get the latest message from the chat
        const messagesResponse = await serverApi.get(`/api/message/chatroom/${chat.id}/messages`)
        const messages = messagesResponse.data
        const lastMessage = messages[messages.length - 1] || null

        return {
          chatId: chat.id,
          participant: otherUser,
          lastMessage
        }
      } catch (error) {
        console.error('Error fetching chat details:', error)
        return null
      }
    }))

    // Filter out any null results and sort by latest message
    const validChatDetails = chatDetails
      .filter(chat => chat !== null)
      .sort((a, b) => {
        if (!a?.lastMessage?.timestamp || !b?.lastMessage?.timestamp) return 0
        return b.lastMessage.timestamp - a.lastMessage.timestamp
      })

    return (
      <div className='container py-12'>
        <h1 className='font-bold text-5xl mb-8'>Recent chats</h1>
        {validChatDetails.length === 0 ? (
          <p className='text-sm text-zinc-500'>Nothing to show here...</p>
        ) : (validChatDetails.map((chat) => (
          <div
            key={chat?.chatId}
            className='relative bg-zinc-50 border border-zinc-200 p-3 rounded-md mb-4'>
            <div className='absolute right-4 inset-y-0 flex items-center'>
              <ChevronRight className='h-7 w-7 text-zinc-400' />
            </div>

            <Link
              href={`/dashboard/chat/${chat?.chatId}`}
              className='relative sm:flex'>
              <div className='mb-4 flex-shrink-0 sm:mb-0 sm:mr-4'>
                <div className='relative h-6 w-6'>
                  <Image
                    referrerPolicy='no-referrer'
                    className='rounded-full'
                    alt={`${chat?.participant.name} profile picture`}
                    src={'/static/default_img.png'}
                    fill
                  />
                </div>
              </div>

              <div>
                <h4 className='text-lg font-semibold'>{chat?.participant.name}</h4>
                {chat?.lastMessage && (
                  <p className='mt-1 max-w-md'>
                    <span className='text-zinc-400'>
                      {chat.lastMessage.sender_id === session.user.id ? 'You: ' : ''}
                    </span>
                    {chat.lastMessage.text}
                  </p>
                )}
              </div>
            </Link>
          </div>
        )))}
      </div>
    )
  } catch (error) {
    console.error('Error fetching chats:', error)
    return (
      <div className='container py-12'>
        <h1 className='font-bold text-5xl mb-8'>Recent chats</h1>
        <p className='text-sm text-red-500'>Error loading chats. Please try again later.</p>
      </div>
    )
  }
}

export default Page