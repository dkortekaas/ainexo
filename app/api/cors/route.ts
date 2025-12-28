import { NextRequest, NextResponse } from "next/server";

/**
 * Generic CORS preflight handler
 * Note: This is a fallback handler. Specific API routes should implement
 * their own CORS validation based on chatbot allowedDomains settings.
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Define allowed origins - only allow requests from trusted domains
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter(Boolean); // Remove undefined values

  // Check if the origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // If origin is not allowed, return 403 Forbidden
  if (!isAllowedOrigin) {
    return new NextResponse(null, {
      status: 403,
      statusText: "Forbidden - Origin not allowed",
    });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Chatbot-API-Key",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
