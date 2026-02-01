import { Router } from 'express';
import { TeamChatController } from '../controllers/teamChatController';
import { clerkAuth, requireAuth } from '@shared/middleware/auth';

const router = Router();

// All routes require authentication
router.use(clerkAuth);
router.use(requireAuth);

// Team chat routes
router.get('/:teamId/messages', TeamChatController.getTeamMessages);
router.post('/:teamId/messages', TeamChatController.sendTeamMessage);
router.get('/:teamId/documents', TeamChatController.getSharedDocuments);

export default router;
