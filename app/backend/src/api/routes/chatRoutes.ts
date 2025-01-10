import { Router } from 'express';
import { ChatController } from '../controllers/chatController';

const router = Router();
const chatController = new ChatController();

router.post('/', chatController.createChat);
router.get('/:id', chatController.getChatById);
router.get('/user/:userId', chatController.getChatsByUserId);
router.delete('/:id', chatController.deleteChat);

export default router;