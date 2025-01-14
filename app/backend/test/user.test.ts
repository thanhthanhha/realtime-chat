import request from 'supertest';
import app from '../src/app';
import { UserRepository } from '../src/db/repositories/userRepository';
import { FriendRequestRepository } from '../src/db/repositories/friendRequestRepository';
import { User, FriendRequest } from '../src/types/models';

// Mock the repositories
jest.mock('../src/db/repositories/userRepository');
jest.mock('../src/db/repositories/friendRequestRepository');

describe('User and Friend Request API Tests', () => {
  let mockUser: User;
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
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock user data
    mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      image: 'test-image.jpg',
      friendlist_id: []
    };

    // Initialize mock repositories
    mockFriendRequestRepo = new FriendRequestRepository() as jest.Mocked<FriendRequestRepository>;
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>;
  });

  // User API Tests
  describe('User API Endpoints', () => {
    describe('POST /api/users', () => {
      it('should create a new user', async () => {
        const userToCreate = {
          name: 'Test User',
          email: 'test@example.com',
          image: 'test-image.jpg'
        };

        (UserRepository.prototype.createUser as jest.Mock).mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/api/users')
          .send(userToCreate);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(mockUser);
        expect(UserRepository.prototype.createUser).toHaveBeenCalledWith(userToCreate);
      });

      it('should return 500 when user creation fails', async () => {
        (UserRepository.prototype.createUser as jest.Mock).mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .post('/api/users')
          .send({});

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Failed to create user' });
      });
    });

    describe('GET /api/users/:id', () => {
      it('should return a user by id', async () => {
        (UserRepository.prototype.getUserById as jest.Mock).mockResolvedValue(mockUser);

        const response = await request(app)
          .get(`/api/users/${mockUser.id}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUser);
        expect(UserRepository.prototype.getUserById).toHaveBeenCalledWith(mockUser.id);
      });

      it('should return 404 when user is not found', async () => {
        (UserRepository.prototype.getUserById as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
          .get('/api/users/nonexistent');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'User not found' });
      });
    });

    describe('PUT /api/users/:id', () => {
      it('should update a user', async () => {
        const updates = {
          name: 'Updated Name',
          email: 'updated@example.com'
        };
        const updatedUser = { ...mockUser, ...updates };
        
        (UserRepository.prototype.updateUser as jest.Mock).mockResolvedValue(updatedUser);

        const response = await request(app)
          .put(`/api/users/${mockUser.id}`)
          .send(updates);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedUser);
        expect(UserRepository.prototype.updateUser).toHaveBeenCalledWith(mockUser.id, updates);
      });

      it('should return 404 when updating non-existent user', async () => {
        (UserRepository.prototype.updateUser as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
          .put('/api/users/nonexistent')
          .send({ name: 'Updated Name' });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'User not found' });
      });
    });

    describe('DELETE /api/users/:id', () => {
      it('should delete a user', async () => {
        (UserRepository.prototype.deleteUser as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
          .delete(`/api/users/${mockUser.id}`);

        expect(response.status).toBe(204);
        expect(UserRepository.prototype.deleteUser).toHaveBeenCalledWith(mockUser.id);
      });

      it('should return 404 when deleting non-existent user', async () => {
        (UserRepository.prototype.deleteUser as jest.Mock).mockResolvedValue(false);

        const response = await request(app)
          .delete('/api/users/nonexistent');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'User not found' });
      });
    });

    describe('Friend Management', () => {
      describe('POST /api/users/friends/add', () => {
        it('should add a friend to user\'s friendlist', async () => {
          const friendId = '456';
          const user = { ...mockUser };
          const updatedUser = { ...mockUser, friendlist_id: [friendId] };
          
          (UserRepository.prototype.getUserById as jest.Mock)
            .mockResolvedValueOnce(user)
            .mockResolvedValueOnce({ id: friendId });
          (UserRepository.prototype.updateUser as jest.Mock).mockResolvedValue(updatedUser);

          const response = await request(app)
            .post('/api/users/friends/add')
            .send({ userId: user.id, friendId });

          expect(response.status).toBe(200);
          expect(response.body).toEqual(updatedUser);
        });

        it('should return 404 when user or friend not found', async () => {
          (UserRepository.prototype.getUserById as jest.Mock).mockResolvedValue(null);

          const response = await request(app)
            .post('/api/users/friends/add')
            .send({ userId: '123', friendId: '456' });

          expect(response.status).toBe(404);
          expect(response.body).toEqual({ error: 'User or friend not found' });
        });
      });

      describe('POST /api/users/friends/remove', () => {
        it('should remove a friend from user\'s friendlist', async () => {
          const friendId = '456';
          const user = { ...mockUser, friendlist_id: [friendId] };
          const updatedUser = { ...mockUser, friendlist_id: [] };
          
          (UserRepository.prototype.getUserById as jest.Mock).mockResolvedValue(user);
          (UserRepository.prototype.updateUser as jest.Mock).mockResolvedValue(updatedUser);

          const response = await request(app)
            .post('/api/users/friends/remove')
            .send({ userId: user.id, friendId });

          expect(response.status).toBe(200);
          expect(response.body).toEqual(updatedUser);
        });

        it('should return 404 when user not found', async () => {
          (UserRepository.prototype.getUserById as jest.Mock).mockResolvedValue(null);

          const response = await request(app)
            .post('/api/users/friends/remove')
            .send({ userId: '123', friendId: '456' });

          expect(response.status).toBe(404);
          expect(response.body).toEqual({ error: 'User not found' });
        });
      });

      describe('GET /api/users/:id/friends', () => {
        it('should return user\'s friendlist', async () => {
          const friendId = '456';
          const user = { ...mockUser, friendlist_id: [friendId] };
          const friend = { 
            id: friendId, 
            name: 'Friend', 
            email: 'friend@example.com', 
            image: 'friend.jpg', 
            friendlist_id: [] 
          };
          
          (UserRepository.prototype.getUserById as jest.Mock)
            .mockResolvedValueOnce(user)
            .mockResolvedValueOnce(friend);

          const response = await request(app)
            .get(`/api/users/${user.id}/friends`);

          expect(response.status).toBe(200);
          expect(response.body).toEqual([friend]);
        });

        it('should return 404 when user not found', async () => {
          (UserRepository.prototype.getUserById as jest.Mock).mockResolvedValue(null);

          const response = await request(app)
            .get('/api/users/nonexistent/friends');

          expect(response.status).toBe(404);
          expect(response.body).toEqual({ error: 'User not found' });
        });
      });
    });
  });

  // Friend Request API Tests
  describe('Friend Request API', () => {
    describe('POST /api/friendRequest', () => {
      it('should create a new friend request successfully', async () => {
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

    describe('GET /api/friendRequest/pending/:userId', () => {
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

    describe('GET /api/friendRequest/sent/:userId', () => {
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

    describe('DELETE /api/friendRequest/:requestId', () => {
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
});