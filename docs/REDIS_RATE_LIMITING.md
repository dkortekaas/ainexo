# Redis-Based Rate Limiting with Upstash

## Overview

The EmbedIQ platform uses **Upstash Redis** for distributed rate limiting, enabling horizontal scaling across multiple server instances while maintaining accurate request limits.

## Features

✅ **Distributed Rate Limiting** - Works across multiple server instances
✅ **Sliding Window Algorithm** - Accurate rate limiting without burst issues
✅ **Automatic Fallback** - Falls back to in-memory when Redis unavailable
✅ **Rate Limit Headers** - Returns X-RateLimit-* headers for client feedback
✅ **Zero Configuration** - Automatically detects Redis availability
✅ **Production Ready** - Built on Upstash's serverless Redis

---

## Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Server 1   │      │   Server 2   │      │   Server 3   │
│              │      │              │      │              │
│  Rate Limit  │      │  Rate Limit  │      │  Rate Limit  │
│   Checker    │      │   Checker    │      │   Checker    │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Upstash Redis   │
                    │                  │
                    │  Shared State    │
                    │  Rate Counters   │
                    └──────────────────┘
```

**Benefits:**
- Multiple servers share the same rate limit state
- No race conditions or double-counting
- Automatic synchronization across instances

---

## Setup

### 1. Create Upstash Redis Database

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Choose a region close to your application
4. Copy the REST URL and token

### 2. Configure Environment Variables

Add to your `.env` or `.env.local`:

```bash
# Upstash Redis (Rate Limiting & Caching)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-rest-token
```

### 3. Verify Installation

The rate limiter automatically detects Redis configuration on startup:

```
✅ Upstash Redis rate limiter initialized
```

If environment variables are missing, it falls back to in-memory:

```
⚠️ Redis environment variables not set. Falling back to in-memory rate limiting.
```

---

## Usage

### Basic Rate Limiting

```typescript
import { checkRateLimit, getRateLimitHeaders } from "@/lib/redis-rate-limiter";

export async function POST(request: NextRequest) {
  // Check rate limit (10 requests per 60 seconds)
  const result = await checkRateLimit("user-123", 10, 60000);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: getRateLimitHeaders(result)
      }
    );
  }

  // Process request...
}
```

### Rate Limit with API Key

```typescript
const apiKey = request.headers.get("X-API-Key");
const result = await checkRateLimit(apiKey, 100, 60000); // 100 req/min
```

### Custom Rate Limits per User

```typescript
// Different limits for different subscription tiers
const limit = user.plan === "ENTERPRISE" ? 1000 : 100;
const result = await checkRateLimit(user.id, limit, 60000);
```

---

## Response Headers

The rate limiter returns standard rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635955200000
Retry-After: 45  (only when rate limit exceeded)
```

Example client handling:

```javascript
const response = await fetch('/api/chat/message', {
  method: 'POST',
  body: JSON.stringify(data)
});

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  const remaining = response.headers.get('X-RateLimit-Remaining');

  console.log(`Rate limited. Retry after ${retryAfter} seconds.`);
  console.log(`Remaining requests: ${remaining}`);
}
```

---

## Implementation Details

### Sliding Window Algorithm

The rate limiter uses a **sliding window** algorithm for accurate limiting:

```
Time:     0s────10s────20s────30s────40s────50s────60s
Requests: ●●●───●●────●●●●───●●─────●●────●●●───
          ↑                                      ↑
          Start                                  Now

Window moves with each request, ensuring accurate rate limiting
without burst issues at window boundaries.
```

### Automatic Fallback

```typescript
// Redis available → Use distributed rate limiting
✅ Request hits Server 1 → Check Redis → Allow/Deny
✅ Request hits Server 2 → Check Redis → Allow/Deny

// Redis unavailable → Use in-memory fallback
⚠️  Request hits Server 1 → Check local memory → Allow/Deny
⚠️  Request hits Server 2 → Check local memory → Allow/Deny
```

**Note:** In-memory fallback means each server has independent counters. This is acceptable for development and degraded mode, but production should use Redis.

---

## Configuration

### Current Rate Limits

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `/api/chat/message` | Configurable per chatbot (default: 10) | 60s | API key |
| `/api/chat/feedback` | 30 requests | 60s | `feedback:{apiKey}` |
| Custom APIs | Varies | Varies | Custom |

### Adjusting Limits

Rate limits are configured in the chatbot settings:

```typescript
// In ChatbotSettings model
rateLimit: 10  // Requests per minute
```

To adjust:
1. Update `ChatbotSettings.rateLimit` in database
2. Restart application (changes take effect immediately)

---

## Monitoring

### Check Rate Limiter Status

```typescript
import { isRedisAvailable } from "@/lib/redis-rate-limiter";

if (isRedisAvailable()) {
  console.log("✅ Using Redis-based rate limiting");
} else {
  console.log("⚠️ Using in-memory rate limiting");
}
```

### Logs

Rate limit events are logged:

```
⚠️ Rate limit exceeded for key: abc123def456... (11/10 requests)
```

### Sentry Integration

Rate limit errors are automatically reported to Sentry with context:
- API key (truncated for security)
- Current limit
- Retry-after time

---

## Testing

### Local Testing

```bash
# Set Redis variables (or leave empty for in-memory fallback)
export UPSTASH_REDIS_REST_URL=""
export UPSTASH_REDIS_REST_TOKEN=""

# Run development server
npm run dev

# Make requests to trigger rate limit
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/chat/message \
    -H "X-Chatbot-API-Key: your-api-key" \
    -H "Content-Type: application/json" \
    -d '{"question":"test"}'
done
```

Expected behavior:
- Requests 1-10: Success (200)
- Requests 11-15: Rate limited (429)

### Redis Testing

```bash
# Install Upstash Redis CLI
npm install -g @upstash/cli

# Test connection
upstash redis get @ratelimit:test-key

# Monitor rate limit keys
upstash redis keys "@ratelimit:*"
```

---

## Production Deployment

### Vercel

1. Add environment variables in Vercel dashboard:
   ```
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Verify:
   ```bash
   curl https://your-domain.com/api/health | jq .checks.redis
   ```

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine
# ... your build steps ...

# Redis env vars injected at runtime
ENV UPSTASH_REDIS_REST_URL=""
ENV UPSTASH_REDIS_REST_TOKEN=""
```

---

## Performance

### Latency

- **Redis rate check**: ~10-20ms (Upstash REST API)
- **In-memory rate check**: <1ms (local memory)

### Throughput

Upstash Redis can handle:
- **10,000+ requests/second** per database
- **Global replication** for low latency worldwide

### Cost

Upstash pricing (as of 2025):
- **Free tier**: 10,000 requests/day
- **Pay-as-you-go**: $0.20 per 100k requests
- **Fixed plan**: $10/month for 100k requests/day

**Estimated costs for EmbedIQ:**
- 100k API calls/month → **Free**
- 1M API calls/month → **$2/month**
- 10M API calls/month → **$20/month**

---

## Troubleshooting

### Redis Not Connecting

```
❌ Failed to initialize Redis client: Error: ...
⚠️ Redis environment variables not set. Falling back to in-memory rate limiting.
```

**Solutions:**
1. Verify environment variables are set correctly
2. Check Upstash database is active
3. Verify network connectivity to Upstash
4. Check firewall/proxy settings

### Rate Limits Not Working

```
⚠️ Rate limit exceeded for key: ... (11/10 requests)
```

**Expected behavior** - rate limiting is working!

If rate limits are NOT triggering:
1. Check Redis connection: `isRedisAvailable()`
2. Verify API key is consistent across requests
3. Check rate limit configuration in database

### High Latency

If rate limit checks are slow (>100ms):

1. **Choose closer region** - Upstash has global regions
2. **Enable caching** - Rate limit results can be cached briefly
3. **Increase timeout** - Default is 5 seconds

---

## Migration from In-Memory

The migration is **automatic** - just add Redis environment variables:

```bash
# Before: In-memory rate limiting
# No env vars needed

# After: Redis rate limiting
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

**No code changes required** - the rate limiter detects Redis availability automatically.

---

## Security

### Best Practices

1. ✅ **Never commit** Redis credentials to version control
2. ✅ **Rotate tokens** regularly (every 90 days)
3. ✅ **Use separate databases** for dev/staging/production
4. ✅ **Enable TLS** (enabled by default in Upstash)
5. ✅ **Monitor usage** via Upstash dashboard

### Access Control

- Upstash REST API uses **token authentication**
- Tokens are **database-specific** (not account-wide)
- **IP restrictions** available in Upstash Pro plan

---

## Advanced Usage

### Multiple Rate Limits

```typescript
// Different limits for different operations
const messageLimitResult = await checkRateLimit(`msg:${userId}`, 100, 60000);
const uploadLimitResult = await checkRateLimit(`upload:${userId}`, 10, 60000);
```

### Dynamic Rate Limits

```typescript
// Adjust limits based on user subscription
const limit = user.plan === "ENTERPRISE" ? 1000
            : user.plan === "BUSINESS" ? 500
            : user.plan === "PROFESSIONAL" ? 100
            : 10;

const result = await checkRateLimit(userId, limit, 60000);
```

### Custom Window Sizes

```typescript
// 1 second window
await checkRateLimit(key, 10, 1000);

// 5 minute window
await checkRateLimit(key, 100, 300000);

// 1 hour window
await checkRateLimit(key, 1000, 3600000);
```

---

## References

- [Upstash Documentation](https://docs.upstash.com/redis)
- [Upstash Rate Limiting](https://github.com/upstash/ratelimit)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**Last Updated:** November 5, 2025
**Version:** 1.0.0
