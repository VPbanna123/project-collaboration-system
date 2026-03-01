import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import documentRoutes from './routes/documentRoutes';
import { errorHandler } from '@shared/middleware/errorHandler';

// ============================================
// gRPC SERVER IMPORT
// ============================================
import { startGrpcServer } from './grpc/server';

dotenv.config();

// ============================================
// HTTP/REST API SERVER - External Communication
// ============================================
// This Express server handles HTTP requests from API Gateway

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'project-service' });
});

app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);

app.use(errorHandler);

// Start HTTP/REST server
app.listen(PORT, () => {
  console.log(`🚀 [HTTP Server] Project Service running on port ${PORT}`);
});

// ============================================
// START gRPC SERVER - Internal Communication
// ============================================
// This gRPC server handles internal service-to-service calls

const GRPC_PORT = parseInt(process.env.GRPC_PORT || '50003');
startGrpcServer(GRPC_PORT);

export default app;
