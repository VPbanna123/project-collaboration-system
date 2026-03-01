// ============================================
// gRPC SERVICE IMPLEMENTATION - Team Service
// ============================================
// This implements the gRPC TeamService interface
// Uses existing TeamService business logic from REST API

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import { TeamService } from '../../services/teamService';
import { handleGrpcError } from '@shared/grpc/errors';
import { prisma } from '../../lib/prisma';
import { TeamRole } from '../../generated/prisma';

// gRPC service implementation
export const teamServiceImplementation = {
  // GetTeam - Get team by ID
  GetTeam: async (call: any, callback: any) => {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team ID is required',
        });
      }

      // Use Prisma directly to avoid cache type issues
      const team = await prisma.team.findUnique({
        where: { id },
      });

      if (!team) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Team not found',
        });
      }

      callback(null, {
        success: true,
        team: {
          id: team.id,
          name: team.name,
          description: team.description || '',
          owner_id: team.createdById,
          created_at: team.createdAt.toISOString(),
          updated_at: team.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC TeamService] GetTeam error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // GetUserTeams - Get all teams for a user
  GetUserTeams: async (call: any, callback: any) => {
    try {
      const { user_id } = call.request;

      if (!user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'User ID is required',
        });
      }

      // Use Prisma directly to avoid cache type issues
      const teams = await prisma.team.findMany({
        where: {
          members: {
            some: {
              userId: user_id,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      callback(null, {
        success: true,
        teams: teams.map((team) => ({
          id: team.id,
          name: team.name,
          description: team.description || '',
          owner_id: team.createdById,
          created_at: team.createdAt.toISOString(),
          updated_at: team.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('[gRPC TeamService] GetUserTeams error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // CreateTeam - Create a new team
  CreateTeam: async (call: any, callback: any) => {
    try {
      const { name, description, owner_id } = call.request;

      if (!name || !owner_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team name and owner ID are required',
        });
      }

      const team = await TeamService.createTeam({
        name,
        description,
        createdById: owner_id,
      });

      callback(null, {
        success: true,
        team: {
          id: team.id,
          name: team.name,
          description: team.description || '',
          owner_id: team.createdById,
          created_at: team.createdAt.toISOString(),
          updated_at: team.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC TeamService] CreateTeam error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // UpdateTeam - Update team details
  UpdateTeam: async (call: any, callback: any) => {
    try {
      const { id, name, description } = call.request;

      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team ID is required',
        });
      }

      // For internal gRPC calls, use Prisma directly (auth is handled by API Gateway)
      const team = await prisma.team.update({
        where: { id },
        data: {
          name,
          description,
        },
      });

      callback(null, {
        success: true,
        team: {
          id: team.id,
          name: team.name,
          description: team.description || '',
          owner_id: team.createdById,
          created_at: team.createdAt.toISOString(),
          updated_at: team.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC TeamService] UpdateTeam error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // DeleteTeam - Delete a team
  DeleteTeam: async (call: any, callback: any) => {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team ID is required',
        });
      }

      // For internal gRPC calls, use Prisma directly (auth is handled by API Gateway)
      await prisma.team.delete({
        where: { id },
      });

      callback(null, {
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error) {
      console.error('[gRPC TeamService] DeleteTeam error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // AddTeamMember - Add a member to a team
  AddTeamMember: async (call: any, callback: any) => {
    try {
      const { team_id, user_id, role } = call.request;

      if (!team_id || !user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team ID and User ID are required',
        });
      }

      // For internal gRPC calls, use Prisma directly (auth is handled by API Gateway)
      await prisma.teamMember.create({
        data: {
          teamId: team_id,
          userId: user_id,
          role: (role as TeamRole) || TeamRole.MEMBER,
        },
      });

      callback(null, {
        success: true,
        message: 'Member added successfully',
      });
    } catch (error) {
      console.error('[gRPC TeamService] AddTeamMember error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // RemoveTeamMember - Remove a member from a team
  RemoveTeamMember: async (call: any, callback: any) => {
    try {
      const { team_id, user_id } = call.request;

      if (!team_id || !user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team ID and User ID are required',
        });
      }

      // For internal gRPC calls, use Prisma directly (auth is handled by API Gateway)
      await prisma.teamMember.deleteMany({
        where: {
          teamId: team_id,
          userId: user_id,
        },
      });

      callback(null, {
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      console.error('[gRPC TeamService] RemoveTeamMember error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // GetTeamMembers - Get all members of a team
  GetTeamMembers: async (call: any, callback: any) => {
    try {
      const { team_id } = call.request;

      if (!team_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team ID is required',
        });
      }

      // Use Prisma directly to get team members
      const members = await prisma.teamMember.findMany({
        where: {
          teamId: team_id,
        },
        orderBy: {
          joinedAt: 'asc',
        },
      });

      callback(null, {
        success: true,
        members: members.map((member) => ({
          id: member.id,
          user_id: member.userId,
          team_id: member.teamId,
          role: member.role,
          joined_at: member.joinedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('[gRPC TeamService] GetTeamMembers error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // CheckAdmin - Check if user is admin of a team
  CheckAdmin: async (call: any, callback: any) => {
    try {
      const { team_id, user_id } = call.request;

      if (!team_id || !user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team ID and User ID are required',
        });
      }

      // Check if user is a member with ADMIN role
      const member = await prisma.teamMember.findFirst({
        where: {
          teamId: team_id,
          userId: user_id,
          role: TeamRole.ADMIN,
        },
      });

      callback(null, {
        is_admin: !!member,
        error: '',
      });
    } catch (error) {
      console.error('[gRPC TeamService] CheckAdmin error:', error);
      callback(null, {
        is_admin: false,
        error: 'Failed to check admin status',
      });
    }
  },

  // CheckMember - Check if user is a member of a team
  CheckMember: async (call: any, callback: any) => {
    try {
      const { team_id, user_id } = call.request;

      if (!team_id || !user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team ID and User ID are required',
        });
      }

      // Check if user is a member (any role)
      const member = await prisma.teamMember.findFirst({
        where: {
          teamId: team_id,
          userId: user_id,
        },
      });

      callback(null, {
        is_member: !!member,
        error: '',
      });
    } catch (error) {
      console.error('[gRPC TeamService] CheckMember error:', error);
      callback(null, {
        is_member: false,
        error: 'Failed to check membership',
      });
    }
  },
};
