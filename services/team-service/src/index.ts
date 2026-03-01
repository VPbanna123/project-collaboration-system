import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import teamRoutes from './routes/teamRoutes';
import internalRoutes from './routes/internalRoutes';
import { errorHandler } from '@shared/middleware/errorHandler';

// ============================================
// gRPC SERVER IMPORT
// ============================================
import { startGrpcServer } from './grpc/server';

dotenv.config();

// ============================================
// HTTP/REST API SERVER - External Communication
// ============================================
// This Express server handles HTTP requests from:
// - API Gateway (proxied from frontend)
// - Internal routes for health checks

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
app.use('/api/teams', internalRoutes); // Internal routes

// Error handler
app.use(errorHandler);

// Start HTTP/REST server
app.listen(PORT, () => {
  console.log(`🚀 [HTTP Server] Team Service running on port ${PORT}`);
});

// ============================================
// START gRPC SERVER - Internal Communication
// ============================================
// This gRPC server handles internal service-to-service calls
// It runs on a separate port from the HTTP REST API

const GRPC_PORT = parseInt(process.env.GRPC_PORT || '50002');
startGrpcServer(GRPC_PORT);

export default app;
