import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { clerkAuth, requireAuth } from '@shared/middleware/auth';

const router = Router();

router.use(clerkAuth);
router.use(requireAuth);

router.post('/', TaskController.createTask);
router.get('/:id', TaskController.getTaskById);
router.put('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);
router.post('/:id/comments', TaskController.addComment);
router.get('/:id/comments', TaskController.getComments);

export default router;
