import FriendRequests from '@/components/FriendRequests'
import { auth } from "@/auth"
import { notFound } from 'next/navigation'
import { FC } from 'react'
import { serverApi } from '@/lib/axios'
import { FriendRequestItem } from '@/types/typings'

const page = async () => {
  const session = await auth()
  if (!session) notFound()

  // ids of people who sent current logged in user a friend requests
  // Get pending friend requests
  const { data: incomingFriendRequests } = await serverApi.get<FriendRequestItem[]>(
    `/api/friendRequest/pending/${session.user.id}`
  )

  return (
    <main className='pt-8'>
      <h1 className='font-bold text-5xl mb-8'>Add a friend</h1>
      <div className='flex flex-col gap-4'>
        <FriendRequests
          incomingFriendRequests={incomingFriendRequests}
          sessionId={session.user.id}
        />
      </div>
    </main>
  )
}

export default page
