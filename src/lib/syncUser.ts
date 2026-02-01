import { auth, clerkClient } from "@clerk/nextjs/server";
import { redis } from "@/lib/redis";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";

export async function syncUser() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) return null;

    // 1. Try to get from Redis cache first
    const cacheKey = `user:${userId}`;
    try {
      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
    } catch (cacheError) {
      console.log('Redis cache error, continuing without cache');
    }

    // 2. Try to get from user-service database first
    try {
      const token = await getToken();
      const dbResponse = await fetch(`${USER_SERVICE_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (dbResponse.ok) {
        const result = await dbResponse.json();
        const user = result.data || result;
        // Cache in Redis for 10 minutes
        try {
          await redis.set(cacheKey, JSON.stringify(user), "EX", 600);
        } catch {}
        return user;
      }
    } catch (error) {
      console.log('User not found in database, will try Clerk');
    }

    // 3. Get from Clerk
    let clerkUser;
    try {
      const client = await clerkClient();
      clerkUser = await client.users.getUser(userId);
    } catch (clerkError) {
      console.error('Clerk API error:', clerkError);
      console.error('Failed to get user from Clerk for userId:', userId);
      // Return null so app knows there's an auth issue
      return null;
    }

    if (!clerkUser) {
      console.error('Clerk user not found for userId:', userId);
      return null;
    }

    const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();
    let email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const imageUrl = clerkUser.imageUrl;

    // Validate email before syncing - use fallback if not provided
    if (!email) {
      console.warn('No email found for user:', userId);
      console.warn('Clerk user data:', JSON.stringify(clerkUser, null, 2));
      // Use a fallback email based on the clerkId
      email = `${userId}@clerk.generated`;
      console.warn(`Using fallback email: ${email}`);
    }

    // 4. Sync to user-service via API
    try {
      const token = await getToken();
      const response = await fetch(`${USER_SERVICE_URL}/api/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clerkId: userId,
          email,
          name,
          imageUrl,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const user = result.data || result;

        // 5. Cache in Redis for 10 minutes
        try {
          await redis.set(cacheKey, JSON.stringify(user), "EX", 600);
        } catch {}

        return user;
      } else {
        const errorText = await response.text();
        console.error('User sync failed with status:', response.status);
        console.error('Error response:', errorText);
        console.error('Request data:', { clerkId: userId, email, name, imageUrl });
      }
    } catch (syncError) {
      console.error('User sync to service failed:', syncError);
      if (syncError instanceof Error) {
        console.error('Error stack:', syncError.stack);
      }
    }

    // Return basic user data if sync fails
    return { id: userId, clerkId: userId, name, email, imageUrl };
  } catch (error) {
    console.error('Error in syncUser:', error);
    return null;
  }
}
