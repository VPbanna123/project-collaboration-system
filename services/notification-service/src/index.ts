import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from '@shared/middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
});

export default app;
