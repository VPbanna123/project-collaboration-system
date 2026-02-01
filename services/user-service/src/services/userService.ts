import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '../lib/prisma';
import { CacheService } from '@shared/utils/cache';
import { UserPayload } from '@shared/types';

export class UserService {
  /**
   * Sync user with provided data (from frontend)
   */
  static async syncUserWithData(data: {
    clerkId: string;
    email: string;
    name?: string;
    imageUrl?: string;
  }): Promise<UserPayload> {
    const { clerkId, email, name, imageUrl } = data;
    
    // Validate required fields
    if (!clerkId || !email) {
      throw new Error('clerkId and email are required for user sync');
    }
    
    const cacheKey = `user:${clerkId}`;

    // Upsert in database
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        name,
        email,
        imageUrl,
      },
      create: {
        clerkId,
        email,
        name,
        imageUrl,
      },
    });

    // Cache for 10 minutes
    await CacheService.set(cacheKey, user, 600);

    return user;
  }

  /**
   * Sync user from Clerk to database
   */
  static async syncUser(clerkId: string): Promise<UserPayload> {
    // Check cache first
    const cacheKey = `user:${clerkId}`;
    const cachedUser = await CacheService.get<UserPayload>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    // Get from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);

    const name = `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim();
    const email = clerkUser.emailAddresses[0].emailAddress;
    const imageUrl = clerkUser.imageUrl;

    // Upsert in database
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        name,
        email,
        imageUrl,
      },
      create: {
        clerkId,
        email,
        name,
        imageUrl,
      },
    });

    // Cache for 10 minutes
    await CacheService.set(cacheKey, user, 600);

    return user;
  }

  /**
   * Get user by Clerk ID
   */
  static async getUserByClerkId(clerkId: string): Promise<UserPayload | null> {
    const cacheKey = `user:${clerkId}`;
    const cachedUser = await CacheService.get<UserPayload>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (user) {
      await CacheService.set(cacheKey, user, 600);
    }

    return user;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<UserPayload | null> {
    const cacheKey = `user:id:${id}`;
    const cachedUser = await CacheService.get<UserPayload>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (user) {
      await CacheService.set(cacheKey, user, 600);
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateUser(
    clerkId: string,
    data: { name?: string; imageUrl?: string }
  ): Promise<UserPayload> {
    const user = await prisma.user.update({
      where: { clerkId },
      data,
    });

    // Invalidate cache
    await CacheService.del(`user:${clerkId}`);
    await CacheService.del(`user:id:${user.id}`);

    return user;
  }

  /**
   * Delete user
   */
  static async deleteUser(clerkId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (user) {
      await prisma.user.delete({
        where: { clerkId },
      });

      // Invalidate cache
      await CacheService.del(`user:${clerkId}`);
      await CacheService.del(`user:id:${user.id}`);
    }
  }

  /**
   * Get multiple users by IDs
   */
  static async getUsersByIds(ids: string[]): Promise<UserPayload[]> {
    return await prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  /**
   * Search users by email or name
   */
  static async searchUsers(query: string, limit: number = 10, excludeClerkId?: string): Promise<UserPayload[]> {
    const whereClause: {
      OR: Array<{ email?: { contains: string; mode: 'insensitive' }; name?: { contains: string; mode: 'insensitive' } }>;
      NOT?: { clerkId: string };
    } = {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Exclude current user if specified
    if (excludeClerkId) {
      whereClause.NOT = { clerkId: excludeClerkId };
    }

    return await prisma.user.findMany({
      where: whereClause,
      take: limit,
    });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserPayload | null> {
    const cacheKey = `user:email:${email}`;
    const cachedUser = await CacheService.get<UserPayload>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      await CacheService.set(cacheKey, user, 600);
    }

    return user;
  }
}
