import { Router } from 'express';
import { TeamChatController } from '../controllers/teamChatController';
import { verifyInternalToken } from '@shared/middleware/internalAuth';

const router = Router();

// All routes require authentication from API Gateway
router.use(verifyInternalToken);

// Team chat routes
router.get('/:teamId/messages', TeamChatController.getTeamMessages);
router.post('/:teamId/messages', TeamChatController.sendTeamMessage);
router.get('/:teamId/documents', TeamChatController.getSharedDocuments);

export default router;
