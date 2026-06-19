import { redis } from 'bun';

// Re-export the native Redis client
export { redis };

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
    const cached = await redis.get(key);
    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch (parseError) {
        console.error(`Redis JSON Parse Error for key ${key}:`, parseError);
      }
    }
  } catch (error) {
    console.error(`Redis Get Error for key ${key}:`, error);
    // If Redis fails, gracefully degrade by executing the fetcher anyway
  }

  const freshData = await fetcher();

  try {
    await redis.set(key, JSON.stringify(freshData), 'EX', ttlSeconds);
  } catch (error) {
    console.error(`Redis Set Error for key ${key}:`, error);
  }

  return freshData;
}

