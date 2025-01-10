import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

router.post('/friends/add', userController.addFriend);
router.post('/friends/remove', userController.removeFriend);
router.get('/:id/friends', userController.getFriendlist);

export default router;