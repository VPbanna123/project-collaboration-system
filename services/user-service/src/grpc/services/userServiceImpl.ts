// ============================================
// gRPC SERVICE IMPLEMENTATION - User Service
// ============================================
// This implements the gRPC UserService interface
// Uses existing UserService business logic from REST API

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import { handleGrpcError } from '@shared/grpc/errors';
import { prisma } from '../../lib/prisma';

// gRPC service implementation
export const userServiceImplementation = {
  // GetUser - Get user by ID
  GetUser: async (call: any, callback: any) => {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'User ID is required',
        });
      }

      // Use Prisma directly to get full user with timestamps
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found',
        });
      }

      callback(null, {
        success: true,
        user: {
          id: user.id,
          clerk_id: user.clerkId,
          email: user.email,
          name: user.name || '',
          image_url: user.imageUrl || '',
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC UserService] GetUser error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // GetUserByClerkId - Get user by Clerk ID
  GetUserByClerkId: async (call: any, callback: any) => {
    try {
      const { clerk_id } = call.request;

      if (!clerk_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Clerk ID is required',
        });
      }

      // Use Prisma directly to get full user with timestamps
      const user = await prisma.user.findUnique({
        where: { clerkId: clerk_id },
      });

      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found',
        });
      }

      callback(null, {
        success: true,
        user: {
          id: user.id,
          clerk_id: user.clerkId,
          email: user.email,
          name: user.name || '',
          image_url: user.imageUrl || '',
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC UserService] GetUserByClerkId error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // GetUsersByIds - Get multiple users by their IDs
  GetUsersByIds: async (call: any, callback: any) => {
    try {
      const { ids } = call.request;

      if (!ids || ids.length === 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'At least one user ID is required',
        });
      }

      // Use Prisma directly to get full users with timestamps
      const users = await prisma.user.findMany({
        where: {
          id: { in: ids },
        },
      });

      callback(null, {
        success: true,
        users: users.map((user) => ({
          id: user.id,
          clerk_id: user.clerkId,
          email: user.email,
          name: user.name || '',
          image_url: user.imageUrl || '',
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('[gRPC UserService] GetUsersByIds error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // CreateUser - Create a new user
  CreateUser: async (call: any, callback: any) => {
    try {
      const { clerk_id, email, name, image_url } = call.request;

      if (!clerk_id || !email) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Clerk ID and email are required',
        });
      }

      // Use Prisma directly to create user and get timestamps
      const user = await prisma.user.create({
        data: {
          clerkId: clerk_id,
          email,
          name,
          imageUrl: image_url,
        },
      });

      callback(null, {
        success: true,
        user: {
          id: user.id,
          clerk_id: user.clerkId,
          email: user.email,
          name: user.name || '',
          image_url: user.imageUrl || '',
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC UserService] CreateUser error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // UpdateUser - Update user details
  UpdateUser: async (call: any, callback: any) => {
    try {
      const { id, name, image_url } = call.request;

      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'User ID is required',
        });
      }

      // Use Prisma directly to update user and get timestamps
      const user = await prisma.user.update({
        where: { id },
        data: {
          name,
          imageUrl: image_url,
        },
      });

      callback(null, {
        success: true,
        user: {
          id: user.id,
          clerk_id: user.clerkId,
          email: user.email,
          name: user.name || '',
          image_url: user.imageUrl || '',
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC UserService] UpdateUser error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // DeleteUser - Delete a user
  DeleteUser: async (call: any, callback: any) => {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'User ID is required',
        });
      }

      // Use Prisma directly to delete user
      await prisma.user.delete({
        where: { id },
      });

      callback(null, {
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('[gRPC UserService] DeleteUser error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // SyncUser - Sync user with Clerk data
  SyncUser: async (call: any, callback: any) => {
    try {
      const { clerk_id, email, name, image_url } = call.request;

      if (!clerk_id || !email) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Clerk ID and email are required',
        });
      }

      // Use Prisma directly to upsert user and get timestamps
      const user = await prisma.user.upsert({
        where: { clerkId: clerk_id },
        update: {
          name,
          email,
          imageUrl: image_url,
        },
        create: {
          clerkId: clerk_id,
          email,
          name,
          imageUrl: image_url,
        },
      });

      callback(null, {
        success: true,
        user: {
          id: user.id,
          clerk_id: user.clerkId,
          email: user.email,
          name: user.name || '',
          image_url: user.imageUrl || '',
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC UserService] SyncUser error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },
};
