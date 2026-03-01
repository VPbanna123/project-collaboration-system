/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';

// Logging interceptor
export function loggingInterceptor(
  options: any,
  nextCall: (options: any) => grpc.InterceptingCall
): grpc.InterceptingCall {
  return new grpc.InterceptingCall(nextCall(options), {
    start: function (metadata, listener, next) {
      console.log(`[gRPC Client] Calling ${options.method_definition.path}`);
      next(metadata, {
        onReceiveMetadata: function (metadata, next) {
          next(metadata);
        },
        onReceiveMessage: function (message, next) {
          console.log(`[gRPC Client] Received response from ${options.method_definition.path}`);
          next(message);
        },
        onReceiveStatus: function (status, next) {
          if (status.code !== grpc.status.OK) {
            console.error(`[gRPC Client] Error: ${status.code} - ${status.details}`);
          }
          next(status);
        },
      });
    },
  });
}

// Error handling interceptor
export function errorInterceptor(
  options: any,
  nextCall: (options: any) => grpc.InterceptingCall
): grpc.InterceptingCall {
  return new grpc.InterceptingCall(nextCall(options), {
    start: function (metadata, listener, next) {
      next(metadata, {
        onReceiveStatus: function (status, next) {
          if (status.code !== grpc.status.OK) {
            console.error(`[gRPC Error] ${options.method_definition.path}:`, {
              code: status.code,
              details: status.details,
            });
          }
          next(status);
        },
      });
    },
  });
}