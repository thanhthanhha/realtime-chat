'use server'
import { z } from 'zod'
import { serverApi } from '@/lib/axios/server'
import logger from '@/lib/logger'

const MODULE_NAME = 'ButtonAction'

export async function createChat(
    owner: string,
    participants: string[],
    chatroom_name: string | undefined | null,
  ) {
    logger.info(MODULE_NAME, 'Starting chat creation process', {
      participantsCount: participants.length,
      owner: owner
    })
  
    try {
      
      // Send friend request
      if (!participants || participants.length === 0) {
        logger.warn(MODULE_NAME, 'No participants provided')
        return { error: 'At least one participant is required' }
      }
      // Prepare request payload
      const payload = {
        chat_owner: owner,
        participants: participants,
        chatroom_name: chatroom_name ? chatroom_name : '',
      }
  
      logger.info(MODULE_NAME, 'Creating chat', { payload })
      const response = await serverApi.post('/api/chat', payload)
      
      if (response.status === 200 || response.status === 201) {
        logger.info(MODULE_NAME, 'Creating chat successfully', {
          owner,
          status: response.status
        })
        return { success: true, data: response.data }
      }
      logger.warn(MODULE_NAME, 'Failed to create chat', {
        status: response.status,
        response: response.data
      })
      return { error: 'Failed to create chat' }
  
    } catch (error) {
      logger.error(MODULE_NAME, 'Error in create chat process', { 
        error: {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        }
      })
  
      return { 
        error: error.message || 'Something went wrong'
      }
    }
  }
  
  export async function denyFriendRequest(
    friendrequest_id: string
  ) {
    logger.info(MODULE_NAME, 'Starting deny friend process', {
      friendrequest_id: friendrequest_id
    })
  
    try {
      
      // Send friend request
      const response = await serverApi.delete(`/api/friendRequest/${friendrequest_id}`)
      if (response.status === 200 || response.status === 201) {
        logger.info(MODULE_NAME, 'Friend request denied successfully', {
          friendrequest_id,
          status: response.status
        })
        return { success: true }
      }
  
      logger.warn(MODULE_NAME, 'Failed to deny friend request', {
        status: response.status,
        response: response.data
      })
      return { error: 'Failed to deny friend request' }
    } catch (error) {
      logger.error(MODULE_NAME, 'Error in deny friend request process', { 
        error: {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        }
      })
  
      return { 
        error: error.message || 'Something went wrong'
      }
    }
  }
  
  
  export async function acceptFriendRequest(
    friendrequest_id: string
  ) {
    logger.info(MODULE_NAME, 'Starting accept friend process', {
      friendrequest_id: friendrequest_id
    })
  
    try {
      
      // Send friend request
      const response = await serverApi.put(`/api/friendRequest/${friendrequest_id}/approve`)
      if (response.status === 200 || response.status === 201) {
        logger.info(MODULE_NAME, 'Friend request accepted successfully', {
          friendrequest_id,
          status: response.status
        })
        return { success: true }
      }
  
      logger.warn(MODULE_NAME, 'Failed to accept friend request', {
        status: response.status,
        response: response.data
      })
      return { error: 'Failed to accept friend request' }
    } catch (error) {
      logger.error(MODULE_NAME, 'Error in accept friend request process', { 
        error: {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        }
      })
  
      return { 
        error: error.message || 'Something went wrong'
      }
    }
  }


  export async function getPendingFriendRequests(userId: string) {
    logger.info(MODULE_NAME, 'Fetching pending friend requests', { userId })
    
    try {
      const response = await serverApi.get<FriendRequestItem[]>(`/api/friendRequest/pending/${userId}`)
      
      if (response.status === 200) {
        logger.info(MODULE_NAME, 'Successfully fetched pending friend requests', {
          userId,
          count: response.data.length
        })
        return { success: true, data: response.data }
      }
      
      logger.warn(MODULE_NAME, 'Failed to fetch pending friend requests', {
        status: response.status,
        response: response.data
      })
      return { error: 'Failed to fetch pending friend requests' }
      
    } catch (error) {
      logger.error(MODULE_NAME, 'Error fetching pending friend requests', { 
        error: {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        }
      })
      
      return { 
        error: error.message || 'Something went wrong while fetching friend requests'
      }
    }
  }


  export async function getUserChatRooms(userId: string) {
  logger.info(MODULE_NAME, 'Fetching user chat rooms', { userId })
  
  try {
    const response = await serverApi.get<Chat[]>(`/api/chat/user/${userId}`)
    
    if (response.status === 200) {
      logger.info(MODULE_NAME, 'Successfully fetched user chat rooms', {
        userId,
        count: response.data.length
      })
      return { success: true, data: response.data }
    }
    
    logger.warn(MODULE_NAME, 'Failed to fetch user chat rooms', {
      status: response.status,
      response: response.data
    })
    return { error: 'Failed to fetch user chat rooms' }
    
  } catch (error) {
    logger.error(MODULE_NAME, 'Error fetching user chat rooms', { 
      error: {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      }
    })
    
    return { 
      error: error.message || 'Something went wrong while fetching chat rooms'
    }
  }
}

export async function getChatRoomById(id: string): Promise<ChatRoom | null> {
    logger.info(MODULE_NAME, 'Fetching chat room id', { id })
    
    try {
      const response = await serverApi.get<ChatRoom>(`/api/chat/${id}`)
      
      if (response.status === 200 || response.status === 201) {
        logger.info(MODULE_NAME, 'Successfully user chat room', {
            id
        })
        return response.data || null
      }
      
      logger.warn(MODULE_NAME, 'Failed to fetch chat room ', {
        id,
        status: response.status,
        response: response.data
      })
      return null
      
    } catch (error) {
      logger.error(MODULE_NAME, `Error fetching chat room ${id}}`, { 
        error: {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        }
      })
      
      return null
    }
  }


  export async function getUserParticipatingChats(userId: string) {
    logger.info(MODULE_NAME, 'Fetching chats where user is a participant', { userId })
    
    try {
      const response = await serverApi.get<Chat[]>(`/api/chat/participant/${userId}`)
      
      if (response.status === 200 || response.status === 201) {
        logger.info(MODULE_NAME, 'Successfully fetched user participating chats', {
          userId,
          count: response.data.length
        })
        return { success: true, data: response.data }
      }
      
      logger.warn(MODULE_NAME, 'Failed to fetch user participating chats', {
        status: response.status,
        response: response.data
      })
      return { error: 'Failed to fetch user participating chats' }
      
    } catch (error) {
      logger.error(MODULE_NAME, 'Error fetching user participating chats', { 
        error: {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        }
      })
      
      return { 
        error: error.message || 'Something went wrong while fetching chats'
      }
    }
  }

  /**
   * Fetches friends for a specific user
   */
  export async function getUserId(userId: string): Promise<User | null> {
    try {
      const response = await serverApi.get<User>(`/api/users/${userId}`)
      if (response.status === 200 || response.status === 201) {
        logger.info(MODULE_NAME, 'Get user id successfully', {
          //data: JSON.stringify(response.data),
          status: response.status
        })
        return response.data || null
      }
  
      logger.warn(MODULE_NAME, 'Failed to get user id ', {
        status: response.status,
        response: response.data
      })
      return null
    } catch (error) {
      logger.error(MODULE_NAME, 'Failed to fetch user id ', {
        error: {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        }
      })
      return null
    }
  }
  
  
  /**
   * Fetches friends for a specific user
   */
  export async function getUserFriends(userId: string): Promise<User[]> {
    try {
      const response = await serverApi.get<User[]>(`/api/users/${userId}/friends`)
      if (response.status === 200 || response.status === 201) {
        logger.info(MODULE_NAME, 'Get friends successfully', {
          //data: JSON.stringify(response.data),
          status: response.status
        })
        return response.data || []
      }
  
      logger.warn(MODULE_NAME, 'Failed to get friends loser', {
        status: response.status,
        response: response.data
      })
      return []
    } catch (error) {
      logger.error(MODULE_NAME, 'Failed to fetch user friends', {
        error: {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        }
      })
      return []
    }
  }
  
  /**
   * Fetches all users from the system
   */
  export async function getAllUsers(): Promise<User[]> {
    try {
      const response = await serverApi.get<User[]>('/api/users')
      if (response.status === 200 || response.status === 201) {
        logger.info(MODULE_NAME, 'Get all users successfully', {
          //data: JSON.stringify(response.data),
          status: response.status
        })
        return response.data || []
      }
  
      logger.warn(MODULE_NAME, 'Failed to get users loser', {
        status: response.status,
        response: response.data
      })
      return []
    } catch (error) {
      logger.error(MODULE_NAME, 'Failed to fetch all users', {
        error: {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        }
      })
      return []
    }
  }
  
  
  