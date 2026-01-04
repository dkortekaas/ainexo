# CSRF Protection Guide

This document explains how CSRF (Cross-Site Request Forgery) protection is implemented in the AiNexo platform.

---

## Overview

CSRF protection prevents malicious websites from making unauthorized requests on behalf of authenticated users. The platform uses a token-based approach to validate that requests originate from legitimate sources.

### What's Already Protected

1. **NextAuth Routes**: All authentication routes (`/api/auth/*`) have built-in CSRF protection via NextAuth
2. **Server Actions**: Next.js App Router Server Actions have automatic CSRF protection
3. **Session Management**: Session cookies use `SameSite=Lax` for additional protection

### What This Implementation Adds

- CSRF token generation and validation for custom API routes
- Client-side utilities for easy token management
- Middleware for protecting API endpoints
- React hooks for form submissions

---

## Architecture

### Token Format

CSRF tokens consist of:
1. **Random Token**: 32 bytes of cryptographically secure random data
2. **Timestamp**: Creation time for expiry validation
3. **HMAC Signature**: Cryptographic signature to prevent tampering

Format: `base64url(json_data).base64url(hmac_signature)`

### Token Lifecycle

1. **Generation**: `/api/csrf` endpoint creates a new token
2. **Storage**: Token stored as httpOnly cookie + returned in response
3. **Validation**: Server validates token from header or cookie
4. **Expiry**: Tokens expire after 1 hour

---

## Usage

### 1. Protecting API Routes

#### Method A: Using Middleware (Recommended)

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withCSRFProtection } from "@/lib/csrf";

async function handler(req: NextRequest) {
  // Your API logic here
  const data = await req.json();

  // Process request...

  return NextResponse.json({ success: true });
}

// Wrap handler with CSRF protection
export const POST = withCSRFProtection(handler);
export const PUT = withCSRFProtection(handler);
export const DELETE = withCSRFProtection(handler);

// GET requests are not protected (safe methods)
export async function GET(req: NextRequest) {
  // No CSRF protection needed for GET
  return NextResponse.json({ data: "..." });
}
```

#### Method B: Manual Validation

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateCSRFFromRequest } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  // Validate CSRF token
  const isValid = await validateCSRFFromRequest(req);

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    );
  }

  // Process request...
  return NextResponse.json({ success: true });
}
```

### 2. Client-Side Usage

#### Option A: React Hook (Recommended for Forms)

```typescript
"use client";

import { useState } from "react";
import { useCSRFToken } from "@/hooks/useCSRFToken";

export function MyForm() {
  const { token, loading, error } = useCSRFToken();
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert("CSRF token not available");
      return;
    }

    const response = await fetch("/api/my-endpoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": token,
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      // Handle success
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading form</div>;

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### Option B: Utility Function (For Non-React Code)

```typescript
import { fetchWithCSRF } from "@/hooks/useCSRFToken";

async function deleteItem(id: string) {
  const response = await fetchWithCSRF(`/api/items/${id}`, {
    method: "DELETE",
  });

  return response.json();
}
```

#### Option C: Manual Token Fetch

```typescript
import { fetchCSRFToken } from "@/hooks/useCSRFToken";

async function myApiCall() {
  const token = await fetchCSRFToken();

  const response = await fetch("/api/endpoint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({ data: "..." }),
  });

  return response.json();
}
```

### 3. Form Submissions with Server Actions

Server Actions in Next.js App Router have built-in CSRF protection. No additional code needed:

```typescript
// app/my-page/actions.ts
"use server";

export async function submitForm(formData: FormData) {
  // This is automatically protected against CSRF
  const name = formData.get("name");
  // Process form...
}
```

```typescript
// app/my-page/page.tsx
"use client";

import { submitForm } from "./actions";

export default function Page() {
  return (
    <form action={submitForm}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Security Considerations

### When CSRF Protection is Required

✅ **Protect these endpoints**:
- POST, PUT, PATCH, DELETE requests
- State-changing operations
- Data mutations
- File uploads
- Settings updates
- Admin actions

❌ **Don't protect these**:
- GET requests (safe methods)
- Public read-only endpoints
- Health check endpoints
- Metrics endpoints

### Token Security

1. **HttpOnly Cookies**: Tokens are stored in httpOnly cookies to prevent XSS theft
2. **Secure Flag**: In production, cookies use the `secure` flag (HTTPS only)
3. **SameSite**: Cookies use `SameSite=Lax` to prevent cross-site requests
4. **Short Expiry**: Tokens expire after 1 hour
5. **HMAC Signature**: Tokens are cryptographically signed to prevent tampering

### Additional Protections

The platform uses multiple layers of security:

1. **CSRF Tokens** (this implementation)
2. **SameSite Cookies** (configured in NextAuth)
3. **Origin Validation** (Next.js built-in)
4. **Rate Limiting** (implemented on critical endpoints)
5. **Content Security Policy** (configured in security headers)

---

## Migration Guide

### Updating Existing API Routes

#### Before (No CSRF Protection)

```typescript
export async function POST(req: NextRequest) {
  const data = await req.json();
  // Process request...
  return NextResponse.json({ success: true });
}
```

#### After (With CSRF Protection)

```typescript
import { withCSRFProtection } from "@/lib/csrf";

async function handler(req: NextRequest) {
  const data = await req.json();
  // Process request...
  return NextResponse.json({ success: true });
}

export const POST = withCSRFProtection(handler);
```

### Updating Client-Side Code

#### Before

```typescript
const response = await fetch("/api/endpoint", {
  method: "POST",
  body: JSON.stringify(data),
});
```

#### After

```typescript
import { fetchWithCSRF } from "@/hooks/useCSRFToken";

const response = await fetchWithCSRF("/api/endpoint", {
  method: "POST",
  body: JSON.stringify(data),
});
```

---

## Testing

### Unit Tests

```typescript
import { generateCSRFToken, validateCSRFToken } from "@/lib/csrf";

describe("CSRF Protection", () => {
  it("should generate valid tokens", () => {
    const token = generateCSRFToken();
    expect(validateCSRFToken(token)).toBe(true);
  });

  it("should reject invalid tokens", () => {
    expect(validateCSRFToken("invalid-token")).toBe(false);
  });

  it("should reject expired tokens", async () => {
    const token = generateCSRFToken();

    // Fast-forward time by 2 hours
    jest.useFakeTimers();
    jest.advanceTimersByTime(2 * 60 * 60 * 1000);

    expect(validateCSRFToken(token)).toBe(false);

    jest.useRealTimers();
  });
});
```

### Integration Tests

```typescript
import { NextRequest } from "next/server";
import { POST } from "./route";
import { generateCSRFToken } from "@/lib/csrf";

describe("Protected API Route", () => {
  it("should reject requests without CSRF token", async () => {
    const req = new NextRequest("http://localhost/api/endpoint", {
      method: "POST",
      body: JSON.stringify({ data: "test" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(403);
  });

  it("should accept requests with valid CSRF token", async () => {
    const token = generateCSRFToken();

    const req = new NextRequest("http://localhost/api/endpoint", {
      method: "POST",
      headers: {
        "X-CSRF-Token": token,
      },
      body: JSON.stringify({ data: "test" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid or missing CSRF token" Error

**Cause**: Token not included in request or expired
**Solution**:
```typescript
// Ensure token is fetched before request
const token = await fetchCSRFToken();
```

#### 2. Token Expired

**Cause**: Token older than 1 hour
**Solution**: Fetch a new token before each request or implement automatic refresh

#### 3. Token Not Found in Cookie

**Cause**: Cookie blocked or cleared
**Solution**:
- Check browser cookie settings
- Ensure HTTPS in production
- Verify `sameSite` and `secure` flags

#### 4. CORS Issues

**Cause**: Cross-origin requests without proper configuration
**Solution**:
```typescript
// Ensure CORS headers allow credentials
headers: {
  "Access-Control-Allow-Credentials": "true",
}
```

---

## Performance Considerations

### Token Caching

Tokens are cached for 1 hour to reduce database/API calls:

```typescript
// The hook automatically caches the token
const { token } = useCSRFToken(); // Only fetches once per hour
```

### Batch Requests

For multiple API calls, reuse the same token:

```typescript
const token = await fetchCSRFToken();

await Promise.all([
  fetch("/api/endpoint1", { headers: { "X-CSRF-Token": token } }),
  fetch("/api/endpoint2", { headers: { "X-CSRF-Token": token } }),
  fetch("/api/endpoint3", { headers: { "X-CSRF-Token": token } }),
]);
```

---

## Best Practices

1. **Always protect state-changing operations** (POST, PUT, DELETE)
2. **Use the middleware wrapper** (`withCSRFProtection`) for consistency
3. **Don't skip CSRF** for admin or sensitive endpoints
4. **Combine with other protections** (rate limiting, auth, etc.)
5. **Test CSRF protection** in your test suite
6. **Monitor CSRF failures** to detect potential attacks

---

## API Reference

### Server-Side Functions

```typescript
// Generate a new CSRF token
generateCSRFToken(): string

// Validate a CSRF token
validateCSRFToken(token: string): boolean

// Set CSRF token cookie
setCSRFCookie(): Promise<string>

// Get CSRF token from cookie
getCSRFToken(): Promise<string | undefined>

// Middleware wrapper for API routes
withCSRFProtection(handler: Function): Function

// Validate CSRF from request
validateCSRFFromRequest(req: NextRequest): Promise<boolean>
```

### Client-Side Functions

```typescript
// React hook for CSRF token
useCSRFToken(): { token: string | null, loading: boolean, error: Error | null }

// Fetch CSRF token (non-React)
fetchCSRFToken(): Promise<string>

// Fetch with automatic CSRF token
fetchWithCSRF(url: string, options?: RequestInit): Promise<Response>
```

---

## Compliance

This implementation helps meet security requirements for:

- **OWASP Top 10**: Protection against A01:2021 – Broken Access Control
- **PCI DSS**: Requirement 6.5.9 (Cross-Site Request Forgery)
- **GDPR**: Security of Processing (Article 32)
- **SOC 2**: CC6.1 (Logical and Physical Access Controls)

---

## Additional Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: Cross-Site Request Forgery](https://developer.mozilla.org/en-US/docs/Glossary/CSRF)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/security)

---

*Last Updated: 2026-01-04*
*Version: 1.0*
