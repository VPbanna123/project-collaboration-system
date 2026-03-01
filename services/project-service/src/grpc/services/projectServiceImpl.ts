// ============================================
// gRPC SERVICE IMPLEMENTATION - Project Service
// ============================================
// This implements the gRPC ProjectService interface
// Uses existing ProjectService business logic from REST API

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import { prisma } from '../../lib/prisma';
import { handleGrpcError } from '@shared/grpc/errors';

// gRPC service implementation
export const projectServiceImplementation = {
  // GetProject - Get project by ID
  GetProject: async (call: any, callback: any) => {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Project ID is required',
        });
      }

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Project not found',
        });
      }

      callback(null, {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description || '',
          team_id: project.teamId,
          created_by: '', // Field not in Project schema
          status: 'ACTIVE', // Default status (field not in schema)
          created_at: project.createdAt.toISOString(),
          updated_at: project.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC ProjectService] GetProject error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // GetTeamProjects - Get all projects for a team
  GetTeamProjects: async (call: any, callback: any) => {
    try {
      const { team_id } = call.request;

      if (!team_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team ID is required',
        });
      }

      const projects = await prisma.project.findMany({
        where: { teamId: team_id },
        orderBy: { createdAt: 'desc' },
      });

      callback(null, {
        success: true,
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          team_id: project.teamId,
          created_by: '', // Field not in Project schema
          status: 'ACTIVE', // Default status (field not in schema)
          created_at: project.createdAt.toISOString(),
          updated_at: project.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('[gRPC ProjectService] GetTeamProjects error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // CreateProject - Create a new project
  CreateProject: async (call: any, callback: any) => {
    try {
      const { name, description, team_id, created_by } = call.request;

      if (!name || !team_id || !created_by) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Project name, team ID, and creator ID are required',
        });
      }

      const project = await prisma.project.create({
        data: {
          name,
          description,
          teamId: team_id,
        },
      });

      callback(null, {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description || '',
          team_id: project.teamId,
          created_by: created_by || '', // Store in proto but not in DB
          status: 'ACTIVE', // Default status (field not in schema)
          created_at: project.createdAt.toISOString(),
          updated_at: project.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC ProjectService] CreateProject error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // UpdateProject - Update project details
  UpdateProject: async (call: any, callback: any) => {
    try {
      const { id, name, description, status } = call.request;

      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Project ID is required',
        });
      }

      const project = await prisma.project.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      callback(null, {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description || '',
          team_id: project.teamId,
          created_by: '', // Field not in Project schema
          status: status || 'ACTIVE', // Use provided status or default
          created_at: project.createdAt.toISOString(),
          updated_at: project.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC ProjectService] UpdateProject error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // DeleteProject - Delete a project
  DeleteProject: async (call: any, callback: any) => {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Project ID is required',
        });
      }

      await prisma.project.delete({
        where: { id },
      });

      callback(null, {
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('[gRPC ProjectService] DeleteProject error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },
};
