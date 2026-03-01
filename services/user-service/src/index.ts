import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import webhookRoutes from './routes/webhookRoutes';
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
// - Webhooks from external services (Clerk, etc.)

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/webhook', webhookRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start HTTP/REST server
app.listen(PORT, () => {
  console.log(`🚀 [HTTP Server] User Service running on port ${PORT}`);
});

// ============================================
// START gRPC SERVER - Internal Communication
// ============================================
// This gRPC server handles internal service-to-service calls
// It runs on a separate port from the HTTP REST API

const GRPC_PORT = parseInt(process.env.GRPC_PORT || '50001');
startGrpcServer(GRPC_PORT);

export default app;
