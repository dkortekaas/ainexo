# Environment Variable Validation

## Overview

The application validates all critical environment variables at startup to prevent runtime errors caused by missing or misconfigured settings. This validation runs automatically when the server starts and will **prevent the application from starting** if required variables are missing or invalid.

## How It Works

### Automatic Validation

The validation runs automatically through Next.js instrumentation:

1. **Server Startup** → `instrumentation.ts` is loaded
2. **Import Validation** → `lib/startup-validation.ts` is imported
3. **Zod Validation** → All environment variables are validated
4. **Success/Failure** → Server starts or exits with error messages

### Validation Levels

**❌ Critical (Required)**

- Missing or invalid: Server **will not start**
- Examples: DATABASE_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY

**⚠️ Warning (Recommended)**

- Missing or invalid: Server starts but logs warnings
- Examples: SENTRY_DSN, UPSTASH_REDIS_REST_URL

**ℹ️ Optional**

- Missing: No warning, feature is disabled
- Examples: RECAPTCHA_SITE_KEY, MOLLIE_API_KEY

## Validated Variables

### Critical (Always Required)

| Variable            | Validation                                       | Example                                    |
| ------------------- | ------------------------------------------------ | ------------------------------------------ |
| `DATABASE_URL`      | Must start with `postgres://` or `postgresql://` | `postgresql://user:pass@localhost:5432/db` |
| `NEXTAUTH_URL`      | Must be valid URL                                | `https://yourapp.com`                      |
| `NEXTAUTH_SECRET`   | Min 32 characters, not default value             | `openssl rand -base64 32`                  |
| `ENCRYPTION_KEY`    | Min 32, max 64 characters                        | `openssl rand -hex 32`                     |
| `OPENAI_API_KEY`    | Must start with `sk-`                            | `sk-proj-...`                              |
| `RESEND_API_KEY` | Required for Resend (must start with `re_`)     | `re_xxxxxxxxxxxxx`                         |
| `RESEND_FROM_EMAIL` | Valid email, not default (optional)          | `noreply@yourapp.com`                      |

### Production Only (Required in Production)

| Variable                       | Validation                         | Example       |
| ------------------------------ | ---------------------------------- | ------------- |
| `STRIPE_SECRET_KEY`            | Must start with `sk_live_` in prod | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET`        | Must start with `whsec_`           | `whsec_...`   |
| `STRIPE_STARTER_PRICE_ID`      | Must be present                    | `price_...`   |
| `STRIPE_PROFESSIONAL_PRICE_ID` | Must be present                    | `price_...`   |
| `STRIPE_ENTERPRISE_PRICE_ID`   | Must be present                    | `price_...`   |

### Recommended (Warning if Missing)

| Variable                   | Purpose               | Impact if Missing                       |
| -------------------------- | --------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`   | Error tracking        | No error monitoring                     |
| `SENTRY_DSN`               | Server error tracking | No server error logs                    |
| `UPSTASH_REDIS_REST_URL`   | Rate limiting         | In-memory rate limiting (doesn't scale) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis authentication  | Rate limiting won't work                |
| `CRON_SECRET`              | Cron job security     | Unprotected cron endpoints              |

### Optional

| Variable               | Purpose                      |
| ---------------------- | ---------------------------- |
| `RECAPTCHA_SITE_KEY`   | Bot protection               |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA verification       |
| `MOLLIE_API_KEY`       | Alternative payment provider |
| `VERCEL_*`             | Auto-populated by Vercel     |

## Error Messages

### Example: Missing Variable

```
❌ Environment variable validation failed:

  • NEXTAUTH_SECRET: String must contain at least 32 character(s)
  • OPENAI_API_KEY: Required

💡 Tip: Check your .env file and compare with .env.example
```

### Example: Invalid Format

```
❌ Environment variable validation failed:

  • DATABASE_URL: DATABASE_URL must be a valid PostgreSQL connection string
  • OPENAI_API_KEY: OPENAI_API_KEY must start with 'sk-'

💡 Tip: Check your .env file and compare with .env.example
```

### Example: Production Errors

```
❌ Environment variable validation failed:

Production environment validation failed:
  - STRIPE_SECRET_KEY is required in production for payment processing
  - All Stripe Price IDs (STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE) are required in production
```

## Configuration Summary

When validation succeeds, you'll see a configuration summary:

```
🔍 Validating environment variables...

✅ All required environment variables are valid!

📋 Configuration Summary:
  Environment: production
  Platform: Vercel
  Database: Remote
  OpenAI: Configured ✓
  Stripe: Configured ✓
  Sentry: Configured ✓
  Redis: Configured ✓
  Email: Configured ✓
```

## Usage in Code

### Type-Safe Environment Access

Instead of using `process.env` directly, use the validated `getEnv()` function:

```typescript
import { getEnv } from "@/lib/startup-validation";

// ✅ Good - Type-safe and validated
const env = getEnv();
const apiKey = env.OPENAI_API_KEY; // TypeScript knows this exists

// ❌ Bad - No type safety
const apiKey = process.env.OPENAI_API_KEY; // Could be undefined
```

### Example Usage

```typescript
import { getEnv } from "@/lib/startup-validation";
import { Resend } from "resend";

export async function sendEmail(to: string, subject: string, body: string) {
  const env = getEnv();

  // TypeScript knows these are validated and exist
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "noreply@yourapp.com",
    to: [to],
    subject: subject,
    html: body,
  });
}
```

## Setup Guide

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Fill Required Variables

Edit `.env.local` and fill in all required variables:

```bash
# Generate secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -hex 32     # For ENCRYPTION_KEY
openssl rand -hex 32     # For CRON_SECRET
```

### 3. Add API Keys

Get API keys from:

- **Database**: [Neon](https://neon.tech/) or any PostgreSQL provider
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Resend**: [Resend Dashboard](https://resend.com/api-keys) (create API key)
- **Stripe**: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- **Sentry**: [sentry.io/settings/projects](https://sentry.io/settings/projects)
- **Upstash**: [console.upstash.com/](https://console.upstash.com/)

### 4. Test Validation

Start the development server:

```bash
npm run dev
```

If validation fails, you'll see detailed error messages. Fix the issues and restart.

## Troubleshooting

### Server Won't Start

**Symptom**: Server exits immediately with validation errors

**Solution**:

1. Read the error messages carefully
2. Check `.env.local` file exists
3. Compare with `.env.example`
4. Ensure all required variables are set
5. Verify format (URLs, API key prefixes)

### Default Values Error

**Symptom**: `NEXTAUTH_SECRET cannot be the default value`

**Solution**:

```bash
# Generate a new secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Database URL Format

**Symptom**: `DATABASE_URL must be a valid PostgreSQL connection string`

**Solution**:

```bash
# ✅ Correct formats
postgresql://user:password@host:5432/database
postgres://user:password@host:5432/database

# ❌ Incorrect formats
mysql://...  # Wrong database type
http://...   # Wrong protocol
```

### Production Stripe Keys

**Symptom**: `STRIPE_SECRET_KEY must start with 'sk_live_' in production`

**Solution**:

- Development: Use `sk_test_...` keys
- Production: Use `sk_live_...` keys
- Never use test keys in production

### Missing Stripe Price IDs

**Symptom**: `All Stripe Price IDs are required in production`

**Solution**:

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create products for each plan (Starter, Professional, Business, Enterprise)
3. Copy the `price_...` IDs
4. Add to `.env` file

## Best Practices

### 1. Never Commit `.env` Files

```bash
# .gitignore already includes:
.env
.env.local
.env.*.local
```

### 2. Use Different Values Per Environment

```bash
# Development
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...

# Production
NEXTAUTH_URL=https://yourapp.com
STRIPE_SECRET_KEY=sk_live_...
```

### 3. Rotate Secrets Regularly

- Change `NEXTAUTH_SECRET` every 90 days
- Rotate `ENCRYPTION_KEY` annually (requires data migration!)
- Update `CRON_SECRET` if compromised

### 4. Use Secret Management Tools

For production, consider:

- **Vercel**: Environment Variables (encrypted at rest)
- **AWS Secrets Manager**: Centralized secret storage
- **HashiCorp Vault**: Enterprise secret management
- **Doppler**: Environment variable management

### 5. Document Custom Variables

If you add new environment variables:

1. Add to `.env.example` with placeholder
2. Add validation in `lib/startup-validation.ts`
3. Document in this file
4. Update team documentation

## CI/CD Integration

### GitHub Actions

The validation runs automatically in CI/CD. If it fails, the build will fail:

```yaml
- name: Build verification
  run: npm run build
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
    # ... other secrets
```

### Vercel Deployment

Set environment variables in:
**Project Settings → Environment Variables**

- Mark sensitive values as **Secret**
- Set per environment (Production, Preview, Development)
- Use different values for each environment

## Security Considerations

### 1. Minimum Length Requirements

- `NEXTAUTH_SECRET`: 32+ characters (prevents brute force)
- `ENCRYPTION_KEY`: 32-64 characters (AES-256 encryption)
- `CRON_SECRET`: 32+ characters (secure cron jobs)

### 2. Format Validation

- API keys must have correct prefixes (sk-, re*, whsec*)
- URLs must be valid HTTP/HTTPS
- Emails must be valid format

### 3. Production Restrictions

- Stripe keys must be live keys in production
- Default/example values are rejected
- All payment-related variables are required

### 4. Sensitive Data

Never log or expose:

- API keys
- Secrets
- Database passwords
- Encryption keys

## Related Documentation

- [Environment Variables (.env.example)](../.env.example)
- [Deployment Guide](./DEPLOYMENT.md)
- [Production Readiness](../PRODUCTION_READINESS.md)

---

**Last Updated**: November 3, 2025
**Maintained By**: Development Team
