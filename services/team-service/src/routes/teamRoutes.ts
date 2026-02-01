import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { clerkAuth, requireAuth } from '@shared/middleware/auth';

const router = Router();

// All routes require authentication
router.use(clerkAuth);
router.use(requireAuth);

// Team routes
router.get('/', TeamController.getUserTeams);
router.post('/', TeamController.createTeam);
router.get('/:id', TeamController.getTeamById);
router.put('/:id', TeamController.updateTeam);
router.delete('/:id', TeamController.deleteTeam);

// Member routes
router.post('/:id/members', TeamController.addMember);
router.delete('/:id/members/:memberId', TeamController.removeMember);
router.patch('/:id/members/:memberId', TeamController.updateMemberRole);

// Invitation routes
router.get('/invitations/my', TeamController.getMyInvitations);
router.get('/:id/invitations', TeamController.getInvitations);
router.post('/:id/invitations', TeamController.sendInvitation);
router.post('/invitations/:invitationId/accept', TeamController.acceptInvitation);
router.post('/invitations/:invitationId/decline', TeamController.declineInvitation);

export default router;
