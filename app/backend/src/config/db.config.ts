import { DynamoDB } from 'aws-sdk';
import Logger from '@/utils/logger';
import dotenv from 'dotenv';
dotenv.config();

export const dynamoDBConfig = {
  region: process.env.AWS_REGION || 'ap-northeast-2',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : {})
};

// Only log credential info if explicitly provided
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  Logger.info('UserController', 'Using explicit AWS credentials from environment variables');
} else {
  Logger.info('UserController', 'Using IAM role credentials from pod');
}