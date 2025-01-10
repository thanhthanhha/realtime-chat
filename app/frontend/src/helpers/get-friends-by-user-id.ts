import { dynamoDb } from '@/lib/dynamodb'

export const getFriendsByUserId = async (userId: string) => {
  try {
    // First, query for friend relationships
    const friendsResult = await dynamoDb.query({
      TableName: 'next-auth',
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `user#${userId}#friends`
      }
    })

    if (!friendsResult.Items || friendsResult.Items.length === 0) {
      return []
    }

    // Get the friend IDs from the relationship records
    const friendIds = friendsResult.Items.map(item => item.friendId)

    // Then query for the actual user data for each friend
    const friends = await Promise.all(
      friendIds.map(async (friendId) => {
        const userResult = await dynamoDb.get({
          TableName: 'next-auth',
          Key: {
            pk: `user#${friendId}`,
            sk: 'profile'
          }
        })

        if (!userResult.Item) {
          throw new Error(`User ${friendId} not found`)
        }

        // Transform DynamoDB user record to User type
        return {
          id: friendId,
          name: userResult.Item.name,
          email: userResult.Item.email,
          image: userResult.Item.image,
          // Add any other user properties you need
        } as User
      })
    )

    return friends
  } catch (error) {
    console.error('Error getting friends:', error)
    throw error
  }
}