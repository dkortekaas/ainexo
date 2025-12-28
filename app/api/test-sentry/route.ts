import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Test endpoint for Sentry error tracking
 *
 * Usage:
 * - GET /api/test-sentry?type=client - Test client-side error
 * - GET /api/test-sentry?type=server - Test server-side error
 * - GET /api/test-sentry?type=handled - Test handled error with context
 *
 * WARNING: Remove this endpoint in production or protect with authentication
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "server";

  // Only allow in development and staging
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is not available in production" },
      { status: 403 }
    );
  }

  try {
    if (type === "client") {
      // Return HTML that will throw a client-side error
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Sentry Client Test</title></head>
          <body>
            <h1>Testing Sentry Client-Side Error Tracking</h1>
            <script>
              setTimeout(() => {
                throw new Error("Test client-side error from /api/test-sentry");
              }, 100);
            </script>
          </body>
        </html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    } else if (type === "handled") {
      // Test a handled error with additional context
      try {
        // Simulate some operation
        const result = performRiskyOperation();
        return NextResponse.json({ success: true, result });
      } catch (error) {
        // Capture error with additional context
        Sentry.captureException(error, {
          level: "error",
          tags: {
            endpoint: "/api/test-sentry",
            operation: "riskyOperation",
          },
          extra: {
            timestamp: new Date().toISOString(),
            requestUrl: request.url,
          },
        });

        return NextResponse.json(
          {
            error: "Handled error logged to Sentry",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    } else {
      // Default: throw a server-side error
      throw new Error("Test server-side error from /api/test-sentry - This is intentional!");
    }
  } catch (error) {
    // This error will be automatically caught by Sentry
    throw error;
  }
}

function performRiskyOperation(): string {
  // Simulate an error
  throw new Error("Simulated error in performRiskyOperation");
}

// Test different HTTP methods
export async function POST(request: NextRequest) {
  Sentry.captureMessage("Test POST request to /api/test-sentry", {
    level: "info",
    extra: {
      method: "POST",
      timestamp: new Date().toISOString(),
    },
  });

  return NextResponse.json({
    message: "POST request logged to Sentry",
    timestamp: new Date().toISOString(),
  });
}
