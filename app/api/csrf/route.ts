/**
 * CSRF Token API Endpoint
 *
 * Provides CSRF tokens for client-side use.
 * Tokens are also set as httpOnly cookies for automatic inclusion in requests.
 */

import { NextResponse } from "next/server";
import { setCSRFCookie } from "@/lib/csrf";
import { logger } from "@/lib/logger";

/**
 * GET /api/csrf
 *
 * Returns a new CSRF token and sets it as a cookie.
 * Client applications can call this endpoint to obtain a CSRF token
 * before making state-changing requests.
 *
 * Response:
 * {
 *   "csrfToken": "base64url_encoded_token",
 *   "expiresIn": 3600
 * }
 */
export async function GET() {
  try {
    const token = await setCSRFCookie();

    return NextResponse.json({
      csrfToken: token,
      expiresIn: 3600, // 1 hour in seconds
    });
  } catch (error) {
    logger.error("Failed to generate CSRF token", error instanceof Error ? error : undefined);
    return NextResponse.json(
      {
        error: "Failed to generate CSRF token",
      },
      { status: 500 }
    );
  }
}
