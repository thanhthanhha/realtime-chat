import { Router } from 'express';
import { AuthController } from '@/api/controllers/authController';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);

export default router;