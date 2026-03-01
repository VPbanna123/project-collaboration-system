import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notificationRoutes from './routes/notificationRoutes';
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

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

// Start HTTP/REST server
app.listen(PORT, () => {
  console.log(`🚀 [HTTP Server] Notification Service running on port ${PORT}`);
});

// ============================================
// START gRPC SERVER - Internal Communication
// ============================================
// This gRPC server handles internal service-to-service calls
// It runs on a separate port from the HTTP REST API

const GRPC_PORT = parseInt(process.env.GRPC_PORT || '50005');
startGrpcServer(GRPC_PORT);

export default app;
