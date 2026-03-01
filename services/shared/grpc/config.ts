// gRPC Configuration
export const GRPC_PORTS = {
  USER_SERVICE: parseInt(process.env.USER_GRPC_PORT || '50001'),
  TEAM_SERVICE: parseInt(process.env.TEAM_GRPC_PORT || '50002'),
  PROJECT_SERVICE: parseInt(process.env.PROJECT_GRPC_PORT || '50003'),
  CHAT_SERVICE: parseInt(process.env.CHAT_GRPC_PORT || '50004'),
  NOTIFICATION_SERVICE: parseInt(process.env.NOTIFICATION_GRPC_PORT || '50005'),
};

export const GRPC_HOSTS = {
  USER_SERVICE: process.env.USER_SERVICE_GRPC || 'localhost:50001',
  TEAM_SERVICE: process.env.TEAM_SERVICE_GRPC || 'localhost:50002',
  PROJECT_SERVICE: process.env.PROJECT_SERVICE_GRPC || 'localhost:50003',
  CHAT_SERVICE: process.env.CHAT_SERVICE_GRPC || 'localhost:50004',
  NOTIFICATION_SERVICE: process.env.NOTIFICATION_SERVICE_GRPC || 'localhost:50005',
};

export const GRPC_OPTIONS = {
  'grpc.max_receive_message_length': 1024 * 1024 * 10, // 10MB
  'grpc.max_send_message_length': 1024 * 1024 * 10, // 10MB
};