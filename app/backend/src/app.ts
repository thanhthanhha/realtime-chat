// src/app.ts

import express from 'express';
import userRoutes from '@/api/routes/userRoutes';
import messageRoutes from '@/api/routes/messageRoutes';
import friendRequestRoutes from '@/api/routes/friendRequestRoutes';
import chatRoutes from '@/api/routes/chatRoutes';
import authRoutes from '@/api/routes/authRoutes';


const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'api'
    });
  });
  

// Routes
app.use('/api/users', userRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/friendRequest', friendRequestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

export default app;