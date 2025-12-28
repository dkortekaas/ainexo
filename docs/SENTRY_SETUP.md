# Sentry Error Tracking Setup Guide

## Overview

Sentry is configured for error tracking across client, server, and edge runtimes in this Next.js application. This guide will help you set up and configure Sentry for production use.

## Prerequisites

1. **Sentry Account**: Create a free account at [sentry.io](https://sentry.io)
2. **Sentry Project**: Create a new Next.js project in Sentry

## Setup Steps

### 1. Create Sentry Project

1. Go to [sentry.io](https://sentry.io) and sign in
2. Click "Create Project"
3. Select **Next.js** as the platform
4. Choose an alert frequency
5. Name your project (e.g., "embediq-production")
6. Click "Create Project"

### 2. Get Your DSN

After creating the project, you'll see your **DSN (Data Source Name)**. It looks like:

```
https://abc123def456@o123456.ingest.sentry.io/7890123
```

### 3. Configure Environment Variables

Add these variables to your `.env.local` (for local development) and Vercel environment variables (for production):

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
```

For **CI/CD and production source map uploads**, also add:

```bash
SENTRY_AUTH_TOKEN=your-auth-token
```

#### How to Get Auth Token:

1. Go to [Sentry Settings > Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Click "Create New Token"
3. Give it a name (e.g., "embediq-ci-cd")
4. Select scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
5. Copy the token and save it securely

### 4. Vercel Environment Variables Setup

In your Vercel project settings:

1. Go to **Settings > Environment Variables**
2. Add the following variables for **Production**, **Preview**, and **Development**:

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Your public DSN | Production, Preview |
| `SENTRY_DSN` | Your DSN | Production, Preview |
| `SENTRY_ORG` | Your org slug | Production, Preview |
| `SENTRY_PROJECT` | Your project name | Production, Preview |
| `SENTRY_AUTH_TOKEN` | Your auth token | Production, Preview |

**Note**: The `SENTRY_AUTH_TOKEN` should be marked as **Secret** in Vercel.

### 5. Test Sentry Integration

#### Local Testing (Development)

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit the test endpoints:
   - Server error: http://localhost:3000/api/test-sentry?type=server
   - Client error: http://localhost:3000/api/test-sentry?type=client
   - Handled error: http://localhost:3000/api/test-sentry?type=handled

3. Check your Sentry dashboard to see if errors appear

**Note**: In development mode, errors are logged to console but NOT sent to Sentry to avoid noise.

#### Staging/Production Testing

1. Deploy to staging first
2. Visit: `https://your-staging-url.vercel.app/api/test-sentry?type=server`
3. Check Sentry dashboard for the error
4. **IMPORTANT**: Remove or protect the test endpoint in production

### 6. Configure Alerts

1. Go to your Sentry project > **Alerts**
2. Click "Create Alert Rule"
3. Recommended alerts:

   **Critical Errors Alert**:
   - When: An event is captured
   - Filter: `level:fatal OR level:error`
   - Frequency: More than 10 events in 1 hour
   - Action: Send email/Slack notification

   **New Issue Alert**:
   - When: A new issue is created
   - Frequency: Immediately
   - Action: Send email notification

## Configuration Files

### Client Configuration (`sentry.client.config.ts`)

Handles browser-side errors with:
- Session replay (10% sampling in production)
- Error replay (100% when error occurs)
- Browser tracing
- Breadcrumb tracking

### Server Configuration (`sentry.server.config.ts`)

Handles server-side errors with:
- Prisma integration for database query tracking
- Sensitive data filtering
- Custom error ignoring (rate limits, expected errors)

### Edge Configuration (`sentry.edge.config.ts`)

Handles middleware and edge function errors with:
- Minimal configuration for edge runtime
- Sensitive header filtering

### Next.js Configuration (`next.config.js`)

Integrates Sentry with Next.js:
- Source map uploading
- Automatic error instrumentation
- Tunnel route for ad-blocker bypass
- Vercel Cron monitoring

## Best Practices

### 1. Error Filtering

Already configured to ignore:
- Browser extension errors
- Network errors
- Hydration warnings (harmless)
- Expected errors (rate limits, etc.)

### 2. Sensitive Data

Automatically filters:
- Authorization headers
- Cookies
- API keys
- Password fields
- Tokens in URLs

### 3. Performance Monitoring

Sample rates configured:
- **Development**: 100% (all transactions tracked)
- **Production**: 10% (to reduce costs)

Adjust in `sentry.*.config.ts` files if needed.

### 4. Source Maps

Source maps are:
- Uploaded to Sentry automatically during build
- Hidden from production bundles
- Used only for error stack traces in Sentry

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Error Rate**: Track percentage of requests that error
2. **Issue Trends**: Watch for spikes in new issues
3. **Performance**: Monitor API response times
4. **Release Health**: Track stability per deployment

### Regular Tasks

- **Weekly**: Review unresolved issues
- **Monthly**: Check alert effectiveness
- **Quarterly**: Review Sentry plan usage and costs

## Costs

Sentry pricing (as of 2024):

- **Free Tier**: 5,000 errors/month
- **Team Plan**: €29/month for 50,000 errors
- **Business Plan**: €99/month for 500,000 errors

**Cost Control**:
- Set `tracesSampleRate` to 0.1 (10%) in production
- Filter noisy errors with `ignoreErrors`
- Use `beforeSend` to drop unnecessary events

## Troubleshooting

### No Errors Appearing in Sentry

1. Check environment variables are set correctly
2. Verify DSN format is correct
3. Check if `beforeSend` is filtering the error
4. Verify you're testing in staging/production (dev mode doesn't send)
5. Check Sentry project settings > Inbound Filters

### Source Maps Not Working

1. Verify `SENTRY_AUTH_TOKEN` is set in CI/CD
2. Check build logs for source map upload success
3. Verify `SENTRY_ORG` and `SENTRY_PROJECT` match exactly
4. Try setting `silent: false` in `next.config.js` to see upload logs

### Too Many Errors

1. Increase `ignoreErrors` list in config files
2. Use `beforeSend` to filter specific error patterns
3. Lower `tracesSampleRate` in production
4. Set up rate limiting per issue in Sentry UI

## Security Considerations

1. **Never commit** `.env` files with real tokens
2. **Rotate** `SENTRY_AUTH_TOKEN` regularly
3. **Limit** auth token scopes to minimum required
4. **Review** source maps don't contain secrets
5. **Remove** test endpoints in production

## Support Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Community Discord](https://discord.gg/sentry)
- [Sentry GitHub Issues](https://github.com/getsentry/sentry-javascript/issues)

## Test Checklist

Before going to production, verify:

- [ ] Sentry DSN configured in all environments
- [ ] Test error appears in Sentry dashboard
- [ ] Alerts are configured and working
- [ ] Source maps upload successfully
- [ ] Sensitive data is filtered properly
- [ ] Error boundaries catch and report errors
- [ ] Performance monitoring is active
- [ ] Team members have access to Sentry project
- [ ] Test endpoint is removed or protected
- [ ] Cost monitoring is set up

---

**Last Updated**: November 2025
**Maintained By**: Development Team
