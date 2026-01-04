/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * Provides CSRF token generation and validation for API routes.
 * Note: NextAuth already provides CSRF protection for authentication routes.
 * This is for additional API routes that handle state-changing operations.
 */

import { randomBytes, createHmac } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const CSRF_TOKEN_NAME = "csrf_token";
const CSRF_SECRET = process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY!;
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds

interface CSRFToken {
  token: string;
  timestamp: number;
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const token = randomBytes(TOKEN_LENGTH).toString("base64url");
  const timestamp = Date.now();
  const data = JSON.stringify({ token, timestamp });

  // Create HMAC signature
  const signature = createHmac("sha256", CSRF_SECRET)
    .update(data)
    .digest("base64url");

  // Combine data and signature
  return `${data}.${signature}`;
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(tokenString: string | null): boolean {
  if (!tokenString) {
    return false;
  }

  try {
    // Split token and signature
    const parts = tokenString.split(".");
    if (parts.length !== 2) {
      return false;
    }

    const [data, providedSignature] = parts;

    // Verify signature
    const expectedSignature = createHmac("sha256", CSRF_SECRET)
      .update(data)
      .digest("base64url");

    if (providedSignature !== expectedSignature) {
      return false;
    }

    // Parse data and check expiry
    const parsed: CSRFToken = JSON.parse(data);
    const age = Date.now() - parsed.timestamp;

    if (age > TOKEN_EXPIRY) {
      return false; // Token expired
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Set CSRF token in cookie
 */
export async function setCSRFCookie(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_EXPIRY / 1000, // Convert to seconds
  });

  return token;
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_NAME)?.value;
}

/**
 * Delete CSRF token cookie
 */
export async function deleteCSRFCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_TOKEN_NAME);
}

/**
 * CSRF Protection Middleware for API Routes
 *
 * Usage in API route:
 * ```typescript
 * import { withCSRFProtection } from "@/lib/csrf";
 *
 * async function handler(req: NextRequest) {
 *   // Your API logic here
 *   return NextResponse.json({ success: true });
 * }
 *
 * export const POST = withCSRFProtection(handler);
 * ```
 */
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Only protect state-changing methods
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      // Get token from header or cookie
      const headerToken = req.headers.get("X-CSRF-Token");
      const cookieStore = await cookies();
      const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

      // Validate token
      const isValid =
        (headerToken && validateCSRFToken(headerToken)) ||
        (cookieToken && validateCSRFToken(cookieToken));

      if (!isValid) {
        return NextResponse.json(
          {
            error: "Invalid or missing CSRF token",
            code: "CSRF_TOKEN_INVALID",
          },
          { status: 403 }
        );
      }
    }

    // Token is valid or not required (GET request), proceed with handler
    return handler(req);
  };
}

/**
 * Client-side helper to get CSRF token for fetch requests
 *
 * Usage:
 * ```typescript
 * import { getCSRFTokenForFetch } from "@/lib/csrf";
 *
 * const csrfToken = await getCSRFTokenForFetch();
 * const response = await fetch("/api/endpoint", {
 *   method: "POST",
 *   headers: {
 *     "Content-Type": "application/json",
 *     "X-CSRF-Token": csrfToken,
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function getCSRFTokenForFetch(): Promise<string> {
  // First try to get from existing cookie
  const existingToken = await getCSRFToken();
  if (existingToken && validateCSRFToken(existingToken)) {
    return existingToken;
  }

  // Generate new token and set cookie
  return setCSRFCookie();
}

/**
 * Validate CSRF token from request
 *
 * Usage in API route:
 * ```typescript
 * const isValid = await validateCSRFFromRequest(req);
 * if (!isValid) {
 *   return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
 * }
 * ```
 */
export async function validateCSRFFromRequest(
  req: NextRequest
): Promise<boolean> {
  const headerToken = req.headers.get("X-CSRF-Token");
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  return (
    (headerToken !== null && validateCSRFToken(headerToken)) ||
    (cookieToken !== null && validateCSRFToken(cookieToken))
  );
}

/**
 * CSRF token endpoint to get token for client-side use
 *
 * Create an API route at app/api/csrf/route.ts:
 * ```typescript
 * import { NextResponse } from "next/server";
 * import { setCSRFCookie } from "@/lib/csrf";
 *
 * export async function GET() {
 *   const token = await setCSRFCookie();
 *   return NextResponse.json({ csrfToken: token });
 * }
 * ```
 */

export default {
  generateCSRFToken,
  validateCSRFToken,
  setCSRFCookie,
  getCSRFToken,
  deleteCSRFCookie,
  withCSRFProtection,
  validateCSRFFromRequest,
  getCSRFTokenForFetch,
};
