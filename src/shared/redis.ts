import { Redis } from '@upstash/redis';

// Initialize the Upstash Redis client
// We use Upstash because it connects over HTTP/REST, making it perfect for 
// serverless/edge environments where persistent TCP connections would fail.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Cache-Aside Helper Function
 * Checks Redis for a key. If it exists, returns it.
 * If not, executes the fetcher function, stores the result in Redis with TTL, and returns it.
 * 
 * @param key Redis key
 * @param fetcher Function that fetches data from primary database if cache miss
 * @param ttlSeconds Time-to-live in seconds
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    console.error(`Redis Get Error for key ${key}:`, error);
    // If Redis fails, gracefully degrade by executing the fetcher anyway
  }

  const freshData = await fetcher();

  try {
    await redis.set(key, freshData, { ex: ttlSeconds });
  } catch (error) {
    console.error(`Redis Set Error for key ${key}:`, error);
  }

  return freshData;
}
