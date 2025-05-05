
import AddFriendButton from '@/components/AddFriendButton'
import { FC } from 'react'
import { auth } from "@/auth"
import { notFound } from 'next/navigation'
import { getUserFriends, getAllUsers } from '@/lib/buttonactions'

//import { serverApi } from '@/lib/axios'

const page: FC = async () => {
  const session = await auth()
  if (!session) notFound()
  // const [friendsResponse, allUsersResponse] = await Promise.all([
  //   {data: []},
  //   {data: []}
  // ]);

  //Fetch data using server actions
  const [friendsResponse, allUsersResponse] = await Promise.all([
    getUserFriends(session.user.id),
    getAllUsers()
  ]);

  // console.log(friendsResponse)
  // console.log(allUsersResponse)

  const friends = friendsResponse|| [];
  const allUsers = allUsersResponse || [];

  return (
    <main className='pt-8'>
      <h1 className='font-bold text-5xl mb-8'>Add a friend</h1>
      <AddFriendButton 
        sessionId={session.user.id} 
        session={session} 
        initialFriends={friends}
        allUsers={allUsers}
      />
    </main>
  )
}

export default page


