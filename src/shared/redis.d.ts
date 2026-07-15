import { redis } from 'bun';
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
export declare function withCache<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<T>;
