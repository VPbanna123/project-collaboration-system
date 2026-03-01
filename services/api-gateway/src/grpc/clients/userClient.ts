// ============================================
// gRPC CLIENT - User Service
// ============================================
// This client is used by API Gateway to call User Service via gRPC
// Replaces HTTP/axios calls for internal communication

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { GRPC_HOSTS } from '@shared/grpc/config';

const PROTO_PATH = path.join(__dirname, '../../../../shared/proto/user.proto');
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
const userProto = protoDescriptor.user;

class UserServiceClient {
  private client: any;

  constructor() {
    this.client = new userProto.UserService(
      GRPC_HOSTS.USER_SERVICE,
      grpc.credentials.createInsecure()
    );
  }

  // Get user by Clerk ID
  async getUserByClerkId(clerkId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetUserByClerkId(
        { clerk_id: clerkId },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC UserClient] GetUserByClerkId error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Get user by ID
  async getUser(userId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetUser(
        { id: userId },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC UserClient] GetUser error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Sync user
  async syncUser(data: {
    clerkId: string;
    email: string;
    name?: string;
    imageUrl?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.SyncUser(
        {
          clerk_id: data.clerkId,
          email: data.email,
          name: data.name || '',
          image_url: data.imageUrl || '',
        },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC UserClient] SyncUser error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}

// Export singleton instance
export const userServiceClient = new UserServiceClient();
