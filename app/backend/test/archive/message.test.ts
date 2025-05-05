import request from 'supertest';
import { app } from '../../src/server';
import { UserRepository } from '../../src/db/repositories/userRepository';
import { User } from '../../src/types/models';

// Mock the UserRepository
jest.mock('../src/db/repositories/userRepository');

describe('User API Endpoints', () => {
  let mockUser: User;
  
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
  });

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
          .mockResolvedValueOnce(user)  // First call for user
          .mockResolvedValueOnce({ id: friendId }); // Second call for friend
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
        const friend = { id: friendId, name: 'Friend', email: 'friend@example.com', image: 'friend.jpg', friendlist_id: [] };
        
        (UserRepository.prototype.getUserById as jest.Mock)
          .mockResolvedValueOnce(user)  // First call for user
          .mockResolvedValueOnce(friend); // Second call for friend details

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