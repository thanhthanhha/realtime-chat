import { DynamoDB } from 'aws-sdk';
import { dynamoDBConfig } from '../config/db.config';

export const dynamoDb = new DynamoDB.DocumentClient(dynamoDBConfig);