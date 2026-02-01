import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import documentRoutes from './routes/documentRoutes';
import { errorHandler } from '@shared/middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'project-service' });
});

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Project Service running on port ${PORT}`);
});

export default app;
