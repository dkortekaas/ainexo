"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/**
 * Global error boundary that catches errors in the root layout
 * This is a special Next.js file that must be defined at the root level
 * Learn more: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry with high priority
    Sentry.captureException(error, {
      level: "fatal",
      tags: {
        component: "global-error-boundary",
      },
      extra: {
        digest: error.digest,
      },
    });

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Global error caught:", error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                marginBottom: "20px",
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                marginBottom: "16px",
                color: "#1f2937",
              }}
            >
              Something went wrong!
            </h1>

            <p
              style={{
                fontSize: "18px",
                color: "#6b7280",
                marginBottom: "32px",
              }}
            >
              We apologize for the inconvenience. Our team has been notified and
              is working on a fix.
            </p>

            {error.digest && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#9ca3af",
                  marginBottom: "32px",
                  fontFamily: "monospace",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  fontWeight: "500",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>

              <Link
                href="/"
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "#4b5563",
                  fontWeight: "500",
                  border: "1px solid #d1d5db",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Go to homepage
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
