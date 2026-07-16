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
    const [cached, ttlRemaining] = await Promise.all([
      redis.get(key),
      redis.ttl(key)
    ]);
    
    if (cached !== null) {
      try {
        const data = JSON.parse(cached) as T;
        
        // Stale-While-Revalidate (SWR) logic
        // If the cache is within 10% of its expiration, serve stale data instantly 
        // but trigger a background fetch to re-populate the cache.
        if (ttlRemaining > 0 && ttlRemaining < (ttlSeconds * 0.1)) {
          // Do not await this! Let it run in the background.
          fetcher().then(async (freshData) => {
            try {
              await redis.set(key, JSON.stringify(freshData), 'EX', ttlSeconds);
            } catch (e) {
              console.error(`SWR Background Set Error for key ${key}:`, e);
            }
          }).catch(e => {
            console.error(`SWR Background Fetch Error for key ${key}:`, e);
          });
        }

        return data;
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

