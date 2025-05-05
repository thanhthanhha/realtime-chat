import { Icon, Icons } from '@/components/Icons'
import SignOutButton from '@/components/SignOutButton'
import { auth } from "@/auth"
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import { serverApi } from '@/lib/axios'
import logger from '@/lib/logger'
import DashboardWrapper from '@/components/DashboardWrapper'
import { SidebarOption } from '@/types/typings'
import { getUserFriends, getPendingFriendRequests, getUserParticipatingChats } from '@/lib/buttonactions'
import {FriendRequestItem} from '@/types/typings'

interface LayoutProps {
  children: ReactNode
}

// Done after the video and optional: add page metadata
export const metadata = {
  title: 'FriendZone | Dashboard',
  description: 'Your dashboard',
}

const sidebarOptions: SidebarOption[] = [
  {
    id: 1,
    name: 'Add friend',
    href: '/dashboard/add',
    Icon: 'UserPlus',
  },
]

const MODULE_NAME = "DASHBOARD_LAYOUT"

const Layout = async ({ children }: LayoutProps) => {
  const session = await auth()
  if (!session) notFound()

  // Get initial data from server
  const [friendRequestsResponse, friends, chatroomResponse] = await Promise.all([
    getPendingFriendRequests(session.user.id),
    getUserFriends(session.user.id),
    getUserParticipatingChats(session.user.id),
  ]);

  const pendingRequests = friendRequestsResponse.data || [];
  const chatrooms = chatroomResponse.data || [];
  
  logger.info(MODULE_NAME, 'Initial data fetched', {
    pendingRequestsCount: pendingRequests.length,
    friendsCount: friends.length
  });

  const unseenRequestCount = pendingRequests.filter(
    (request: FriendRequestItem) => !request.approved
  ).length;

  return (
    <DashboardWrapper
      session={session}
      initialFriends={friends}
      initialUnseenRequestCount={unseenRequestCount}
      sidebarOptions={sidebarOptions}
      initialChatrooms={chatrooms}
    >
      <aside className='max-h-screen container py-16 md:py-12 w-full'>
        {children}
      </aside>
    </DashboardWrapper>
  );
}

export default Layout;