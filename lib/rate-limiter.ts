/**
 * Rate Limiting System
 *
 * Protects API endpoints from abuse by limiting the number of requests
 * per API key within a time window.
 *
 * Features:
 * - In-memory rate limiting (fast, no external dependencies)
 * - Sliding window algorithm for accurate rate limiting
 * - Automatic cleanup of expired entries
 * - Per-API-key limits based on chatbot settings
 * - Production-ready with Redis support path
 */

import { logger } from "./logger";

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp in milliseconds
  requests: number[]; // Timestamps of individual requests for sliding window
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.store = new Map();

    // Clean up expired entries every 5 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Check if a request should be allowed based on rate limit
   *
   * @param key - Unique identifier (e.g., API key or IP address)
   * @param limit - Maximum number of requests allowed in the window
   * @param windowMs - Time window in milliseconds (default: 60 seconds)
   * @returns Object with allowed status and remaining requests
   */
  check(
    key: string,
    limit: number,
    windowMs: number = 60000
  ): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      // First request - create new entry
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
        requests: [now],
      });

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      };
    }

    // Clean up old requests outside the sliding window
    const validRequests = entry.requests.filter(
      (timestamp) => timestamp > now - windowMs
    );

    if (validRequests.length >= limit) {
      // Rate limit exceeded
      const oldestRequest = validRequests[0];
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000); // seconds

      logger.warn("Rate limit exceeded", {
        key: key.substring(0, 12) + "...",
        requests: validRequests.length,
        limit,
      });

      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestRequest + windowMs,
        retryAfter,
      };
    }

    // Allow request and update entry
    validRequests.push(now);
    this.store.set(key, {
      count: validRequests.length,
      resetAt: validRequests[0] + windowMs,
      requests: validRequests,
    });

    return {
      allowed: true,
      remaining: limit - validRequests.length,
      resetAt: validRequests[0] + windowMs,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      // Remove entries where all requests are outside the window
      const validRequests = entry.requests.filter(
        (timestamp) => timestamp > now - 60000
      );

      if (validRequests.length === 0) {
        this.store.delete(key);
        cleaned++;
      } else {
        // Update entry with only valid requests
        this.store.set(key, {
          ...entry,
          requests: validRequests,
          count: validRequests.length,
        });
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * Get current store size (for monitoring)
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Clear all rate limit data (use with caution)
   */
  clear(): void {
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new InMemoryRateLimiter();

/**
 * Rate limit middleware for API routes
 *
 * @param key - Unique identifier for the requester
 * @param limit - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @returns Rate limit check result
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60000
) {
  return rateLimiter.check(key, limit, windowMs);
}

/**
 * Reset rate limit for a specific key (useful for testing or admin overrides)
 */
export function resetRateLimit(key: string) {
  rateLimiter.reset(key);
}

/**
 * Get rate limiter statistics
 */
export function getRateLimiterStats() {
  return {
    entriesCount: rateLimiter.size(),
  };
}

/**
 * Helper to generate rate limit response headers
 */
export function getRateLimitHeaders(result: {
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toString(),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}
