// ============================================
// gRPC CLIENT - Project Service
// ============================================
// This client is used by API Gateway to call Project Service via gRPC
// Replaces axios HTTP calls with gRPC for better performance

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { GRPC_HOSTS } from '@shared/grpc/config';

const PROTO_PATH = path.join(__dirname, '../../../../shared/proto/project.proto');
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
const projectProto = protoDescriptor.project;

class ProjectServiceClient {
  private client: any;

  constructor() {
    this.client = new projectProto.ProjectService(
      GRPC_HOSTS.PROJECT_SERVICE,
      grpc.credentials.createInsecure()
    );
  }

  // Get project by ID
  async getProject(projectId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetProject({ id: projectId }, (error: any, response: any) => {
        if (error) {
          console.error('[gRPC ProjectClient] GetProject error:', error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  // Get team projects
  async getTeamProjects(teamId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetTeamProjects({ team_id: teamId }, (error: any, response: any) => {
        if (error) {
          console.error('[gRPC ProjectClient] GetTeamProjects error:', error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  // Create project
  async createProject(data: {
    name: string;
    description?: string;
    teamId: string;
    createdBy: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.CreateProject(
        {
          name: data.name,
          description: data.description || '',
          team_id: data.teamId,
          created_by: data.createdBy,
        },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC ProjectClient] CreateProject error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Update project
  async updateProject(data: {
    id: string;
    name?: string;
    description?: string;
    status?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.UpdateProject(
        {
          id: data.id,
          name: data.name || '',
          description: data.description || '',
          status: data.status || '',
        },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC ProjectClient] UpdateProject error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Delete project
  async deleteProject(projectId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.DeleteProject({ id: projectId }, (error: any, response: any) => {
        if (error) {
          console.error('[gRPC ProjectClient] DeleteProject error:', error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Export singleton instance
export const projectServiceClient = new ProjectServiceClient();
