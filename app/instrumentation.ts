import * as Sentry from "@sentry/nextjs";

let sentryInitialized = false;
export function register() {
  if (sentryInitialized) return; // avoid double init in dev

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
    register();
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
