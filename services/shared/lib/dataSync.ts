/**
 * Data Synchronization Helper
 * Handles synchronization of denormalized data across services
 * Uses event-driven approach with Redis pub/sub
 */

import { redis } from './redis';
import { invalidateCache } from './serviceClient';

// Type for Prisma client with UserSnapshot model
interface PrismaWithUserSnapshot {
  userSnapshot: {
    upsert: (args: {
      where: { userId: string };
      create: {
        id: string;
        userId: string;
        email: string;
        name: string | null;
        imageUrl: string | null;
      };
      update: {
        email: string;
        name: string | null;
        imageUrl: string | null;
      };
    }) => Promise<unknown>;
  };
}

// Event types
export enum SyncEvent {
  USER_CREATED = 'user:created',
  USER_UPDATED = 'user:updated',
  USER_DELETED = 'user:deleted',
  TEAM_CREATED = 'team:created',
  TEAM_UPDATED = 'team:updated',
  TEAM_DELETED = 'team:deleted',
}

interface UserSyncData {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

/**
 * Publish sync event to Redis
 */
export async function publishSyncEvent(
  event: SyncEvent,
  data: UserSyncData
): Promise<void> {
  try {
    await redis.publish(event, JSON.stringify(data));
    console.log(`Published sync event: ${event}`, data);
  } catch (error) {
    console.error('Failed to publish sync event:', error);
    throw error;
  }
}

/**
 * Subscribe to sync events
 */
export function subscribeSyncEvent(
  event: SyncEvent,
  handler: (data: UserSyncData) => Promise<void>
) {
  const subscriber = redis.duplicate();
  
  subscriber.on('message', async (channel: string, message: string) => {
    if (channel === event) {
      try {
        const data = JSON.parse(message) as UserSyncData;
        await handler(data);
      } catch (error) {
        console.error(`Error handling sync event ${event}:`, error);
      }
    }
  });

  subscriber.subscribe(event);
  
  return subscriber;
}

/**
 * Sync user data to UserSnapshot table in other services
 * Call this from user-service when user is created/updated
 */
export async function syncUserSnapshot(userData: UserSyncData) {
  await publishSyncEvent(SyncEvent.USER_UPDATED, userData);
  
  // Invalidate all user-related caches
  await invalidateCache(`user:${userData.userId}:*`);
  await invalidateCache(`user:clerk:*`);
}

/**
 * Handle user snapshot sync in consuming services
 * Use this in team-service, project-service, chat-service, notification-service
 */
export async function handleUserSnapshotSync(
  prisma: PrismaWithUserSnapshot,
  userData: UserSyncData
) {
  try {
    await prisma.userSnapshot.upsert({
      where: { userId: userData.userId },
      create: {
        id: userData.id,
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        imageUrl: userData.imageUrl,
      },
      update: {
        email: userData.email,
        name: userData.name,
        imageUrl: userData.imageUrl,
      },
    });
    
    console.log(`User snapshot synced: ${userData.userId}`);
  } catch (error) {
    console.error('Failed to sync user snapshot:', error);
  }
}

/**
 * Batch sync user snapshots
 * Useful for initial population or recovery
 */
export async function batchSyncUserSnapshots(
  prisma: PrismaWithUserSnapshot,
  users: UserSyncData[]
) {
  const promises = users.map(user => handleUserSnapshotSync(prisma, user));
  await Promise.all(promises);
  console.log(`Batch synced ${users.length} user snapshots`);
}

/**
 * Cache invalidation helpers for specific patterns
 */
export const cacheInvalidation = {
  user: async (userId: string) => {
    await invalidateCache(`user:${userId}*`);
    await invalidateCache(`users:*${userId}*`);
  },
  
  team: async (teamId: string) => {
    await invalidateCache(`team:${teamId}*`);
    await invalidateCache(`projects:team:${teamId}*`);
  },
  
  project: async (projectId: string) => {
    await invalidateCache(`project:${projectId}*`);
  },
  
  notifications: async (userId: string) => {
    await invalidateCache(`notifications:user:${userId}*`);
  },
};

export const dataSync = {
  publishSyncEvent,
  subscribeSyncEvent,
  syncUserSnapshot,
  handleUserSnapshotSync,
  batchSyncUserSnapshots,
  cacheInvalidation,
};

export default dataSync;
