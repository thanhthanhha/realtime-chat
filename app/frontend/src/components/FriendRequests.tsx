'use client'

import axios from 'axios'
import { Check, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { useWebSocket } from '@/components/WebSocketProvider';
import { denyFriendRequest, acceptFriendRequest } from '@/lib/buttonactions'
import logger from '@/lib/logger'
import { toast } from 'react-hot-toast';

interface FriendRequestsProps {
  incomingFriendRequests: FriendRequestItem[]
  sessionId: string
}

const FriendRequests: FC<FriendRequestsProps> = ({
  incomingFriendRequests,
  sessionId,
}) => {
  const router = useRouter()
  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>(
    incomingFriendRequests
  )

  const { notifications } = useWebSocket();
  //console.log(friendRequests)

  useEffect(() => {

    // Listen for notifications and update data when relevant
    const latestNotification = notifications[notifications.length - 1];
    if (latestNotification?.payload?.type === 'friend_request') {
      //console.log(latestNotification.payload)
      setFriendRequests((prev) => [...prev, latestNotification.payload.metadata as FriendRequestItem]);
    }
  }, [notifications, sessionId]);

  useEffect(() => {
    console.log("Friend Request")
    console.log(friendRequests)
  },[friendRequests])


  const acceptFriend = async (friendrequest_id: string) => {
    const request_status = await acceptFriendRequest(friendrequest_id)

    if (request_status.success) {
      setFriendRequests((prev) =>
        prev.map((request) => {
          if (request.id !== friendrequest_id) {
            return request
          } else {
            return {...request, approved: true}
          }
        })
      )
      toast.success('Friend Request Accepted')
    } else {
      if (request_status.error) {
        toast.error(request_status.error)
      }
    }
  }

  const denyFriend = async (friendrequest_id: string) => {
    const request_status = await denyFriendRequest(friendrequest_id)

    if (request_status.success) {
      setFriendRequests((prev) =>
        prev.filter((request) => request.id !== friendrequest_id)
      )
      toast.success('Friend Request Denied')
    } else {
      if (request_status.error) {
        toast.error(request_status.error)
      }
    }
  }


  return (
    <>
      {friendRequests.length === 0 ? (
        <p className='text-sm text-zinc-500'>Nothing to show here...</p>
      ) : (
        friendRequests.map((request) => (
          <div key={request.id} className='flex gap-4 items-center'>
            <UserPlus className='text-black' />
            <p className='font-medium text-lg'>{request.sender_name ? request.sender_name : request.metadata?.name}</p>
            
            {request.approved === true ? (
              <p className='font-bold text-gray-500'>Request Accepted</p>
            ) : (
              <>
                <button
                  onClick={() => acceptFriend(request.id)}
                  aria-label='accept friend'
                  className='w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition hover:shadow-md'>
                  <Check className='font-semibold text-white w-3/4 h-3/4' />
                </button>
                <button
                  onClick={() => denyFriend(request.id)}
                  aria-label='deny friend'
                  className='w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md'>
                  <X className='font-semibold text-white w-3/4 h-3/4' />
                </button>
              </>
            )}
          </div>
        ))
      )}
    </>
  )
}

export default FriendRequests
