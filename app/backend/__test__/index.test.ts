import './user.test';
import './message.test';
import './chat.test';
import './friendRequest.test';

describe('API Test Suite', () => {
  beforeAll(async () => {
    // Global setup before all tests
    process.env.NODE_ENV = 'test';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
  });

  afterAll(async () => {
    // Global cleanup after all tests
    // For example, close database connections
  });
});