/**
 * Redis-based Rate Limiting System with Upstash
 *
 * Production-ready rate limiting with persistent storage for horizontal scaling.
 * Falls back to in-memory rate limiting if Redis is unavailable.
 *
 * Features:
 * - Upstash Redis for distributed rate limiting
 * - Sliding window algorithm for accurate rate limiting
 * - Automatic fallback to in-memory when Redis unavailable
 * - Per-API-key limits based on chatbot settings
 * - Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
 * - Works across multiple server instances
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { checkRateLimit as checkInMemoryRateLimit } from "./rate-limiter";
import { logger } from "./logger";

// Initialize Redis client (only if environment variables are set)
let redis: Redis | null = null;
let rateLimitCache: Map<string, Ratelimit> = new Map();

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    logger.info("Upstash Redis rate limiter initialized");
  } else {
    logger.warn(
      "Redis environment variables not set. Falling back to in-memory rate limiting."
    );
  }
} catch (error) {
  logger.error("Failed to initialize Redis client", {
    error: error instanceof Error ? error.message : String(error),
  });
  redis = null;
}

/**
 * Get or create a rate limiter for a specific limit
 */
function getRateLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;

  const key = `${limit}-${windowMs}`;

  if (!rateLimitCache.has(key)) {
    const windowSeconds = Math.ceil(windowMs / 1000);

    rateLimitCache.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        analytics: true,
        prefix: "@ratelimit",
      })
    );
  }

  return rateLimitCache.get(key)!;
}

/**
 * Check if a request should be allowed based on rate limit
 *
 * Uses Redis-based rate limiting when available, falls back to in-memory.
 *
 * @param key - Unique identifier (e.g., API key or IP address)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @returns Object with allowed status and remaining requests
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60000
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
  limit: number;
}> {
  const rateLimiter = getRateLimiter(limit, windowMs);

  // Fall back to in-memory rate limiting if Redis is unavailable
  if (!rateLimiter) {
    const inMemoryResult = checkInMemoryRateLimit(key, limit, windowMs);
    return {
      ...inMemoryResult,
      limit,
    };
  }

  try {
    // Use Redis-based rate limiting
    const result = await rateLimiter.limit(key);

    if (!result.success) {
      logger.warn("Rate limit exceeded (Redis)", {
        key: key.substring(0, 12) + "...",
        requests: limit - result.remaining,
        limit,
      });
    }

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      limit: result.limit,
    };
  } catch (error) {
    logger.error("Redis rate limit check failed, falling back to in-memory", {
      error: error instanceof Error ? error.message : String(error),
    });

    // Fall back to in-memory on error
    const inMemoryResult = checkInMemoryRateLimit(key, limit, windowMs);
    return {
      ...inMemoryResult,
      limit,
    };
  }
}

/**
 * Reset rate limit for a specific key
 * Only works with in-memory fallback (Redis entries expire automatically)
 */
export async function resetRateLimit(key: string): Promise<void> {
  if (!redis) {
    const { resetRateLimit: resetInMemory } = await import("./rate-limiter");
    resetInMemory(key);
    return;
  }

  try {
    // Delete all rate limit keys for this identifier
    const pattern = `@ratelimit:*:${key}`;
    // Note: Upstash Redis doesn't support SCAN, so we rely on automatic expiration
    logger.debug(`Rate limit reset requested for ${key} - entries will expire automatically`);
  } catch (error) {
    logger.error("Failed to reset rate limit", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Helper to generate rate limit response headers
 */
export function getRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toString(),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Check if Redis rate limiting is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}
