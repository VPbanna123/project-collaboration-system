import { prisma } from '../lib/prisma';
import { CacheService } from '@shared/utils/cache';
import { AppError } from '@shared/middleware/errorHandler';
import { TeamRole } from '../../../node_modules/.prisma/team-client';
import { EmailService } from './emailService';

export class TeamService {
  /**
   * Create a new team
   */
  static async createTeam(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    createdById: string;
  }) {
    console.log('[TeamService] createTeam - Creating team with userId:', data.createdById);
    const team = await prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        createdById: data.createdById,
        members: {
          create: {
            userId: data.createdById,
            role: TeamRole.ADMIN,
          },
        },
      },
      include: {
        members: true,
      },
    });

    console.log('[TeamService] createTeam - Team created:', team.id, 'with member userId:', data.createdById);

    // Invalidate user teams cache
    await CacheService.del(`user_teams:${data.createdById}`);

    return team;
  }

  /**
   * Get team by ID
   */
  static async getTeamById(teamId: string) {
    const cacheKey = `team:${teamId}`;
    const cached = await CacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        invitations: {
          where: {
            status: 'PENDING',
          },
        },
      },
    });

    if (team) {
      await CacheService.set(cacheKey, team, 300);
    }

    return team;
  }

  /**
   * Get all teams for a user
   */
  static async getUserTeams(userId: string) {
    console.log('[TeamService] getUserTeams - Looking for teams with userId:', userId);
    const cacheKey = `user_teams:${userId}`;
    const cached = await CacheService.get(cacheKey);

    if (cached) {
      console.log('[TeamService] getUserTeams - Returning cached teams:', Array.isArray(cached) ? cached.length : 0);
      return cached;
    }

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          take: 5,
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    console.log('[TeamService] getUserTeams - Query returned teams:', teams.length);
    console.log('[TeamService] getUserTeams - Team IDs:', teams.map(t => t.id));

    await CacheService.set(cacheKey, teams, 300);

    return teams;
  }

  /**
   * Update team
   */
  static async updateTeam(
    teamId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string;
    }
  ) {
    // Check if user is admin
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member || member.role !== TeamRole.ADMIN) {
      throw new AppError('Only admins can update team', 403);
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data,
      include: {
        members: true,
      },
    });

    // Invalidate caches
    await CacheService.del(`team:${teamId}`);
    await CacheService.delPattern(`user_teams:*`);

    return team;
  }

  /**
   * Delete team
   */
  static async deleteTeam(teamId: string, userId: string) {
    // Check if user is creator
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    if (team.createdById !== userId) {
      throw new AppError('Only team creator can delete team', 403);
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    // Invalidate caches
    await CacheService.del(`team:${teamId}`);
    await CacheService.delPattern(`user_teams:*`);
  }

  /**
   * Add member to team
   */
  static async addMember(
    teamId: string,
    userId: string,
    newUserId: string,
    role: TeamRole = TeamRole.MEMBER
  ) {
    // Check if requesting user is admin
    const requesterMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!requesterMember || requesterMember.role !== TeamRole.ADMIN) {
      throw new AppError('Only admins can add members', 403);
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: newUserId,
        },
      },
    });

    if (existingMember) {
      throw new AppError('User is already a member', 400);
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId: newUserId,
        role,
      },
    });

    // Invalidate caches
    await CacheService.del(`team:${teamId}`);
    await CacheService.del(`user_teams:${newUserId}`);

    return member;
  }

  /**
   * Remove member from team
   */
  static async removeMember(teamId: string, userId: string, memberIdOrUserId: string) {
    // Check if requesting user is admin or removing themselves
    const requesterMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!requesterMember) {
      throw new AppError('You are not a member of this team', 403);
    }

    // First try to find member by ID (TeamMember.id)
    let memberToRemove = await prisma.teamMember.findUnique({
      where: { id: memberIdOrUserId },
    });

    // If not found by id, try finding by userId
    if (!memberToRemove) {
      memberToRemove = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: memberIdOrUserId,
          },
        },
      });
    }

    if (!memberToRemove) {
      throw new AppError('Member not found', 404);
    }

    // Check permissions - only admin can remove others, users can remove themselves
    if (requesterMember.role !== TeamRole.ADMIN && userId !== memberToRemove.userId) {
      throw new AppError('Only admins can remove other members', 403);
    }

    await prisma.teamMember.delete({
      where: { id: memberToRemove.id },
    });

    // Invalidate caches
    await CacheService.del(`team:${teamId}`);
    await CacheService.del(`user_teams:${memberToRemove.userId}`);
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    teamId: string,
    userId: string,
    memberIdOrUserId: string,
    newRole: TeamRole
  ) {
    // Check if requesting user is admin
    const requesterMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!requesterMember || requesterMember.role !== TeamRole.ADMIN) {
      throw new AppError('Only admins can update member roles', 403);
    }

    // First try to find member by ID (TeamMember.id)
    let memberToUpdate = await prisma.teamMember.findUnique({
      where: { id: memberIdOrUserId },
    });

    // If not found by id, try finding by userId
    if (!memberToUpdate) {
      memberToUpdate = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: memberIdOrUserId,
          },
        },
      });
    }

    if (!memberToUpdate) {
      throw new AppError('Member not found', 404);
    }

    const member = await prisma.teamMember.update({
      where: { id: memberToUpdate.id },
      data: {
        role: newRole,
      },
    });

    // Invalidate cache
    await CacheService.del(`team:${teamId}`);

    return member;
  }

  /**
   * Send team invitation
   */
  static async sendInvitation(
    teamId: string,
    userId: string,
    email: string,
    role: TeamRole = TeamRole.MEMBER
  ) {
    // Check if requesting user is admin
    const requesterMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!requesterMember || requesterMember.role !== TeamRole.ADMIN) {
      throw new AppError('Only admins can send invitations', 403);
    }

    // Get team details
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: {
        teamId_email: {
          teamId,
          email,
        },
      },
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      throw new AppError('Invitation already sent to this email', 400);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.teamInvitation.upsert({
      where: {
        teamId_email: {
          teamId,
          email,
        },
      },
      update: {
        status: 'PENDING',
        expiresAt,
        invitedBy: userId,
        role,
      },
      create: {
        teamId,
        email,
        role,
        invitedBy: userId,
        expiresAt,
      },
    });

    // Send invitation email (async, don't wait)
    EmailService.sendTeamInvitationEmail({
      email,
      teamName: team.name,
      inviterName: 'Team Admin', // User data is managed separately
      invitationId: invitation.id,
      role,
    }).catch((error) => {
      console.error('[TeamService] Failed to send invitation email:', error);
    });

    // Send in-app notification (async, don't wait)
    // Note: userId from email lookup would be needed - for now we just send the email
    // In production, you'd lookup user by email first
    this.sendInvitationNotification(email, team.name, invitation.id).catch((error) => {
      console.error('[TeamService] Failed to send invitation notification:', error);
    });

    return invitation;
  }

  /**
   * Get team invitations
   */
  static async getTeamInvitations(teamId: string, userId: string) {
    // Check if user is admin
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member || member.role !== TeamRole.ADMIN) {
      throw new AppError('Only admins can view invitations', 403);
    }

    return await prisma.teamInvitation.findMany({
      where: {
        teamId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get invitations for a specific email
   */
  static async getMyInvitations(email: string) {
    return await prisma.teamInvitation.findMany({
      where: {
        email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Accept invitation
   */
  static async acceptInvitation(invitationId: string, userEmail: string, userId: string) {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.email !== userEmail) {
      throw new AppError('This invitation is not for you', 403);
    }

    if (invitation.status !== 'PENDING') {
      throw new AppError('Invitation is no longer valid', 400);
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' },
      });
      throw new AppError('Invitation has expired', 400);
    }

    // Add user to team
    await prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId,
        role: invitation.role,
      },
    });

    // Update invitation status
    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'ACCEPTED' },
    });

    // Invalidate caches
    await CacheService.del(`team:${invitation.teamId}`);
    await CacheService.del(`user_teams:${userId}`);
  }

  /**
   * Decline invitation
   */
  static async declineInvitation(invitationId: string, userEmail: string) {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.email !== userEmail) {
      throw new AppError('This invitation is not for you', 403);
    }

    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'DECLINED' },
    });
  }

  /**
   * Send in-app notification for team invitation
   */
  private static async sendInvitationNotification(
    email: string,
    teamName: string,
    invitationId: string
  ) {
    const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    
    try {
      // Try to find user by email in our database using internal endpoint
      // This will work if the user has already signed up
      let targetUserId: string | null = null;
      
      try {
        const userResponse = await fetch(`${USER_SERVICE_URL}/api/users/internal/search?email=${encodeURIComponent(email)}`);
        if (userResponse.ok) {
          const userData = await userResponse.json() as { data?: { id?: string; clerkId?: string } };
          // Use database ID for notifications as that's what the foreign key expects
          if (userData?.data?.id) {
            targetUserId = userData.data.id;
          }
        }
      } catch (_error) {
        console.log('[TeamService] User not found in database, notification will be pending');
      }
      
      // If user exists, send notification using internal endpoint
      if (targetUserId) {
        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/internal/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: targetUserId,
            type: 'TEAM_INVITATION',
            title: 'Team Invitation',
            message: `You've been invited to join ${teamName}`,
            link: `/invitations/accept?id=${invitationId}`,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[TeamService] Notification service error: ${response.status}`, errorText);
          throw new Error(`Notification service returned ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log(`[TeamService] Sent notification for invitation ${invitationId} to user ${targetUserId}:`, result);
      } else {
        console.log(`[TeamService] User with email ${email} not found, skipping notification (email invitation sent)`);
      }
    } catch (error) {
      console.error('[TeamService] Failed to send notification:', error);
      // Don't throw - invitation was created, notification is optional
    }
  }
}
