// src/test/setup.ts
import { DynamoDB } from 'aws-sdk';
import { spawn } from 'child_process';

let dynamoProcess: any;

//add comment

export const setupTestDatabase = () => {
  // DynamoDB Local configuration
  const dynamoDb = new DynamoDB({
    region: 'local',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'local',
    secretAccessKey: 'local'
  });

  beforeAll(async () => {
    // Start DynamoDB Local
    dynamoProcess = spawn('java', [
      '-Djava.library.path=./DynamoDBLocal_lib',
      '-jar',
      'DynamoDBLocal.jar',
      '-inMemory'
    ]);

    // Create test tables
    await dynamoDb.createTable({
      TableName: 'FriendRequests',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'senderId', AttributeType: 'S' },
        { AttributeName: 'receiverId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'SenderIdIndex',
          KeySchema: [
            { AttributeName: 'senderId', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: 'ReceiverIdIndex',
          KeySchema: [
            { AttributeName: 'receiverId', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }).promise();
  });

  beforeEach(async () => {
    // Clear all data before each test
    const tables = await dynamoDb.listTables().promise();
    await Promise.all(
      tables.TableNames?.map(TableName =>
        dynamoDb.scan({ TableName })
          .promise()
          .then(data =>
            Promise.all(
              data.Items?.map(Item =>
                dynamoDb.deleteItem({
                  TableName,
                  Key: { id: Item.id }
                }).promise()
              ) || []
            )
          )
      ) || []
    );
  });

  afterAll(async () => {
    // Clean up tables
    const tables = await dynamoDb.listTables().promise();
    await Promise.all(
      tables.TableNames?.map(TableName =>
        dynamoDb.deleteTable({ TableName }).promise()
      ) || []
    );

    // Stop DynamoDB Local
    if (dynamoProcess) {
      dynamoProcess.kill();
    }
  });

  return dynamoDb;
};