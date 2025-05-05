'use client'

import { FC, useState, useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { addFriend } from '@/lib/formactions'
import { useFormState } from "react-dom";
import Button from './ui/Button'
import { Session } from 'next-auth';
import { useWebSocket } from '@/components/WebSocketProvider';
import { metadata } from '@/app/layout';
import { UserRoundPlus } from 'lucide-react';
import Image from 'next/image'

interface AddFriendButtonProps {
  sessionId: string,
  session: Session;
  initialFriends: User[],
  allUsers: User[]
}

const initialState = {
  error: '',
  success: false
}

const AddFriendButton: FC<AddFriendButtonProps> = ({ 
  sessionId = '',
  session ,
  initialFriends = [],
  allUsers = []
}) => {
  const [showSuccessState, setShowSuccessState] = useState<boolean>(false)
  const { sendNotification } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('')
  
  const [state, formAction] = useFormState(addFriend, initialState)

  // Filter users who are not friends and not the current user
  const nonFriendUsers = useMemo(() => {
    const friendIds = initialFriends.map(friend => friend.id)
    return allUsers.filter(user => 
      !friendIds.includes(user.id) && 
      user.id !== sessionId &&
      (!searchTerm || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [allUsers, initialFriends, sessionId, searchTerm])

  // This effect runs when state changes
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    } else if (state?.success) {
      toast.success('Friend request sent successfully!')
      setShowSuccessState(true)

      const friendRequestData = state.data as FriendRequestItem
      
      // Send notification using WebSocket
      if (state.receiverId) {
        console.log(`receiverId exists: ${state.receiverId}`)
        sendNotification({
          type: 'friend_request',
          content: `User ${session.user.name} sent a friend request to you`,
          receiver: state.receiverId,
          sender: session.user.id,
          metadata: friendRequestData
        });
      }
    }
    
        // Reset success state after 3 seconds
        setTimeout(() => {
          setShowSuccessState(false)
        }, 3000)
        
  }, [state, sessionId, session, sendNotification]);


  useEffect(() => {
    // console.log(initialFriends);
    // console.log(allUsers);
  }, [initialFriends, allUsers])
  
  const handleAction = (formData: FormData) => {
    formData.append('senderId', sessionId)
    return formAction(formData)
  }

  const handleSendRequestToUser = (userId: string, email: string) => {
    const formData = new FormData()
    formData.append('senderId', sessionId)
    formData.append('email', email)
    formAction(formData)
  }

  return (
    <div className="space-y-8">
      {/* Email form to add friend */}
      <form action={handleAction} className='max-w-sm'>
        <label
          htmlFor='email'
          className='block text-sm font-medium leading-6 text-gray-900'>
          Add friend by E-Mail
        </label>
        <div className='mt-2 flex gap-4'>
          <input
            name='email'
            type='email'
            className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
            placeholder='you@example.com'
            required
          />
          <Button type="submit">Add</Button>
        </div>
        {state.error && (
          <p className='mt-1 text-sm text-red-600'>{state.error}</p>
        )}
        {showSuccessState && (
          <p className='mt-1 text-sm text-green-600'>Friend request sent!</p>
        )}
      </form>

      {/* List of non-friend users */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">People you may know</h2>
        
        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full max-w-md rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {nonFriendUsers.length === 0 ? (
          <p className="text-gray-500">No users found</p>
        ) : (
          <ul className="space-y-4 max-w-3xl">
            {nonFriendUsers.map((user) => (
              <li key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                    {user.image ? (
                      <Image
                      fill
                      referrerPolicy='no-referrer'
                      className='rounded-full'
                      src='/static/default_img.png'
                      alt='Your profile picture'
                      />
                    ) : (
                      <Image
                      fill
                      referrerPolicy='no-referrer'
                      className='rounded-full'
                      src='/static/default_img.png'
                      alt='Your profile picture'
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleSendRequestToUser(user.id, user.email)}
                  className="ml-4"
                >
                  <UserRoundPlus className='text-white' />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default AddFriendButton