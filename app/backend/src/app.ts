// src/app.ts

import express from 'express';
import userRoutes from '@/api/routes/userRoutes';
import messageRoutes from '@/api/routes/messageRoutes';
import friendRequestRoutes from '@/api/routes/friendRequestRoutes';
import chatRoutes from '@/api/routes/chatRoutes';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/friendRequest', friendRequestRoutes);
app.use('/api/chat', chatRoutes);

export default app;