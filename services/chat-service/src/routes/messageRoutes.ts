import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { verifyInternalToken } from '@shared/middleware/internalAuth';

const router = Router();

// All routes require authentication from API Gateway
router.use(verifyInternalToken);

router.get('/:projectId', MessageController.getMessages);
router.post('/', MessageController.sendMessage);

export default router;
