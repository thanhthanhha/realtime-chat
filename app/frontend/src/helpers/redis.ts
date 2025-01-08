import { Redis } from 'ioredis'

const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL
const authToken = process.env.UPSTASH_REDIS_REST_TOKEN
const redisUrl = process.env.REDIS_URL
const connectionType = process.env.REDIS_CONNECTION_TYPE || 'local'

type Command = 'zrange' | 'sismember' | 'get' | 'smembers'

// Local Redis client
const redis = redisUrl ? new Redis(redisUrl) : null

// Function to execute Redis commands
export async function fetchRedis(
  command: Command,
  ...args: (string | number)[]
) {
  if (connectionType === 'local' && redis) {
    // Use local Redis
    return await redis[command](args)
  } else {
    // Use Upstash REST API
    const commandUrl = `${upstashRedisRestUrl}/${command}/${args.join('/')}`
    const response = await fetch(commandUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Error executing Redis command: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }
}