/**
 * Inter-Service Communication Layer
 * Handles HTTP requests between microservices with:
 * - Circuit breaker pattern for fault tolerance
 * - Request retry with exponential backoff
 * - Response caching to minimize latency
 * - Timeout handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { redis } from './redis';

// Service URLs from environment variables
export const SERVICE_URLS = {
  USER: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  TEAM: process.env.TEAM_SERVICE_URL || 'http://localhost:3002',
  PROJECT: process.env.PROJECT_SERVICE_URL || 'http://localhost:3003',
  CHAT: process.env.CHAT_SERVICE_URL || 'http://localhost:3004',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
};

// Circuit breaker state
interface CircuitState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

const circuitBreakers = new Map<string, CircuitState>();

const CIRCUIT_THRESHOLD = 5; // Open circuit after 5 failures
const CIRCUIT_TIMEOUT = 30000; // Reset circuit after 30 seconds
const REQUEST_TIMEOUT = 5000; // 5 second timeout for requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Initial retry delay in ms

/**
 * Create service client with optimizations
 */
function createServiceClient(baseURL: string, serviceName: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for circuit breaker
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const circuit = getCircuitState(serviceName);
    
    if (circuit.isOpen) {
      const now = Date.now();
      if (now - circuit.lastFailureTime > CIRCUIT_TIMEOUT) {
        // Reset circuit breaker
        circuit.isOpen = false;
        circuit.failures = 0;
      } else {
        throw new Error(`Circuit breaker open for ${serviceName}`);
      }
    }
    
    return config;
  });

  // Response interceptor for circuit breaker
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Reset circuit on success
      resetCircuit(serviceName);
      return response;
    },
    (error: AxiosError) => {
      // Record failure
      recordFailure(serviceName);
      throw error;
    }
  );

  return client;
}

function getCircuitState(serviceName: string): CircuitState {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, {
      failures: 0,
      lastFailureTime: 0,
      isOpen: false,
    });
  }
  return circuitBreakers.get(serviceName)!;
}

function recordFailure(serviceName: string) {
  const circuit = getCircuitState(serviceName);
  circuit.failures++;
  circuit.lastFailureTime = Date.now();

  if (circuit.failures >= CIRCUIT_THRESHOLD) {
    circuit.isOpen = true;
    console.warn(`Circuit breaker opened for ${serviceName}`);
  }
}

function resetCircuit(serviceName: string) {
  const circuit = getCircuitState(serviceName);
  circuit.failures = 0;
  circuit.isOpen = false;
}

// Service clients
export const serviceClients = {
  user: createServiceClient(SERVICE_URLS.USER, 'user-service'),
  team: createServiceClient(SERVICE_URLS.TEAM, 'team-service'),
  project: createServiceClient(SERVICE_URLS.PROJECT, 'project-service'),
  chat: createServiceClient(SERVICE_URLS.CHAT, 'chat-service'),
  notification: createServiceClient(SERVICE_URLS.NOTIFICATION, 'notification-service'),
};

/**
 * Retry wrapper with exponential backoff
 */
async function retryRequest<T>(
  fn: () => Promise<AxiosResponse<T>>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<AxiosResponse<T>> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay * 2);
  }
}

/**
 * Generic service request with caching
 */
export async function serviceRequest<T>(
  service: keyof typeof serviceClients,
  endpoint: string,
  config?: AxiosRequestConfig,
  cacheKey?: string,
  cacheTTL: number = 60 // Cache for 60 seconds by default
): Promise<T> {
  // Check cache first for GET requests
  if (config?.method === 'GET' || !config?.method) {
    if (cacheKey) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    }
  }

  // Make request with retry
  const response = await retryRequest(() =>
    serviceClients[service].request<T>({
      url: endpoint,
      ...config,
    })
  );

  // Cache successful GET responses
  if ((config?.method === 'GET' || !config?.method) && cacheKey) {
    await redis.setex(cacheKey, cacheTTL, JSON.stringify(response.data));
  }

  return response.data as T;
}

/**
 * Invalidate cache for a specific key pattern
 */
export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

// Types for API responses
interface User {
  id: string;
  userId: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

/**
 * User Service API
 */
export const userServiceAPI = {
  async getUser(userId: string) {
    return serviceRequest<User>(
      'user',
      `/api/users/${userId}`,
      { method: 'GET' },
      `user:${userId}`,
      300 // Cache for 5 minutes
    );
  },

  async getUserByClerkId(clerkId: string) {
    return serviceRequest<User>(
      'user',
      `/api/users/clerk/${clerkId}`,
      { method: 'GET' },
      `user:clerk:${clerkId}`,
      300
    );
  },

  async getUsers(userIds: string[]) {
    return serviceRequest<User[]>(
      'user',
      `/api/users/batch`,
      { method: 'POST', data: { userIds } },
      `users:${userIds.join(',')}`,
      180 // Cache for 3 minutes
    );
  },
};

/**
 * Team Service API
 */
export const teamServiceAPI = {
  async getTeam(teamId: string) {
    return serviceRequest<Team>(
      'team',
      `/api/teams/${teamId}`,
      { method: 'GET' },
      `team:${teamId}`,
      120
    );
  },

  async getTeamMembers(teamId: string) {
    return serviceRequest<User[]>(
      'team',
      `/api/teams/${teamId}/members`,
      { method: 'GET' },
      `team:${teamId}:members`,
      60
    );
  },

  async isUserInTeam(teamId: string, userId: string) {
    return serviceRequest<boolean>(
      'team',
      `/api/teams/${teamId}/members/${userId}/check`,
      { method: 'GET' },
      `team:${teamId}:member:${userId}`,
      120
    );
  },
};

/**
 * Project Service API
 */
export const projectServiceAPI = {
  async getProject(projectId: string) {
    return serviceRequest<Project>(
      'project',
      `/api/projects/${projectId}`,
      { method: 'GET' },
      `project:${projectId}`,
      120
    );
  },

  async getProjectsByTeam(teamId: string) {
    return serviceRequest<Project[]>(
      'project',
      `/api/projects/team/${teamId}`,
      { method: 'GET' },
      `projects:team:${teamId}`,
      60
    );
  },

  async getTask(taskId: string) {
    return serviceRequest<{ id: string; title: string; status: string }>(
      'project',
      `/api/tasks/${taskId}`,
      { method: 'GET' },
      `task:${taskId}`,
      60
    );
  },
};

/**
 * Notification Service API
 */
export const notificationServiceAPI = {
  async createNotification(data: { userId: string; type: string; title: string; message: string }) {
    const result = await serviceRequest<Notification>(
      'notification',
      `/api/notifications`,
      { method: 'POST', data }
    );
    
    // Invalidate user notification cache
    await invalidateCache(`notifications:user:${data.userId}:*`);
    
    return result;
  },

  async getUserNotifications(userId: string, unreadOnly = false) {
    return serviceRequest<Notification[]>(
      'notification',
      `/api/notifications/user/${userId}${unreadOnly ? '?unread=true' : ''}`,
      { method: 'GET' },
      `notifications:user:${userId}:${unreadOnly ? 'unread' : 'all'}`,
      30
    );
  },
};

export const serviceClientExports = {
  serviceClients,
  serviceRequest,
  invalidateCache,
  userServiceAPI,
  teamServiceAPI,
  projectServiceAPI,
  notificationServiceAPI,
};

export default serviceClientExports;
