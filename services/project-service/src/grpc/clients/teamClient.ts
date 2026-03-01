// ============================================
// gRPC CLIENT - Team Service
// ============================================
// This client is used by Project Service to call Team Service via gRPC
// For checking admin status and team membership

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.join(__dirname, '../../../../shared/proto/team.proto');
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
const teamProto = protoDescriptor.team;

class TeamServiceClient {
  private client: any;

  constructor() {
    const teamServiceGrpc = process.env.TEAM_SERVICE_GRPC || 'localhost:50002';
    this.client = new teamProto.TeamService(
      teamServiceGrpc,
      grpc.credentials.createInsecure()
    );
    console.log(`[gRPC TeamClient] Connected to Team Service at ${teamServiceGrpc}`);
  }

  // Check if user is admin of a team
  async checkAdmin(teamId: string, userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.CheckAdmin(
        { team_id: teamId, user_id: userId },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC TeamClient] CheckAdmin error:', error);
            reject(error);
          } else {
            resolve(response.is_admin || false);
          }
        }
      );
    });
  }

  // Check if user is a member of a team
  async checkMember(teamId: string, userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.CheckMember(
        { team_id: teamId, user_id: userId },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC TeamClient] CheckMember error:', error);
            reject(error);
          } else {
            resolve(response.is_member || false);
          }
        }
      );
    });
  }
}

// Export singleton instance
export const teamServiceClient = new TeamServiceClient();
