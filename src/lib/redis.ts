import { Redis } from 'ioredis';

const getRedisUrl = () => {
    // REDIS_URL should be provided as environment variable
    // Default to localhost for development
    return process.env.REDIS_URL || 'redis://localhost:6379';
};

const redis = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    lazyConnect: true, // Don't connect immediately, only when needed
});

redis.on('error', (error) => {
    console.error('Redis connection error:', error);
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

export { redis };
