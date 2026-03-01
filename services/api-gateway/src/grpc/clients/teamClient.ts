// ============================================
// gRPC CLIENT - Team Service
// ============================================
// This client is used by API Gateway to call Team Service via gRPC
// Replaces axios HTTP calls with gRPC for better performance

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { GRPC_HOSTS } from '@shared/grpc/config';

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
    this.client = new teamProto.TeamService(
      GRPC_HOSTS.TEAM_SERVICE,
      grpc.credentials.createInsecure()
    );
  }

  // Get team by ID
  async getTeam(teamId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetTeam({ id: teamId }, (error: any, response: any) => {
        if (error) {
          console.error('[gRPC TeamClient] GetTeam error:', error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  // Get user teams
  async getUserTeams(userId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetUserTeams({ user_id: userId }, (error: any, response: any) => {
        if (error) {
          console.error('[gRPC TeamClient] GetUserTeams error:', error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  // Create team
  async createTeam(data: {
    name: string;
    description?: string;
    ownerId: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.CreateTeam(
        {
          name: data.name,
          description: data.description || '',
          owner_id: data.ownerId,
        },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC TeamClient] CreateTeam error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Add team member
  async addTeamMember(data: {
    teamId: string;
    userId: string;
    role?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.AddTeamMember(
        {
          team_id: data.teamId,
          user_id: data.userId,
          role: data.role || 'member',
        },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC TeamClient] AddTeamMember error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Remove team member
  async removeTeamMember(teamId: string, userId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.RemoveTeamMember(
        { team_id: teamId, user_id: userId },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC TeamClient] RemoveTeamMember error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Get team members
  async getTeamMembers(teamId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetTeamMembers({ team_id: teamId }, (error: any, response: any) => {
        if (error) {
          console.error('[gRPC TeamClient] GetTeamMembers error:', error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Export singleton instance
export const teamServiceClient = new TeamServiceClient();
