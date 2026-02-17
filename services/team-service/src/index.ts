import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import teamRoutes from './routes/teamRoutes';
import { errorHandler } from '@shared/middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[Team Service] ${req.method} ${req.path} - Headers:`, {
    'x-internal-token': req.headers['x-internal-token'] ? 'present' : 'missing',
    'x-user-id': req.headers['x-user-id'],
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'team-service' });
});

// Routes
app.use('/api/teams', teamRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Team Service running on port ${PORT}`);
});

export default app;
