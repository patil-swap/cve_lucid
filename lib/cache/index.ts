/**
 * Unified Cache Interface
 * Falls back to an in-memory Map natively during testing/dev
 * if a Redis URL is not provisioned natively.
 */

// In-memory fallback dataset
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

function getRedisClient() {
  // Graceful abstraction - future Redis SDK configuration binds here
  return null;
}

export async function setCache(key: string, value: string, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
     // await redis.set(key, value, { ex: ttlSeconds });
  } else {
     memoryCache.set(key, {
       value,
       expiresAt: Date.now() + ttlSeconds * 1000
     });
  }
}

export async function getCache(key: string): Promise<string | null> {
  const redis = getRedisClient();
  if (redis) {
     // return await redis.get(key);
     return null;
  } else {
     const hit = memoryCache.get(key);
     if (!hit) return null;
     if (Date.now() > hit.expiresAt) {
       memoryCache.delete(key);
       return null;
     }
     return hit.value;
  }
}
