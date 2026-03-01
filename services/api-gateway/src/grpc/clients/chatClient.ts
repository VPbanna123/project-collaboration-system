// ============================================
// gRPC CLIENT - Chat Service
// ============================================
// This client is used by API Gateway to call Chat Service via gRPC
// Replaces axios HTTP calls with gRPC for better performance

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { GRPC_HOSTS } from '@shared/grpc/config';

const PROTO_PATH = path.join(__dirname, '../../../../shared/proto/chat.proto');
const COMMON_PROTO_PATH = path.join(__dirname, '../../../../shared/proto/common.proto');

// Load proto files
const packageDefinition = protoLoader.loadSync(
  [PROTO_PATH, COMMON_PROTO_PATH],
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [path.join(__dirname, '../../../../shared/proto')],
  }
);

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const chatProto = protoDescriptor.chat;

class ChatServiceClient {
  private client: any;

  constructor() {
    this.client = new chatProto.ChatService(
      GRPC_HOSTS.CHAT_SERVICE,
      grpc.credentials.createInsecure()
    );
  }

  // Get channel messages
  async getChannelMessages(channelId: string, limit?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetChannelMessages(
        {
          channel_id: channelId,
          limit: limit || 50,
        },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC ChatClient] GetChannelMessages error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Send message
  async sendMessage(data: {
    channelId: string;
    userId: string;
    content: string;
    type?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.SendMessage(
        {
          channel_id: data.channelId,
          user_id: data.userId,
          content: data.content,
          type: data.type || 'text',
        },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC ChatClient] SendMessage error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Get team channels
  async getTeamChannels(teamId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetTeamChannels({ team_id: teamId }, (error: any, response: any) => {
        if (error) {
          console.error('[gRPC ChatClient] GetTeamChannels error:', error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Export singleton instance
export const chatServiceClient = new ChatServiceClient();
