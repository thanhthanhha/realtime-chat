import express from 'express';
import userRoutes from '@/api/routes/userRoutes';
import messsageRoutes from '@/api/routes/messageRoutes';
import friendRequestRoutes from '@/api/routes/friendRequestRoutes';
import chatRoutes from '@/api/routes/chatRoutes';
// Import other routes

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/messsage', messsageRoutes);
app.use('/api/friendRequest', friendRequestRoutes);
app.use('/api/chat', chatRoutes);
// Add other routes

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});