# Authentication Security

## Overview

EmbedIQ implements multiple layers of authentication security to protect against common attack vectors including brute force attacks, bot registration, and password reset spam.

## Security Features

### 1. reCAPTCHA v3 Bot Protection

**Endpoints Protected:**
- `/api/auth/register` - Prevents bot registrations
- `/api/auth/forgot-password` - Prevents password reset spam
- Login (after 3 failed attempts) - Prevents brute force attacks

**Implementation:**
- Google reCAPTCHA v3 for invisible bot detection
- Score-based verification (minimum 0.5)
- Action verification to prevent token reuse
- Automatic fallback in development mode

**Configuration:**

```bash
# .env
RECAPTCHA_SECRET_KEY=your-secret-key-here
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key-here
```

**Example Usage:**

```typescript
import { verifyRecaptchaToken } from '@/lib/recaptcha';

// Verify reCAPTCHA token
const result = await verifyRecaptchaToken(
  recaptchaToken,
  'register', // action name
  0.5 // minimum score
);

if (!result.success) {
  return NextResponse.json(
    { error: 'Bot detected' },
    { status: 403 }
  );
}
```

---

### 2. Failed Login Tracking & Account Lockout

**Purpose:** Tracks failed login attempts to detect brute force attacks and trigger escalating security measures including automatic account lockout.

**Features:**
- In-memory tracking of failed login attempts per email
- Automatic cleanup of old entries (>1 hour)
- Escalating security thresholds
- Automatic account lockout after 10 failures
- Sentry integration for monitoring
- Admin unlock functionality
- Automatic reset on successful login

**Security Thresholds:**

```typescript
3 attempts  → Require reCAPTCHA on next login
8 attempts  → Sentry warning alert sent
10 attempts → Automatic account lockout (30 minutes)
```

**How It Works:**

```
User attempts login with wrong password:
  ├─> recordFailedLogin(email)
  ├─> Increment counter for this email
  ├─> Check thresholds:
  │   ├─> 3 attempts: Flag for reCAPTCHA requirement
  │   ├─> 8 attempts: Send Sentry warning
  │   └─> 10 attempts: Lock account (isActive = false)
  └─> Log security event

User successfully logs in:
  └─> resetFailedLogins(email)
      └─> Clear counter for this email

After 30 minutes of lockout:
  └─> Admin can unlock account via API
```

**API Functions:**

```typescript
import {
  recordFailedLogin,
  resetFailedLogins,
  requiresRecaptcha,
  getFailedLoginCount,
  shouldLockAccount
} from '@/lib/login-tracking';

// Record a failed login (async - handles lockout)
await recordFailedLogin('user@example.com');

// Check if reCAPTCHA should be required
if (requiresRecaptcha('user@example.com')) {
  // Require reCAPTCHA for next login attempt
}

// Check if account should be locked
if (shouldLockAccount('user@example.com')) {
  // Account has reached lockout threshold
}

// Reset on successful login
resetFailedLogins('user@example.com');

// Get current count
const count = getFailedLoginCount('user@example.com');
```

**Admin Unlock:**

```bash
# Unlock a locked account (admin only)
POST /api/admin/unlock-account
Content-Type: application/json

{
  "email": "user@example.com"
}

# Response
{
  "success": true,
  "message": "Account unlocked successfully",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "isActive": true
  }
}
```

**Configuration:**

```typescript
// Default thresholds (in lib/login-tracking.ts)
const RECAPTCHA_THRESHOLD = 3;
const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL = 15 * 60 * 1000; // Cleanup every 15 minutes
```

---

### 3. Email Verification on Registration

**Purpose:** Ensures that users own the email address they register with and prevents fake account creation.

**Implementation:**
- Verification token generated on registration
- Email sent with verification link
- 24-hour token expiration
- Login blocked until email verified
- Resend verification functionality

**Flow:**

```
User registers:
  ├─> Account created with emailVerified = null
  ├─> Generate verification token (64-char hex)
  ├─> Store in VerificationToken table (expires in 24h)
  ├─> Send verification email
  └─> User can't login until email verified

User clicks verification link:
  ├─> Check token exists and not expired
  ├─> Set user.emailVerified = now()
  ├─> Delete verification token
  └─> User can now login

User tries to login with unverified email:
  ├─> Password checked (valid)
  ├─> Email verification checked (not verified)
  ├─> Login blocked with "EMAIL_NOT_VERIFIED" error
  └─> Frontend shows "resend verification" option
```

**API Endpoints:**

```bash
# Verify email
GET /api/auth/verify-email?token=<verification-token>

# Response (success)
{
  "message": "Email verified successfully",
  "success": true
}

# Resend verification email
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}

# Response
{
  "message": "Verification email sent successfully",
  "success": true
}
```

**Database Schema:**

```typescript
model User {
  emailVerified DateTime? // Set when email is verified
}

model VerificationToken {
  identifier String   // Email address
  token      String   @unique
  expires    DateTime
}
```

**Security Features:**

- **24-hour token expiration** - Verification links expire after 24 hours
- **Single-use tokens** - Token deleted after successful verification
- **Email enumeration protection** - Same response for valid/invalid emails
- **Expired token cleanup** - Expired tokens deleted on verification attempt
- **Multiple token prevention** - Old tokens deleted when resending

**Code Example:**

```typescript
// Generate verification token (in registration endpoint)
const verificationToken = generateToken();
const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

await db.verificationToken.create({
  data: {
    identifier: email,
    token: verificationToken,
    expires: tokenExpiry,
  },
});

await sendEmailVerificationEmail(email, verificationToken, {
  id: user.id,
  companyId: user.companyId,
  name: user.name,
});

// Check email verified (in login authorize function)
if (!user.emailVerified) {
  throw new Error("EMAIL_NOT_VERIFIED");
}
```

---

### 4. Password Reset Token Expiration

**Purpose:** Prevents abuse of password reset tokens by enforcing expiration times.

**Implementation:**
- Tokens expire after 1 hour
- Expiration checked before allowing password reset
- Expired tokens automatically rejected
- Tokens cleared after successful password reset

**Database Fields:**

```typescript
model User {
  resetToken       String?
  resetTokenExpiry DateTime?
}
```

**Flow:**

```
User requests password reset:
  ├─> Generate random token
  ├─> Set resetTokenExpiry = now + 1 hour
  ├─> Store in database
  └─> Send email with reset link

User clicks reset link:
  ├─> Check if token exists
  ├─> Check if resetTokenExpiry > now
  │   ├─> Valid: Allow password reset
  │   └─> Expired: Reject with error
  └─> Clear token after successful reset
```

**Code Example:**

```typescript
// Generate token (in forgot-password endpoint)
const resetToken = generateToken();

await db.user.update({
  where: { id: user.id },
  data: {
    resetToken,
    resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
  },
});

// Verify token (in reset-password endpoint)
const user = await db.user.findFirst({
  where: {
    resetToken: token,
    resetTokenExpiry: {
      gt: new Date(), // Token hasn't expired
    },
  },
});

if (!user) {
  return NextResponse.json(
    { error: "Invalid or expired reset token" },
    { status: 400 }
  );
}
```

---

### 4. Security Audit Logging

**Purpose:** Track all security-related events for compliance and incident response.

**Logged Events:**
- `login_success` - Successful login
- `login_failed` - Failed login attempt
- `password_reset_request` - Password reset requested
- `password_reset_success` - Password successfully reset
- `2fa_enabled` - 2FA enabled on account
- `2fa_disabled` - 2FA disabled on account

**Database Schema:**

```sql
CREATE TABLE security_audit_log (
  id            TEXT PRIMARY KEY,
  user_id       TEXT,
  company_id    TEXT,
  event_type    TEXT NOT NULL,
  ip_address    TEXT NOT NULL,
  user_agent    TEXT NOT NULL,
  details       TEXT,
  timestamp     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Usage:**

```typescript
import { logSecurityEvent, sanitizeIp } from '@/lib/security';

await logSecurityEvent(
  user.id,
  user.companyId,
  'login_failed',
  sanitizeIp(req.headers['x-forwarded-for']),
  req.headers['user-agent'],
  'Wrong password'
);
```

---

### 5. Two-Factor Authentication (2FA)

**Supported Methods:**
- Time-based One-Time Password (TOTP)
- Authenticator apps (Google Authenticator, Authy, etc.)
- Backup codes for account recovery

**Features:**
- Encrypted 2FA secrets in database
- Backup codes with one-time use
- Session-based 2FA verification
- Grace period for 2FA setup

**See:** `docs/2FA_SYSTEM.md` for detailed documentation

---

## Security Best Practices

### 1. Password Requirements

```typescript
// Minimum requirements enforced
- Minimum length: 6 characters
- Maximum length: 128 characters
- Hashed with bcrypt (cost factor: 12)
- Password history (prevent reuse) - TODO
```

### 2. Session Security

```typescript
// Session configuration
session: {
  strategy: "jwt",
  maxAge: 30 * 60, // 30 minutes
}

// Secure cookies
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true // HTTPS only in production
    }
  }
}
```

### 3. Rate Limiting

**See:** `docs/REDIS_RATE_LIMITING.md` for detailed documentation

- API endpoints rate limited via Redis
- Login attempts tracked separately
- Automatic IP-based blocking after threshold

### 4. Input Validation

```typescript
// All inputs validated with Zod
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  name: z.string().min(1),
  recaptchaToken: z.string().optional(),
});
```

---

## Attack Prevention

### Brute Force Attacks

**Prevention Layers:**
1. **Failed login tracking** - In-memory tracking starts on first failure
2. **reCAPTCHA requirement** - Triggered after 3 failed attempts
3. **Sentry alerting** - Warning sent to monitoring system at 8 attempts
4. **Automatic account lockout** - Account locked for 30 minutes after 10 attempts
5. **Admin unlock capability** - Dedicated endpoint for account recovery
6. **Rate limiting per IP** - Redis-based distributed rate limiting
7. **Security audit logging** - All events logged with IP and user agent

**Attack Flow Example:**

```
Attempt 1-2:  Normal login flow, failures logged
Attempt 3:    reCAPTCHA now required for login
Attempt 4-7:  reCAPTCHA verification required
Attempt 8:    ⚠️ Sentry warning triggered
Attempt 9:    Final warning
Attempt 10:   🔒 Account automatically locked (isActive = false)
Attempt 11+:  Login blocked, "Account locked" message shown
              Admin must unlock via /api/admin/unlock-account
```

### Bot Registration

**Prevention:**
- reCAPTCHA v3 on registration form
- Score-based verification (min 0.5)
- Email verification (future enhancement)
- Suspicious pattern detection in logs

### Password Reset Spam

**Prevention:**
- reCAPTCHA on forgot-password endpoint
- 1-hour token expiration
- Single-use tokens
- Email enumeration protection (same response for valid/invalid emails)

### Session Hijacking

**Prevention:**
- HTTP-only cookies
- Secure flag in production
- SameSite cookie attribute
- Short session duration (30 minutes)
- Token rotation on privilege escalation

---

## Monitoring & Alerts

### Failed Login Monitoring

```typescript
import { getLoginTrackingStats } from '@/lib/login-tracking';

// Get current statistics
const stats = getLoginTrackingStats();
console.log(stats);
// Output:
// {
//   totalTracked: 5,
//   entries: [
//     { email: 'use***', count: 3, ageMinutes: 5 },
//     { email: 'adm***', count: 2, ageMinutes: 2 }
//   ]
// }
```

### Sentry Integration

Failed authentication attempts above threshold are automatically reported to Sentry for security monitoring:

```typescript
// Warning alert at 8 attempts
if (newCount >= LOCKOUT_THRESHOLD - 2) {
  Sentry.captureMessage('Multiple failed login attempts detected', {
    level: 'warning',
    extra: {
      email: email.substring(0, 3) + '***',
      attempts: newCount,
      threshold: LOCKOUT_THRESHOLD,
    },
  });
}

// Account lockout event
if (newCount >= LOCKOUT_THRESHOLD) {
  Sentry.captureMessage('Account automatically locked', {
    level: 'warning',
    extra: {
      email: email.substring(0, 3) + '***',
      reason: 'Too many failed login attempts',
      lockUntil: lockUntil,
    },
  });
}
```

**Alert Thresholds:**
- **8 failed attempts**: Warning alert sent to Sentry
- **10 failed attempts**: Account lockout alert sent to Sentry
- **Admin unlock**: Security event logged to Sentry

---

## Testing

### Manual Testing

```bash
# Test registration with reCAPTCHA
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "recaptchaToken": "test-token"
  }'

# Test failed login tracking
# Try login 3 times with wrong password
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -d "email=test@example.com&password=wrong" \
  --cookie-jar cookies.txt

# Check if threshold reached (should require reCAPTCHA)
```

### Automated Testing

**Comprehensive Unit Tests Available:**

```bash
# Run all authentication security tests
npm test -- __tests__/unit/login-tracking.test.ts
npm test -- __tests__/unit/recaptcha.test.ts
npm test -- __tests__/unit/email-verification.test.ts
```

**Test Coverage:**

**1. Login Tracking Tests** (`__tests__/unit/login-tracking.test.ts`)
- ✅ Track first failed login attempt
- ✅ Increment counter on multiple failures
- ✅ Require reCAPTCHA after 3 failures
- ✅ Lock account after 10 failures
- ✅ Reset counter on successful login
- ✅ Automatic cleanup of old entries
- ✅ Sentry integration at 8 attempts
- ✅ Admin unlock functionality
- ✅ Multiple users tracked independently
- ✅ Edge cases and race conditions

**2. reCAPTCHA Tests** (`__tests__/unit/recaptcha.test.ts`)
- ✅ Verify valid reCAPTCHA token
- ✅ Reject invalid tokens
- ✅ Reject low scores (< minimum)
- ✅ Verify action matching
- ✅ Handle Google API failures
- ✅ Development mode fallback
- ✅ Token expiration handling
- ✅ Network error handling

**3. Email Verification Tests** (`__tests__/unit/email-verification.test.ts`)
- ✅ Generate random verification tokens
- ✅ Create tokens with 24-hour expiry
- ✅ Verify email with valid token
- ✅ Reject expired verification token
- ✅ Reject invalid verification token
- ✅ Handle already verified email
- ✅ Delete old tokens before creating new one
- ✅ Prevent email enumeration attacks
- ✅ Block login with unverified email
- ✅ Allow login with verified email
- ✅ Handle concurrent verification attempts
- ✅ Handle database errors gracefully

**Example Test Code:**

```typescript
describe('Failed Login Tracking', () => {
  it('should track failed login attempts', async () => {
    await recordFailedLogin('test@example.com');
    await recordFailedLogin('test@example.com');
    await recordFailedLogin('test@example.com');

    expect(requiresRecaptcha('test@example.com')).toBe(true);
    expect(getFailedLoginCount('test@example.com')).toBe(3);
  });

  it('should lock account after 10 failures', async () => {
    const email = 'test@example.com';

    // Simulate 10 failed login attempts
    for (let i = 0; i < 10; i++) {
      await recordFailedLogin(email);
    }

    expect(shouldLockAccount(email)).toBe(true);
    expect(getFailedLoginCount(email)).toBe(10);
  });

  it('should reset on successful login', () => {
    recordFailedLogin('test@example.com');
    resetFailedLogins('test@example.com');

    expect(requiresRecaptcha('test@example.com')).toBe(false);
    expect(getFailedLoginCount('test@example.com')).toBe(0);
  });
});

describe('reCAPTCHA Verification', () => {
  it('should verify valid token', async () => {
    const mockResponse = {
      success: true,
      score: 0.9,
      action: 'register',
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await verifyRecaptchaToken('token', 'register', 0.5);
    expect(result.success).toBe(true);
    expect(result.score).toBe(0.9);
  });

  it('should reject token with low score', async () => {
    const mockResponse = {
      success: true,
      score: 0.3,
      action: 'register',
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await verifyRecaptchaToken('token', 'register', 0.5);
    expect(result.success).toBe(false);
    expect(result.error).toContain('score too low');
  });
});
```

**Running Tests:**

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- login-tracking.test.ts

# Watch mode for development
npm test -- --watch
```

---

## Configuration

### Environment Variables

```bash
# reCAPTCHA (required for production)
RECAPTCHA_SECRET_KEY=your-secret-key
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key

# NextAuth (required)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-here-min-32-chars

# Database (required)
DATABASE_URL=postgresql://...

# Encryption (required for 2FA)
ENCRYPTION_KEY=your-encryption-key-32-chars
```

### Production Checklist

- [ ] Set `RECAPTCHA_SECRET_KEY` and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- [ ] Generate strong `NEXTAUTH_SECRET` (min 32 chars)
- [ ] Generate strong `ENCRYPTION_KEY` (32 chars for AES-256)
- [ ] Enable HTTPS (secure cookies)
- [ ] Configure Sentry for security alerts (including account lockout alerts)
- [ ] Set up monitoring for failed login attempts
- [ ] Configure Upstash Redis for distributed rate limiting
- [ ] Review security audit logs regularly
- [ ] Test password reset flow end-to-end
- [ ] Verify reCAPTCHA on all auth endpoints
- [ ] Test account lockout after 10 failed attempts
- [ ] Verify admin unlock functionality works
- [ ] Enable 2FA for admin accounts
- [ ] Run comprehensive unit tests (`npm test`)

---

## Future Enhancements

### ✅ Recently Implemented

1. **Email Verification on Registration** ✅ **COMPLETED**
   - ✅ Verification email sent on registration
   - ✅ Login blocked for unverified accounts
   - ✅ Resend verification email endpoint
   - ✅ 24-hour token expiration
   - ✅ Comprehensive unit tests (15+ test cases)

2. **Account Lockout** ✅ **COMPLETED**
   - ✅ Automatic account lockout after 10 failed attempts
   - ✅ Admin-only unlock functionality
   - ✅ Sentry integration for monitoring
   - ✅ 30-minute lockout duration

3. **Comprehensive Unit Tests** ✅ **COMPLETED**
   - ✅ Login tracking tests (20+ test cases)
   - ✅ reCAPTCHA verification tests (15+ test cases)
   - ✅ Email verification tests (15+ test cases)
   - ✅ Mocked database and external services
   - ✅ Edge case coverage

### Planned Features

1. **Enhanced Email Verification**
   - Email verification reminders (after 7 days)
   - Account auto-deletion for unverified accounts (after 30 days)
   - Email change verification (require verification for email updates)

2. **IP-based Rate Limiting**
   - Track failed attempts per IP address
   - Temporary IP bans after threshold
   - Whitelist for trusted IPs

3. **Password Strength Requirements**
   - Minimum complexity requirements (uppercase, lowercase, numbers, symbols)
   - Password history (prevent reuse of last 5 passwords)
   - Compromised password detection (HaveIBeenPwned API)
   - Real-time password strength meter on frontend

4. **Login Notifications**
   - Email notification on successful login from new device
   - Email notification on password change
   - Email notification on 2FA changes
   - Suspicious login detection and alerts

5. **Session Management**
   - View active sessions per user
   - Revoke specific sessions
   - "Log out all devices" functionality
   - Track device fingerprints

6. **Advanced Monitoring**
   - Real-time dashboard for security events
   - Automated threat detection
   - Geographic anomaly detection
   - Impossible travel detection

---

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

**Last Updated:** November 5, 2025
**Version:** 1.2.0 - Added Email Verification on Registration
