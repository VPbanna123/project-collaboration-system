// Common types shared across all microservices

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User types
export interface UserPayload {
  id: string;
  clerkId: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
}

// Team types
export interface TeamPayload {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdById: string;
}

export enum TeamRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

// Task types
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Notification types
export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMMENT = 'TASK_COMMENT',
  MENTION = 'MENTION',
  TEAM_INVITATION = 'TEAM_INVITATION',
}
