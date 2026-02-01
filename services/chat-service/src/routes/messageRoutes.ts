import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { clerkAuth, requireAuth } from '@shared/middleware/auth';

const router = Router();

router.use(clerkAuth);
router.use(requireAuth);

router.get('/:projectId', MessageController.getMessages);
router.post('/', MessageController.sendMessage);

export default router;
