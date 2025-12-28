# Health Check Endpoint Documentation

## Overview

The health check endpoint (`/api/health`) provides real-time monitoring of all critical system dependencies. This endpoint is designed to be used by load balancers, uptime monitors, and DevOps tools to ensure the application is functioning correctly.

## Endpoint

```
GET /api/health
GET /api/health?detailed=true
```

## Response Format

### Basic Response (200 OK)

```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T10:30:00.000Z",
  "uptime": 3600.5,
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "message": "Database connection successful",
      "responseTime": 15
    },
    "stripe": {
      "status": "ok",
      "message": "Stripe API connection successful",
      "responseTime": 120
    },
    "openai": {
      "status": "ok",
      "message": "OpenAI API connection successful",
      "responseTime": 200
    },
    "redis": {
      "status": "ok",
      "message": "Redis connection successful",
      "responseTime": 25
    },
    "filesystem": {
      "status": "ok",
      "message": "Filesystem write permissions OK",
      "responseTime": 10,
      "details": {
        "testPath": "/tmp/embediq-health-check"
      }
    },
    "sentry": {
      "status": "ok",
      "message": "Sentry is configured"
    }
  }
}
```

### Detailed Response (?detailed=true)

Includes additional system information:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T10:30:00.000Z",
  "uptime": 3600.5,
  "version": "0.1.0",
  "environment": "production",
  "checks": { /* ... same as above ... */ },
  "system": {
    "memory": {
      "total": 8589934592,
      "free": 2147483648,
      "used": 6442450944,
      "percentage": 75
    },
    "platform": "linux",
    "nodeVersion": "v20.10.0"
  }
}
```

## Status Codes

| Status Code | Health Status | Description |
|-------------|---------------|-------------|
| `200` | `healthy` | All systems operational |
| `207` | `degraded` | Some non-critical systems are down, but service is functional |
| `503` | `unhealthy` | Critical systems are unavailable, service may not function |

## Health Status Logic

### Healthy ✅
All checks return `"ok"` status.

### Degraded ⚠️
Occurs when:
- 1 important service (Stripe, OpenAI, Filesystem) is down
- Any service has warnings (e.g., API key not configured)
- Multiple services show warnings

### Unhealthy ❌
Occurs when:
- Database is down (critical service)
- 2+ important services are down

## Individual Service Checks

### 1. Database (Prisma)

**Critical Service** - System cannot function without it.

**Check:**
- Executes `SELECT 1` query
- Verifies database connectivity

**Possible Statuses:**
- ✅ `ok` - Database is accessible
- ❌ `error` - Cannot connect to database

**Common Issues:**
- Invalid `DATABASE_URL`
- Database server down
- Network connectivity issues
- Connection pool exhausted

---

### 2. Stripe API

**Important Service** - Required for payments.

**Check:**
- Calls `stripe.balance.retrieve()`
- Verifies API key validity and connectivity

**Possible Statuses:**
- ✅ `ok` - Stripe API is accessible
- ⚠️ `warning` - API key not configured
- ❌ `error` - API call failed

**Common Issues:**
- Invalid or expired API key
- Stripe API outage
- Rate limiting
- Network issues

---

### 3. OpenAI API

**Important Service** - Required for AI features.

**Check:**
- Calls `openai.models.list()`
- Verifies API key validity and connectivity

**Possible Statuses:**
- ✅ `ok` - OpenAI API is accessible
- ⚠️ `warning` - API key not configured
- ❌ `error` - API call failed

**Common Issues:**
- Invalid or expired API key
- OpenAI API outage
- Rate limiting or quota exceeded
- Network issues

---

### 4. Redis (Upstash)

**Important Service** - Required for rate limiting and caching.

**Check:**
- Writes a test key
- Reads the test key
- Deletes the test key
- Verifies read/write operations

**Possible Statuses:**
- ✅ `ok` - Redis is accessible and functional
- ⚠️ `warning` - Redis credentials not configured
- ❌ `error` - Redis operation failed

**Common Issues:**
- Invalid credentials
- Redis instance down or unreachable
- Network issues
- Memory full

---

### 5. Filesystem

**Important Service** - Required for file uploads and temporary storage.

**Check:**
- Creates a directory in `/tmp`
- Writes a test file
- Reads the test file
- Deletes the test file

**Possible Statuses:**
- ✅ `ok` - Filesystem is writable
- ❌ `error` - Cannot write to filesystem

**Common Issues:**
- Read-only filesystem
- Disk full
- Permission issues
- `/tmp` directory unavailable

---

### 6. Sentry (Optional)

**Monitoring Service** - Not critical for operation.

**Check:**
- Verifies `SENTRY_DSN` is configured

**Possible Statuses:**
- ✅ `ok` - Sentry is configured
- Not present if not configured

---

## Usage Examples

### curl

```bash
# Basic health check
curl https://your-app.vercel.app/api/health

# Detailed health check
curl https://your-app.vercel.app/api/health?detailed=true

# Check specific status
curl -w "%{http_code}" -s -o /dev/null https://your-app.vercel.app/api/health
```

### Uptime Monitoring (UptimeRobot)

1. Create new monitor
2. Monitor Type: **HTTP(s)**
3. URL: `https://your-app.vercel.app/api/health`
4. Alert If:
   - Status code is not 200
   - Response contains `"status":"unhealthy"`
5. Check Interval: 5 minutes

### Load Balancer (AWS ALB, Nginx)

```nginx
# Nginx health check configuration
upstream embediq_backend {
    server app1.example.com;
    server app2.example.com;

    # Health check
    health_check uri=/api/health
                 interval=10s
                 fails=3
                 passes=2;
}
```

### Kubernetes Probes

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: embediq-app
spec:
  containers:
  - name: app
    image: embediq:latest
    livenessProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      successThreshold: 1
      failureThreshold: 3
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    image: embediq:latest
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Monitoring Dashboard (Grafana)

```promql
# Alert rule for unhealthy status
up{job="embediq", status="unhealthy"} == 1

# Response time tracking
health_check_response_time_ms{service="database"}
```

## Alerting Recommendations

### Critical Alerts (PagerDuty/Slack)

Trigger when:
- Status code is `503` (unhealthy)
- Database check fails
- 3+ consecutive failures

**Example (Slack webhook):**
```bash
if [ $(curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app/api/health) -eq 503 ]; then
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -H 'Content-Type: application/json' \
    -d '{"text":"🚨 EmbedIQ Health Check FAILED - System Unhealthy!"}'
fi
```

### Warning Alerts (Email)

Trigger when:
- Status code is `207` (degraded)
- Non-critical service failures
- 5+ consecutive degraded states

## Response Headers

| Header | Description | Example |
|--------|-------------|---------|
| `X-Health-Status` | Overall health status | `healthy`, `degraded`, `unhealthy` |
| `X-Response-Time` | Total health check duration | `125ms` |
| `Cache-Control` | Prevents caching of health data | `no-cache, no-store, must-revalidate` |

## Performance Considerations

- **Timeout**: Each service check has a 5-second timeout
- **Parallel Execution**: All checks run concurrently
- **Total Duration**: Typically < 500ms for all checks
- **Caching**: Not recommended - always check live status

## Troubleshooting

### Health Check Times Out

**Possible Causes:**
- One or more services are unresponsive
- Network latency issues
- Database connection pool exhausted

**Solutions:**
1. Check individual service logs
2. Increase timeout in load balancer
3. Scale database connections

### Constant Degraded Status

**Possible Causes:**
- Optional services not configured (Redis, Sentry)
- API keys missing or invalid

**Solutions:**
1. Review environment variables
2. Add missing API keys
3. Configure all required services

### False Positives

**Possible Causes:**
- Transient network issues
- API rate limiting
- Cold start delays

**Solutions:**
1. Increase failure threshold (3-5 failures)
2. Add retry logic in monitoring tool
3. Use longer check intervals

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting to prevent abuse
2. **Authentication**: Endpoint is public by design for load balancers
3. **Information Disclosure**: Detailed mode should only be used in staging
4. **DDoS Protection**: Configure CloudFlare or similar for production

## Integration with CI/CD

The health check endpoint is automatically used in GitHub Actions:

```yaml
- name: Run smoke tests
  run: |
    curl -f https://staging.embediq.app/api/health || exit 1
```

## Best Practices

1. ✅ **Monitor regularly** - Check every 1-5 minutes
2. ✅ **Set up alerts** - Get notified of failures immediately
3. ✅ **Use proper thresholds** - Require 3+ failures before alerting
4. ✅ **Check after deployments** - Verify health after each deploy
5. ✅ **Include in status page** - Show public status to users
6. ✅ **Review metrics** - Track response times over time
7. ❌ **Don't cache** - Always check live status
8. ❌ **Don't expose in detailed mode** - Only use in staging

## Example Status Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>EmbedIQ Status</title>
  <script>
    async function checkStatus() {
      const response = await fetch('/api/health');
      const data = await response.json();

      document.getElementById('status').textContent = data.status;
      document.getElementById('status').className = data.status;
    }

    setInterval(checkStatus, 30000); // Check every 30 seconds
    checkStatus(); // Initial check
  </script>
  <style>
    .healthy { color: green; }
    .degraded { color: orange; }
    .unhealthy { color: red; }
  </style>
</head>
<body>
  <h1>System Status: <span id="status">checking...</span></h1>
</body>
</html>
```

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Sentry Setup](./SENTRY_SETUP.md)
- [Production Readiness](../PRODUCTION_READINESS.md)

---

**Last Updated**: November 3, 2025
**Maintained By**: Development Team
