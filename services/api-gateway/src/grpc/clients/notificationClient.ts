// ============================================
// gRPC CLIENT - Notification Service
// ============================================
// This client is used by API Gateway to call Notification Service via gRPC
// Can be used for sending notifications from gateway

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { GRPC_HOSTS } from '@shared/grpc/config';

const PROTO_PATH = path.join(__dirname, '../../../../shared/proto/notification.proto');
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
const notificationProto = protoDescriptor.notification;

class NotificationServiceClient {
  private client: any;

  constructor() {
    this.client = new notificationProto.NotificationService(
      GRPC_HOSTS.NOTIFICATION_SERVICE,
      grpc.credentials.createInsecure()
    );
  }

  // Send notification
  async sendNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.SendNotification(
        {
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || '',
        },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC NotificationClient] SendNotification error:', error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // Get user notifications
  async getUserNotifications(userId: string, limit?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetUserNotifications(
        {
          user_id: userId,
          limit: limit || 20,
        },
        (error: any, response: any) => {
          if (error) {
            console.error('[gRPC NotificationClient] GetUserNotifications error:', error);
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
export const notificationServiceClient = new NotificationServiceClient();
