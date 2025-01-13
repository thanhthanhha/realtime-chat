import request from 'supertest';
import app from '../src/app';
import { FriendRequestRepository } from '../src/db/repositories/friendRequestRepository';
import { UserRepository } from '../src/db/repositories/userRepository';
import { FriendRequest, User } from '../src/types/models';

// Mock the repositories
jest.mock('../src/db/repositories/friendRequestRepository');
jest.mock('../src/db/repositories/userRepository');

describe('Friend Request API', () => {
  let mockFriendRequestRepo: jest.Mocked<FriendRequestRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  // Test data
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

  const testFriendRequest: FriendRequest = {
    id: 'request1',
    senderId: testUser1.id,
    receiverId: testUser2.id
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Initialize mock repositories
    mockFriendRequestRepo = new FriendRequestRepository() as jest.Mocked<FriendRequestRepository>;
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>;
  });

  describe('POST /', () => {
    it('should create a new friend request successfully', async () => {
      // Mock repository responses
      mockUserRepo.getUserById
        .mockResolvedValueOnce(testUser1)
        .mockResolvedValueOnce(testUser2);
      mockFriendRequestRepo.getFriendRequestsByReceiverId
        .mockResolvedValueOnce([]);
      mockFriendRequestRepo.createFriendRequest
        .mockResolvedValueOnce(testFriendRequest);

      const response = await request(app)
        .post('/api/friendRequest')
        .send({
          senderId: testUser1.id,
          receiverId: testUser2.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(testFriendRequest);
    });

    it('should return 404 if one of the users does not exist', async () => {
      mockUserRepo.getUserById
        .mockResolvedValueOnce(testUser1)
        .mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/friendRequest')
        .send({
          senderId: testUser1.id,
          receiverId: 'nonexistent'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'One or both users not found');
    });

    it('should return 400 if friend request already exists', async () => {
      mockUserRepo.getUserById
        .mockResolvedValueOnce(testUser1)
        .mockResolvedValueOnce(testUser2);
      mockFriendRequestRepo.getFriendRequestsByReceiverId
        .mockResolvedValueOnce([testFriendRequest]);

      const response = await request(app)
        .post('/api/friendRequest')
        .send({
          senderId: testUser1.id,
          receiverId: testUser2.id
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Friend request already exists');
    });
  });

  describe('GET /pending/:userId', () => {
    it('should return all pending friend requests for a user', async () => {
      mockFriendRequestRepo.getFriendRequestsByReceiverId
        .mockResolvedValueOnce([testFriendRequest]);

      const response = await request(app)
        .get(`/api/friendRequest/pending/${testUser2.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([testFriendRequest]);
    });

    it('should return empty array when no pending requests exist', async () => {
      mockFriendRequestRepo.getFriendRequestsByReceiverId
        .mockResolvedValueOnce([]);

      const response = await request(app)
        .get(`/api/friendRequest/pending/${testUser2.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /sent/:userId', () => {
    it('should return all sent friend requests by a user', async () => {
      mockFriendRequestRepo.getFriendRequestsBySenderId
        .mockResolvedValueOnce([testFriendRequest]);

      const response = await request(app)
        .get(`/api/friendRequest/sent/${testUser1.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([testFriendRequest]);
    });

    it('should return empty array when no sent requests exist', async () => {
      mockFriendRequestRepo.getFriendRequestsBySenderId
        .mockResolvedValueOnce([]);

      const response = await request(app)
        .get(`/api/friendRequest/sent/${testUser1.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('DELETE /:requestId', () => {
    it('should delete a friend request successfully', async () => {
      mockFriendRequestRepo.deleteFriendRequest
        .mockResolvedValueOnce(true);

      const response = await request(app)
        .delete(`/api/friendRequest/${testFriendRequest.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Friend request deleted successfully');
    });

    it('should return 404 if friend request does not exist', async () => {
      mockFriendRequestRepo.deleteFriendRequest
        .mockResolvedValueOnce(false);

      const response = await request(app)
        .delete('/api/friendRequest/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Friend request not found');
    });
  });
});