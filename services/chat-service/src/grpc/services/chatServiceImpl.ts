// ============================================
// gRPC SERVICE IMPLEMENTATION - Chat Service
// ============================================
// This implements the gRPC ChatService interface
// Uses existing business logic from REST API

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import { prisma } from '../../lib/prisma';
import { handleGrpcError } from '@shared/grpc/errors';

// gRPC service implementation
export const chatServiceImplementation = {
  // GetChannelMessages - Get messages for a channel (projectId)
  GetChannelMessages: async (call: any, callback: any) => {
    try {
      const { channel_id, limit } = call.request;

      if (!channel_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Channel ID is required',
        });
      }

      const messages = await prisma.message.findMany({
        where: { projectId: channel_id },
        orderBy: { createdAt: 'desc' },
        take: limit || 50,
      });

      callback(null, {
        success: true,
        messages: messages.map((message) => ({
          id: message.id,
          content: message.content,
          channel_id: message.projectId,
          user_id: message.userId,
          user_name: 'User', // TODO: Fetch from user-service via gRPC if needed
          created_at: message.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('[gRPC ChatService] GetChannelMessages error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // SendMessage - Send a message to a channel (project)
  SendMessage: async (call: any, callback: any) => {
    try {
      const { content, channel_id, user_id } = call.request;

      if (!content || !channel_id || !user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Content, channel ID, and user ID are required',
        });
      }

      const message = await prisma.message.create({
        data: {
          content,
          projectId: channel_id,
          userId: user_id,
        },
      });

      callback(null, {
        success: true,
        message: {
          id: message.id,
          content: message.content,
          channel_id: message.projectId,
          user_id: message.userId,
          user_name: 'User', // TODO: Fetch from user-service via gRPC if needed
          created_at: message.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC ChatService] SendMessage error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // GetTeamChannels - Get all team chats for a team
  GetTeamChannels: async (call: any, callback: any) => {
    try {
      const { team_id } = call.request;

      if (!team_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Team ID is required',
        });
      }

      // Get team chat (create if doesn't exist)
      let teamChat = await prisma.teamChat.findUnique({
        where: { teamId: team_id },
      });

      if (!teamChat) {
        teamChat = await prisma.teamChat.create({
          data: { teamId: team_id },
        });
      }

      callback(null, {
        success: true,
        channels: [
          {
            id: teamChat.id,
            name: 'General',
            team_id: teamChat.teamId,
            created_at: teamChat.createdAt.toISOString(),
          },
        ],
      });
    } catch (error) {
      console.error('[gRPC ChatService] GetTeamChannels error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },
};
