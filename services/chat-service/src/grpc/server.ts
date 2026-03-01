// ============================================
// gRPC SERVER - Internal Communication Only
// ============================================
// This gRPC server handles internal service-to-service calls
// It runs on a separate port from the HTTP REST API

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { chatServiceImplementation } from './services/chatServiceImpl';

const PROTO_PATH = path.join(__dirname, '../../../shared/proto/chat.proto');
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
const chatProto = protoDescriptor.chat;

export function startGrpcServer(port: number = 50004): grpc.Server {
  const server = new grpc.Server();

  // Register ChatService implementation
  server.addService(chatProto.ChatService.service, chatServiceImplementation);

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error('[gRPC Server] Failed to bind:', err);
        return;
      }
      console.log(`🚀 [gRPC Server] Chat Service running on port ${boundPort}`);
    }
  );

  return server;
}
