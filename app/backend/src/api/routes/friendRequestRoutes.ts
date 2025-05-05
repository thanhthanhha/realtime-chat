import { Router, Request, Response } from 'express';
import { FriendRequestController } from '../controllers/friendRequestController';

const router = Router();
const friendRequestController = new FriendRequestController();

// Create a new friend request
router.post('/', friendRequestController.createFriendRequest);

// Get all pending friend requests for a user
router.get('/pending/:userId', friendRequestController.getPendingRequests);

// Get all sent friend requests by a user
router.get('/sent/:userId', friendRequestController.getSentRequests);

// Delete a friend request
router.delete('/:requestId', friendRequestController.deleteFriendRequest);
router.put('/:requestId/approve', friendRequestController.approveRequest);

export default router;