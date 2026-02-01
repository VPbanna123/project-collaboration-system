import {prisma} from '@/lib/prisma';
import { redis } from './redis';

export async function getUserTeam(userId: string) {
    const cacheKey = `user_teams_${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    
    const teams= prisma.team.findMany({
        where: {
            members: {
                some: {
                    userId: userId,
                },
            },
        },
    });
    await redis.set(cacheKey, JSON.stringify(teams), "EX", 60);
    return teams;
}

