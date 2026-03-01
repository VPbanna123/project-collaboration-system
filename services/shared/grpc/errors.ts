import * as grpc from '@grpc/grpc-js';

export class GrpcError extends Error {
  code: grpc.status;
  
  constructor(code: grpc.status, message: string) {
    super(message);
    this.code = code;
    this.name = 'GrpcError';
  }
}

export const GrpcErrors = {
  notFound: (message: string) => new GrpcError(grpc.status.NOT_FOUND, message),
  invalidArgument: (message: string) => new GrpcError(grpc.status.INVALID_ARGUMENT, message),
  alreadyExists: (message: string) => new GrpcError(grpc.status.ALREADY_EXISTS, message),
  permissionDenied: (message: string) => new GrpcError(grpc.status.PERMISSION_DENIED, message),
  internal: (message: string) => new GrpcError(grpc.status.INTERNAL, message),
  unavailable: (message: string) => new GrpcError(grpc.status.UNAVAILABLE, message),
};

export function handleGrpcError(error: unknown): { code: grpc.status; message: string } {
  if (error instanceof GrpcError) {
    return { code: error.code, message: error.message };
  }
  
  console.error('[gRPC] Unhandled error:', error);
  return { 
    code: grpc.status.INTERNAL, 
    message: error instanceof Error ? error.message : 'Internal server error' 
  };
}