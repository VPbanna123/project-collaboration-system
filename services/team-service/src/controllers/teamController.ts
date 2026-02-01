import { Request, Response } from 'express';
import { TeamService } from '../services/teamService';
import { asyncHandler } from '@shared/middleware/errorHandler';
import { TeamRole } from '../../../node_modules/.prisma/team-client';
import { prisma } from '../lib/prisma';

// Helper function to get database user ID from Clerk ID
async function getUserIdFromClerkId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true }
  });
  return user?.id || null;
}

export class TeamController {
  // Get user teams
  static getUserTeams = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    
    // Look up user by Clerk ID to get database ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.json({ success: true, data: [] });
    }
    
    const teams = await TeamService.getUserTeams(user.id);
    res.json({ success: true, data: teams });
  });

  // Create team
  static createTeam = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const { name, description, imageUrl } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Team name is required' });
    }

    // Look up user by Clerk ID to get database ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found. Please refresh and try again.' 
      });
    }

    const team = await TeamService.createTeam({
      name,
      description,
      imageUrl,
      createdById: user.id,
    });

    res.status(201).json({ success: true, data: team, message: 'Team created' });
  });

  // Get team by ID
  static getTeamById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const team = await TeamService.getTeamById(id);

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    res.json({ success: true, data: team });
  });

  // Update team
  static updateTeam = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const { id } = req.params;
    const { name, description, imageUrl } = req.body;

    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const team = await TeamService.updateTeam(id, userId, {
      name,
      description,
      imageUrl,
    });

    res.json({ success: true, data: team, message: 'Team updated' });
  });

  // Delete team
  static deleteTeam = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const { id } = req.params;

    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await TeamService.deleteTeam(id, userId);
    res.json({ success: true, message: 'Team deleted' });
  });

  // Add member
  static addMember = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const { id } = req.params;
    const { userId: newUserId, role = 'MEMBER' } = req.body;

    if (!newUserId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }

    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const member = await TeamService.addMember(id, userId, newUserId, role as TeamRole);
    res.status(201).json({ success: true, data: member, message: 'Member added' });
  });

  // Remove member
  static removeMember = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const { id, memberId } = req.params;

    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await TeamService.removeMember(id, userId, memberId);
    res.json({ success: true, message: 'Member removed' });
  });

  // Update member role
  static updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, error: 'Role is required' });
    }

    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const member = await TeamService.updateMemberRole(id, userId, memberId, role as TeamRole);
    res.json({ success: true, data: member, message: 'Role updated' });
  });

  // Get invitations
  static getInvitations = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const { id } = req.params;

    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const invitations = await TeamService.getTeamInvitations(id, userId);
    res.json({ success: true, data: invitations });
  });

  // Get my invitations (for current user's email)
  static getMyInvitations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const invitations = await TeamService.getMyInvitations(email);
    res.json({ success: true, data: invitations });
  });

  // Send invitation
  static sendInvitation = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const { id } = req.params;
    const { email, role = 'MEMBER' } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const invitation = await TeamService.sendInvitation(id, userId, email, role as TeamRole);
    res.status(201).json({ success: true, data: invitation, message: 'Invitation sent' });
  });

  // Accept invitation
  static acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const { invitationId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await TeamService.acceptInvitation(invitationId, email, userId);
    res.json({ success: true, message: 'Invitation accepted' });
  });

  // Decline invitation
  static declineInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { invitationId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    await TeamService.declineInvitation(invitationId, email);
    res.json({ success: true, message: 'Invitation declined' });
  });
}
