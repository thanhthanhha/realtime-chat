import { dynamoDb } from '@/lib/dynamodb'

type Command = 'Query' | 'GetItem' | 'Scan'

export async function queryDynamoDB(
  command: Command,
  params: any
) {
  try {
    const result = await dynamoDb[command.toLowerCase()](params)
    return result.Items || result.Item || null
  } catch (error) {
    console.error(`Error executing DynamoDB ${command}:`, error)
    throw error
  }
}
