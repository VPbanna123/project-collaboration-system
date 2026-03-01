// ============================================
// gRPC SERVER - Internal Communication Only
// ============================================
// This gRPC server handles internal service-to-service calls
// It runs on a separate port from the HTTP REST API

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { notificationServiceImplementation } from './services/notificationServiceImpl';

const PROTO_PATH = path.join(__dirname, '../../../shared/proto/notification.proto');
const COMMON_PROTO_PATH = path.join(__dirname, '../../../shared/proto/common.proto');

// Load proto files
const packageDefinition = protoLoader.loadSync(
  [PROTO_PATH, COMMON_PROTO_PATH],
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [path.join(__dirname, '../../../shared/proto')],
  }
);

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const notificationProto = protoDescriptor.notification;

export function startGrpcServer(port: number = 50005): grpc.Server {
  const server = new grpc.Server();

  // Register NotificationService implementation
  server.addService(notificationProto.NotificationService.service, notificationServiceImplementation);

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error('[gRPC Server] Failed to bind:', err);
        return;
      }
      console.log(`🚀 [gRPC Server] Notification Service running on port ${boundPort}`);
    }
  );

  return server;
}
