import { Router } from 'express';
import { ChatController } from '../controllers/chatController';

const router = Router();
const chatController = new ChatController();

router.post('/', chatController.createChat);
router.get('/:id', chatController.getChatById);
router.get('/user/:user_id', chatController.getChatsByUserId);
router.delete('/:id', chatController.deleteChat);
router.get('/participant/:participantId', chatController.getChatsByParticipantId);
router.post('/participant', chatController.addParticipantToChat);
router.post('/:id/messages', chatController.addMessageToChat);

export default router;