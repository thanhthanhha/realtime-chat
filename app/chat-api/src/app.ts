import express from 'express';
import expressWs from 'express-ws';
import { connectRabbitMQ } from './config/rabbitmq';
import { setupDlxConsumer, setupNotificationDlxConsumer } from './services/rabbitmq.service'
import chatRouter, {mountRouter} from './routes/chat.routes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
expressWs(app);
mountRouter()

// RabbitMQ connection
connectRabbitMQ()
  .then(() => {
    console.log('RabbitMQ connected');
    setupDlxConsumer(); // Initialize DLX consumer
    setupNotificationDlxConsumer();
  })
  .catch((err) => console.error('Connection failed:', err));

// WebSocket routes
app.use('/ws', chatRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'api'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});