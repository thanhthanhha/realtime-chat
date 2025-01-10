import express from 'express';
import userRoutes from './api/routes/userRoutes';
// Import other routes

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
// Add other routes

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});