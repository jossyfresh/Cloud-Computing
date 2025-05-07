import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { moderationRouter } from './routes/moderation.js';
// import { DbService } from './services/dbService.js';

const app = express();
const PORT = process.env.PORT || 3002; // Using 3001 since Next.js typically uses 3000

// Connect to MongoDB
// DbService.connect().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', moderationRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
