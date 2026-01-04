/**
 * Advanced Caching System
 *
 * Multi-layer caching with Redis and in-memory storage.
 * Provides cache invalidation, TTL management, and performance optimization.
 */

import { Redis } from "@upstash/redis";
import { logger } from "./logger";

// Initialize Redis client (optional - falls back to memory cache if not available)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Cache configuration
 */
export const CacheConfig = {
  // TTL (Time To Live) in seconds
  ttl: {
    embeddings: 7 * 24 * 60 * 60, // 7 days
    searchResults: 1 * 60 * 60, // 1 hour
    chatResponses: 30 * 60, // 30 minutes
    userSessions: 24 * 60 * 60, // 24 hours
    apiResponses: 5 * 60, // 5 minutes
    staticContent: 30 * 24 * 60 * 60, // 30 days
  },

  // Memory cache size limits
  memoryLimits: {
    embeddings: 1000,
    searchResults: 500,
    chatResponses: 200,
  },
} as const;

/**
 * Cache key prefixes for organization
 */
export const CacheKeys = {
  embedding: (text: string) => `emb:${text}`,
  search: (query: string, assistantId: string) => `search:${assistantId}:${query}`,
  chat: (sessionId: string, messageHash: string) => `chat:${sessionId}:${messageHash}`,
  session: (sessionId: string) => `session:${sessionId}`,
  api: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
} as const;

/**
 * In-memory LRU cache as fallback
 */
class MemoryCache<T> {
  private cache: Map<string, { value: T; expiry: number }>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttlSeconds: number): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global memory caches
const memoryCaches = {
  embeddings: new MemoryCache<number[]>(CacheConfig.memoryLimits.embeddings),
  searchResults: new MemoryCache<any>(CacheConfig.memoryLimits.searchResults),
  chatResponses: new MemoryCache<any>(CacheConfig.memoryLimits.chatResponses),
};

/**
 * Advanced cache manager with Redis + Memory layers
 */
export class CacheManager {
  private useRedis: boolean;

  constructor() {
    this.useRedis = redis !== null;

    if (this.useRedis) {
      logger.info("Advanced caching initialized with Redis");
    } else {
      logger.warn("Redis not configured, using memory-only cache");
    }
  }

  /**
   * Get value from cache (checks Redis → Memory → null)
   */
  async get<T>(key: string, category: keyof typeof memoryCaches = "chatResponses"): Promise<T | null> {
    // Try Redis first
    if (this.useRedis && redis) {
      try {
        const value = await redis.get<T>(key);
        if (value !== null) {
          logger.debug(`[CACHE] Redis hit: ${key}`);
          return value;
        }
      } catch (error) {
        logger.warn(`[CACHE] Redis error:`, error);
      }
    }

    // Fallback to memory cache
    const memoryValue = memoryCaches[category].get(key);
    if (memoryValue !== null) {
      logger.debug(`[CACHE] Memory hit: ${key}`);
      return memoryValue as T;
    }

    logger.debug(`[CACHE] Miss: ${key}`);
    return null;
  }

  /**
   * Set value in cache (writes to Redis + Memory)
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    category: keyof typeof memoryCaches = "chatResponses"
  ): Promise<void> {
    // Write to Redis
    if (this.useRedis && redis) {
      try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
        logger.debug(`[CACHE] Redis set: ${key} (TTL: ${ttlSeconds}s)`);
      } catch (error) {
        logger.warn(`[CACHE] Redis set error:`, error);
      }
    }

    // Write to memory cache as backup
    memoryCaches[category].set(key, value, ttlSeconds);
    logger.debug(`[CACHE] Memory set: ${key}`);
  }

  /**
   * Delete key from cache
   */
  async delete(key: string, category: keyof typeof memoryCaches = "chatResponses"): Promise<void> {
    if (this.useRedis && redis) {
      try {
        await redis.del(key);
      } catch (error) {
        logger.warn(`[CACHE] Redis delete error:`, error);
      }
    }

    memoryCaches[category].delete(key);
    logger.debug(`[CACHE] Deleted: ${key}`);
  }

  /**
   * Clear all caches matching pattern
   */
  async clear(pattern: string = "*"): Promise<void> {
    if (this.useRedis && redis) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.debug(`[CACHE] Cleared ${keys.length} Redis keys matching: ${pattern}`);
        }
      } catch (error) {
        logger.warn(`[CACHE] Redis clear error:`, error);
      }
    }

    // Clear memory caches
    Object.values(memoryCaches).forEach((cache) => cache.clear());
    logger.debug(`[CACHE] Memory caches cleared`);
  }

  /**
   * Get or compute value (cache-aside pattern)
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlSeconds: number,
    category: keyof typeof memoryCaches = "chatResponses"
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key, category);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    logger.debug(`[CACHE] Computing: ${key}`);
    const value = await computeFn();

    // Store in cache
    await this.set(key, value, ttlSeconds, category);

    return value;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.clear(`*${tag}*`);
    }
    logger.debug(`[CACHE] Invalidated by tags:`, tags);
  }

  /**
   * Warm up cache with commonly accessed data
   */
  async warmUp(data: Array<{ key: string; value: any; ttl: number; category?: keyof typeof memoryCaches }>): Promise<void> {
    logger.debug(`[CACHE] Warming up ${data.length} entries`);

    for (const { key, value, ttl, category = "chatResponses" } of data) {
      await this.set(key, value, ttl, category);
    }

    logger.debug(`[CACHE] Warm-up complete`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    redisEnabled: boolean;
    memorySize: Record<keyof typeof memoryCaches, number>;
  } {
    return {
      redisEnabled: this.useRedis,
      memorySize: {
        embeddings: memoryCaches.embeddings.size(),
        searchResults: memoryCaches.searchResults.size(),
        chatResponses: memoryCaches.chatResponses.size(),
      },
    };
  }
}

// Export singleton instance
export const cache = new CacheManager();

/**
 * Cache decorator for functions
 */
export function cached(ttlSeconds: number, keyGenerator?: (...args: any[]) => string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Generate cache key
      const cacheKey = keyGenerator
        ? keyGenerator(...args)
        : `${propertyKey}:${JSON.stringify(args)}`;

      // Try cache
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      await cache.set(cacheKey, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    ttl: number;
    keyGenerator?: (...args: Parameters<T>) => string;
    category?: keyof typeof memoryCaches;
  }
): T {
  const { ttl, keyGenerator, category = "chatResponses" } = options;

  return (async (...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : `memoized:${fn.name}:${JSON.stringify(args)}`;

    return cache.getOrCompute(key, () => fn(...args), ttl, category);
  }) as T;
}

export default cache;
