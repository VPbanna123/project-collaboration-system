import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { verifyInternalApiKey } from '@shared/middleware/internalAuth';

const router = Router();

// Internal routes require only API key, not user authentication
router.use(verifyInternalApiKey);

// Check if user is a team member
router.get('/:teamId/check-member/:userId', TeamController.checkMembership);

export default router;
