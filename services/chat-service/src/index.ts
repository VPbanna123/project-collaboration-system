import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import messageRoutes from './routes/messageRoutes';
import conversationRoutes from './routes/conversationRoutes';
import teamChatRoutes from './routes/teamChatRoutes';
import { errorHandler } from '@shared/middleware/errorHandler';
import { setupSocketHandlers } from './sockets/chatSocket';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3004;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  // Performance optimizations
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Setup Redis adapter for scalability (multiple server instances)
async function setupRedisAdapter() {
  try {
    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();
    
    await Promise.all([pubClient.connect(), subClient.connect()]);
    
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter connected for Socket.IO');
  } catch (error) {
    console.error('❌ Redis adapter connection failed, using in-memory adapter:', error);
    // Falls back to in-memory adapter automatically
  }
}

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chat-service' });
});

// API Routes
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/teams', teamChatRoutes);

app.use(errorHandler);

// Initialize and start server
async function startServer() {
  await setupRedisAdapter();
  
  // Setup Socket.IO handlers
  setupSocketHandlers(io);
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Chat Service running on port ${PORT}`);
  });
}

startServer();

export { app, io };
