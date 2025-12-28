/**
 * Instrumentation file for Next.js
 *
 * This file runs once when the Next.js server starts up.
 * It's the perfect place to:
 * - Validate environment variables
 * - Initialize monitoring tools
 * - Set up global error handlers
 * - Connect to databases or external services
 *
 * Learn more: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import * as Sentry from "@sentry/nextjs";

let sentryInitialized = false;

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize Sentry
    if (!sentryInitialized) {
      const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

      const options: any = {
        dsn,
        environment: process.env.NODE_ENV,
        release: process.env.VERCEL_GIT_COMMIT_SHA,
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        debug: false,
        // Only add Prisma integration on node runtime
        integrations: [
          ...(typeof process !== "undefined" && (process as any).versions?.node
            ? [Sentry.prismaIntegration()]
            : []),
        ],
        beforeSend(event: any) {
          // Don't send events if no DSN is configured
          if (!dsn) return null;

          // Filter sensitive request data
          if (event.request?.headers) {
            delete (event.request.headers as any)["authorization"];
            delete (event.request.headers as any)["cookie"];
            delete (event.request.headers as any)["x-api-key"];
          }

          // Redact sensitive query params if present
          if (event.request?.query_string) {
            const sensitiveParams = ["token", "apiKey", "password", "secret"];
            let query = event.request.query_string as string;
            for (const p of sensitiveParams) {
              const regex = new RegExp(`${p}=[^&]*`, "gi");
              query = query.replace(regex, `${p}=[REDACTED]`);
            }
            (event.request as any).query_string = query;
          }

          return event;
        },
      };
      Sentry.init(options as any);
      sentryInitialized = true;
    }

    // Validate environment variables at startup
    // This will throw an error and prevent server start if validation fails
    await import("./lib/startup-validation");

    console.log("✅ Server instrumentation completed successfully");
  }

  // Edge runtime instrumentation (if needed)
  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime has limited environment - no file system, etc.
    console.log("✅ Edge runtime instrumentation completed");
  }
}

export async function onRequestError(
  err: Error,
  request: {
    path: string;
    headers: Record<string, string | null>;
    method?: string;
  }
) {
  // Ensure Sentry is initialized before capturing
  if (!sentryInitialized) {
    await register();
  }

  // Prepare request info matching Sentry's RequestInfo type
  const requestInfo = {
    path: request.path,
    method: request.method || "GET",
    headers: request.headers as Record<string, string | string[] | undefined>,
  };

  // Prepare error context
  const errorContext = {
    routerKind: "App Router",
    routePath: request.path,
    routeType: "route",
  };

  Sentry.captureRequestError(err, requestInfo, errorContext);
}
