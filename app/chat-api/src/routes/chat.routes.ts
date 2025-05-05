import { Router } from 'express';
import { handleWebSocketConnection } from '../controllers/chatControllers';
import { handleWebSocketConnectionUser } from '../controllers/notificationController';
import Logger from '../utils/logger';

const router = Router();

export const mountRouter = () => {
    router.ws('/chat/:userid/:id', async (ws, req) => {
        try {
            await handleWebSocketConnection(ws as any, req);
        } catch (error) {
            Logger.error('ChatRoutes','Error in WebSocket connection:', error as Error);
            ws.close(1011, 'Internal Server Error');
        }
    });
    // User notifications WebSocket route
    router.ws('/user/:userid', async (ws, req) => {
        try {
            await handleWebSocketConnectionUser(ws as any, req);
        } catch (error) {
            Logger.error('NotificationRoutes', 'Error in user notification WebSocket connection', error as Error);
            ws.close(1011, 'Internal Server Error');
        }
    });
}

export default router;