import * as Sentry from "@sentry/nextjs";

let sentryInitialized = false;
export function register() {
  if (sentryInitialized) return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

  // Reduce Sentry overhead on public pages for better performance
  const isProduction = process.env.NODE_ENV === "production";

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    // Reduce trace sampling for better performance
    tracesSampleRate: isProduction ? 0.05 : 0.5,
    debug: false,
    // Only replay on errors, not regular sessions for performance
    replaysOnErrorSampleRate: isProduction ? 0.5 : 1.0,
    replaysSessionSampleRate: 0, // Disable session replay for better performance
    integrations: [
      // Only enable replay on errors
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      // Disable browser tracing for better initial load performance
      // Can be re-enabled with lower sample rate if needed
      // Sentry.browserTracingIntegration(),
    ],
    beforeSend(event) {
      if (!dsn) return null;
      if (process.env.NODE_ENV === "development") return null;
      return event;
    },
  });
  sentryInitialized = true;
}


