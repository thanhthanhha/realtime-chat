import supertest from 'supertest';  // Changed from 'request' to 'supertest'
import app from '../../src/app';
import { setupTestDatabase } from './setup';
import { FriendRequest, User } from '../../src/types/models';
import { FriendRequestRepository } from '../../src/db/repositories/friendRequestRepository';
import { UserRepository } from '../../src/db/repositories/userRepository';

describe('Friend Request API Integration Tests', () => {
  const dynamoDb = setupTestDatabase();
  const friendRequestRepo = new FriendRequestRepository();
  const userRepo = new UserRepository();

  const testUser1: User = {
    id: 'user1',
    name: 'Test User 1',
    email: 'user1@test.com',
    image: 'image1.jpg',
    friendlist_id: []
  };

  const testUser2: User = {
    id: 'user2',
    name: 'Test User 2',
    email: 'user2@test.com',
    image: 'image2.jpg',
    friendlist_id: []
  };

  beforeEach(async () => {
    // Create test users
    await userRepo.createUser(testUser1);
    await userRepo.createUser(testUser2);
  });

  describe('POST /api/friendRequest', () => {
    it('should create a new friend request', async () => {
      const response = await supertest(app)  // Using supertest instead of request
        .post('/api/friendRequest')
        .send({
          senderId: testUser1.id,
          receiverId: testUser2.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        senderId: testUser1.id,
        receiverId: testUser2.id
      });

      // Verify in database
      const request = await friendRequestRepo.getFriendRequestById(response.body.id);
      expect(request).toMatchObject({
        senderId: testUser1.id,
        receiverId: testUser2.id
      });
    });

    it('should prevent duplicate friend requests', async () => {
      // Create initial request
      await supertest(app)
        .post('/api/friendRequest')
        .send({
          senderId: testUser1.id,
          receiverId: testUser2.id
        });

      // Attempt duplicate request
      const response = await supertest(app)
        .post('/api/friendRequest')
        .send({
          senderId: testUser1.id,
          receiverId: testUser2.id
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Friend request already exists');
    });
  });

  describe('GET /api/friendRequest/pending/:userId', () => {
    it('should get all pending requests for a user', async () => {
      // Create test friend request
      const friendRequest = await friendRequestRepo.createFriendRequest({
        senderId: testUser1.id,
        receiverId: testUser2.id
      });

      const response = await supertest(app)
        .get(`/api/friendRequest/pending/${testUser2.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        senderId: testUser1.id,
        receiverId: testUser2.id
      });
    });
  });

  describe('DELETE /api/friendRequest/:requestId', () => {
    it('should delete an existing friend request', async () => {
      // Create test friend request
      const friendRequest = await friendRequestRepo.createFriendRequest({
        senderId: testUser1.id,
        receiverId: testUser2.id
      });

      const response = await supertest(app)
        .delete(`/api/friendRequest/${friendRequest.id}`);

      expect(response.status).toBe(200);
      
      // Verify deletion
      const deletedRequest = await friendRequestRepo.getFriendRequestById(friendRequest.id);
      expect(deletedRequest).toBeNull();
    });
  });
});