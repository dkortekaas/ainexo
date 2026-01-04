# Advanced Caching System Guide

This document explains the advanced caching implementation with Redis and in-memory storage.

---

## Overview

The advanced caching system provides multi-layer caching with automatic fallback, TTL management, and cache invalidation strategies.

### Architecture

```
┌─────────────────┐
│  Application    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Cache   │───┐
    │ Manager  │   │
    └──┬───┬───┘   │
       │   │       │
  ┌────▼───▼────┐  │
  │   Redis     │  │ Primary
  │  (Shared)   │  │ Cache
  └─────────────┘  │
       │           │
  ┌────▼────────┐  │
  │   Memory    │  │ Fallback
  │  (Local)    │  │ Cache
  └─────────────┘  │
       │           │
  ┌────▼────────┐  │
  │  Database   │◄─┘
  │  (Source)   │
  └─────────────┘
```

### Key Features

✅ **Multi-Layer**: Redis → Memory → Database
✅ **Automatic Fallback**: Works without Redis
✅ **TTL Management**: Configurable expiration
✅ **Cache Invalidation**: Tag-based clearing
✅ **Performance**: Sub-millisecond lookups
✅ **Reliability**: Graceful degradation

---

## Configuration

### TTL Settings

```typescript
import { CacheConfig } from "@/lib/advanced-cache";

CacheConfig.ttl = {
  embeddings: 7 * 24 * 60 * 60,      // 7 days
  searchResults: 1 * 60 * 60,        // 1 hour
  chatResponses: 30 * 60,            // 30 minutes
  userSessions: 24 * 60 * 60,        // 24 hours
  apiResponses: 5 * 60,              // 5 minutes
  staticContent: 30 * 24 * 60 * 60,  // 30 days
};
```

### Memory Limits

```typescript
CacheConfig.memoryLimits = {
  embeddings: 1000,      // Max 1000 embeddings in memory
  searchResults: 500,    // Max 500 search results
  chatResponses: 200,    // Max 200 chat responses
};
```

---

## Usage

### Basic Operations

```typescript
import { cache, CacheKeys, CacheConfig } from "@/lib/advanced-cache";

// Get from cache
const result = await cache.get<string>("my-key");

if (result === null) {
  // Cache miss - compute value
  const value = await expensiveOperation();

  // Store in cache
  await cache.set("my-key", value, CacheConfig.ttl.apiResponses);
}
```

### Cache-Aside Pattern

```typescript
import { cache, CacheConfig } from "@/lib/advanced-cache";

const value = await cache.getOrCompute(
  "expensive-computation",
  async () => {
    // This only runs on cache miss
    return await veryExpensiveOperation();
  },
  CacheConfig.ttl.chatResponses
);
```

### Using Cache Keys

```typescript
import { CacheKeys } from "@/lib/advanced-cache";

// Embeddings cache
const embeddingKey = CacheKeys.embedding("sample text");
await cache.set(embeddingKey, [0.1, 0.2, 0.3], CacheConfig.ttl.embeddings, "embeddings");

// Search results cache
const searchKey = CacheKeys.search("query", "assistant-123");
await cache.set(searchKey, results, CacheConfig.ttl.searchResults, "searchResults");

// Chat responses cache
const chatKey = CacheKeys.chat("session-456", "message-hash");
await cache.set(chatKey, response, CacheConfig.ttl.chatResponses, "chatResponses");
```

---

## Advanced Features

### Memoization

```typescript
import { memoize, CacheConfig } from "@/lib/advanced-cache";

// Memoize expensive function
const expensiveFunction = memoize(
  async (userId: string) => {
    return await database.user.findMany({
      where: { id: userId },
      include: { posts: true },
    });
  },
  {
    ttl: CacheConfig.ttl.apiResponses,
    keyGenerator: (userId) => `user:${userId}:with-posts`,
    category: "searchResults",
  }
);

// First call - executes query
const user1 = await expensiveFunction("user-123");

// Second call - returns from cache
const user2 = await expensiveFunction("user-123");
```

### Decorator Pattern

```typescript
import { cached } from "@/lib/advanced-cache";

class UserService {
  @cached(300, (userId) => `user:${userId}`)
  async getUser(userId: string) {
    return await database.user.findUnique({
      where: { id: userId },
    });
  }
}
```

### Cache Invalidation

```typescript
import { cache } from "@/lib/advanced-cache";

// Delete specific key
await cache.delete("user:123");

// Clear by pattern
await cache.clear("user:*");

// Invalidate by tags
await cache.invalidateByTags(["users", "posts"]);
```

### Cache Warming

```typescript
import { cache, CacheConfig } from "@/lib/advanced-cache";

// Pre-populate cache with hot data
await cache.warmUp([
  {
    key: "popular-post:1",
    value: { id: 1, title: "Popular Post" },
    ttl: CacheConfig.ttl.staticContent,
    category: "searchResults",
  },
  {
    key: "trending-topic:ai",
    value: { topic: "AI", count: 1000 },
    ttl: CacheConfig.ttl.apiResponses,
    category: "chatResponses",
  },
]);
```

---

## Use Cases

### 1. Search Results Caching

```typescript
import { cache, CacheKeys, CacheConfig } from "@/lib/advanced-cache";

async function searchDocuments(query: string, assistantId: string) {
  const cacheKey = CacheKeys.search(query, assistantId);

  return await cache.getOrCompute(
    cacheKey,
    async () => {
      // Expensive vector search
      return await vectorDatabase.search(query, assistantId);
    },
    CacheConfig.ttl.searchResults,
    "searchResults"
  );
}
```

### 2. Embedding Caching

```typescript
import { cache, CacheKeys, CacheConfig } from "@/lib/advanced-cache";

async function getEmbedding(text: string): Promise<number[]> {
  const cacheKey = CacheKeys.embedding(text);

  return await cache.getOrCompute(
    cacheKey,
    async () => {
      // Expensive OpenAI API call
      return await openai.createEmbedding(text);
    },
    CacheConfig.ttl.embeddings,
    "embeddings"
  );
}
```

### 3. Chat Response Caching

```typescript
import { cache, CacheKeys, CacheConfig } from "@/lib/advanced-cache";
import crypto from "crypto";

async function getChatResponse(sessionId: string, message: string) {
  // Generate hash of message for cache key
  const messageHash = crypto
    .createHash("sha256")
    .update(message)
    .digest("hex")
    .substring(0, 16);

  const cacheKey = CacheKeys.chat(sessionId, messageHash);

  return await cache.getOrCompute(
    cacheKey,
    async () => {
      // Expensive AI generation
      return await generateAIResponse(message);
    },
    CacheConfig.ttl.chatResponses,
    "chatResponses"
  );
}
```

### 4. API Response Caching

```typescript
import { cache, CacheKeys, CacheConfig } from "@/lib/advanced-cache";

async function fetchExternalAPI(endpoint: string, params: Record<string, string>) {
  const paramsHash = JSON.stringify(params);
  const cacheKey = CacheKeys.api(endpoint, paramsHash);

  return await cache.getOrCompute(
    cacheKey,
    async () => {
      const response = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(params)
      });
      return await response.json();
    },
    CacheConfig.ttl.apiResponses
  );
}
```

---

## Performance Optimization

### Cache Hit Ratio

Monitor cache effectiveness:

```typescript
import { cache } from "@/lib/advanced-cache";

const stats = cache.getStats();
console.log("Redis enabled:", stats.redisEnabled);
console.log("Memory cache sizes:", stats.memorySize);

// Log hit/miss ratio
let hits = 0;
let misses = 0;

async function trackCacheAccess(key: string) {
  const value = await cache.get(key);
  if (value !== null) {
    hits++;
  } else {
    misses++;
  }

  const ratio = hits / (hits + misses);
  console.log(`Cache hit ratio: ${(ratio * 100).toFixed(2)}%`);
}
```

### Optimal TTL Selection

```typescript
// Long TTL for static content
const staticContent = await cache.getOrCompute(
  "static:homepage",
  async () => await cms.getHomepage(),
  CacheConfig.ttl.staticContent // 30 days
);

// Medium TTL for semi-dynamic content
const searchResults = await cache.getOrCompute(
  "search:query",
  async () => await search("query"),
  CacheConfig.ttl.searchResults // 1 hour
);

// Short TTL for dynamic content
const liveData = await cache.getOrCompute(
  "live:stats",
  async () => await database.getStats(),
  CacheConfig.ttl.apiResponses // 5 minutes
);
```

---

## Cache Invalidation Strategies

### 1. Time-Based (TTL)

Automatic expiration after TTL:

```typescript
// Expires after 30 minutes
await cache.set("key", value, 30 * 60);
```

### 2. Event-Based

Invalidate on data changes:

```typescript
// After updating user
await database.user.update({ ... });

// Invalidate user cache
await cache.delete(`user:${userId}`);
await cache.clear(`user:${userId}:*`);
```

### 3. Tag-Based

Group related cache entries:

```typescript
// Tag entries
await cache.set("post:1:tags", [...], 3600);
await cache.set("post:1:comments", [...], 3600);
await cache.set("post:1:author", {...}, 3600);

// Invalidate all post-related cache
await cache.invalidateByTags(["post:1"]);
```

### 4. Version-Based

Include version in cache key:

```typescript
const version = "v2";
const key = `api:data:${version}`;

await cache.set(key, data, 3600);

// New version automatically uses new cache key
```

---

## Error Handling

### Graceful Degradation

Cache failures don't break the application:

```typescript
import { cache } from "@/lib/advanced-cache";

async function getData(key: string) {
  try {
    // Try cache first
    const cached = await cache.get(key);
    if (cached) return cached;
  } catch (error) {
    console.warn("Cache error, falling back to database:", error);
  }

  // Always fall back to source
  const value = await database.query();

  try {
    // Try to cache for next time
    await cache.set(key, value, 300);
  } catch (error) {
    console.warn("Failed to cache value:", error);
  }

  return value;
}
```

---

## Monitoring

### Cache Stats API

```typescript
// app/api/cache/stats/route.ts
import { cache } from "@/lib/advanced-cache";
import { NextResponse } from "next/server";

export async function GET() {
  const stats = cache.getStats();

  return NextResponse.json({
    redis: stats.redisEnabled,
    memory: stats.memorySize,
    timestamp: new Date().toISOString(),
  });
}
```

### Logging

```typescript
import { logger } from "@/lib/logger";

// Cache operations are automatically logged
// Enable debug logging to see cache hits/misses
logger.debug("[CACHE] Hit:", key);
logger.debug("[CACHE] Miss:", key);
logger.debug("[CACHE] Set:", key, "TTL:", ttl);
```

---

## Best Practices

1. **Use appropriate TTLs**:
   - Static content: Days/weeks
   - Dynamic content: Minutes/hours
   - Real-time data: Seconds/minutes

2. **Cache expensive operations**:
   - Database queries
   - API calls
   - Complex computations
   - File processing

3. **Don't cache everything**:
   - User-specific data (unless partitioned)
   - Sensitive information
   - Frequently changing data

4. **Invalidate proactively**:
   - After data updates
   - On relevant events
   - Using tags/patterns

5. **Monitor performance**:
   - Track hit/miss ratios
   - Measure cache latency
   - Monitor memory usage

---

## Comparison: Redis vs Memory

| Feature | Redis Cache | Memory Cache |
|---------|-------------|--------------|
| **Persistence** | Yes | No (process restart = loss) |
| **Shared** | Yes (across instances) | No (per instance) |
| **Size** | Large (GBs) | Small (MBs) |
| **Speed** | Fast (~1ms) | Faster (<0.1ms) |
| **Cost** | $ (hosted) | Free |
| **Scalability** | Horizontal | Vertical only |

**Recommendation**: Use both layers for optimal performance.

---

## Deployment

### Vercel

Redis is automatically available via Upstash integration:

```bash
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
```

### Self-Hosted

Install Redis:

```bash
docker run -d -p 6379:6379 redis:alpine
```

Configure environment:

```env
UPSTASH_REDIS_REST_URL=http://localhost:6379
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## Troubleshooting

### Issue: Cache always misses

**Cause**: Redis not configured or connection failed
**Solution**: Check environment variables and Redis connectivity

### Issue: Stale data served

**Cause**: TTL too long or missed invalidation
**Solution**: Reduce TTL or improve invalidation logic

### Issue: High memory usage

**Cause**: Memory cache too large
**Solution**: Reduce memory limits or clear cache

---

## Additional Resources

- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Caching Strategies](https://aws.amazon.com/caching/best-practices/)
- [LRU Cache Algorithm](https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU)

---

*Last Updated: 2026-01-04*
*Version: 1.0*
