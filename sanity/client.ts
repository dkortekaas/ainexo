import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

// Lazy client creation - only create when actually needed
let _client: SanityClient | null = null;

function getClient(): SanityClient {
  if (!_client) {
    if (!projectId) {
      throw new Error(
        "Sanity projectId is not configured. " +
          "Please set NEXT_PUBLIC_SANITY_PROJECT_ID in your Vercel environment variables or .env.local file."
      );
    }
    if (!dataset) {
      throw new Error(
        "Sanity dataset is not configured. " +
          "Please set NEXT_PUBLIC_SANITY_DATASET in your Vercel environment variables or .env.local file."
      );
    }
    _client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      perspective: "published",
      // Add request timeout and retry configuration for serverless environments
      // Reduced timeout for serverless (Vercel Hobby: 10s, Pro: 60s)
      timeout: 20000, // 20 seconds (reduced from default 5 minutes for serverless)
      maxRetries: 3, // Retry up to 3 times for network errors
      retryDelay: (attemptNumber) => {
        // Exponential backoff with jitter: ~100ms, ~200ms, ~400ms
        return 100 * Math.pow(2, attemptNumber) + Math.random() * 100;
      },
    });
  }
  return _client;
}

// Retry wrapper for Sanity fetch operations
// This provides additional retry logic for network errors that the built-in retry might not catch
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 2, // Additional retries on top of Sanity's built-in retries
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error;

      // Check if it's a network error that should be retried
      const isRetryableError =
        error instanceof Error &&
        (error.message.includes("ECONNRESET") ||
          error.message.includes("socket") ||
          error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("fetch failed") ||
          error.name === "AbortError" ||
          (error as any).cause?.code === "ECONNRESET");

      // Don't retry on last attempt or if error is not retryable
      if (attempt === maxRetries || !isRetryableError) {
        throw error;
      }

      // Exponential backoff: wait longer between retries
      const delay = retryDelay * Math.pow(2, attempt);
      console.warn(
        `Sanity fetch failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
        error instanceof Error ? error.message : "Unknown error",
        (error as any).cause ? `Cause: ${(error as any).cause.code}` : ""
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Create a proxy that wraps fetch calls with retry logic
const baseClient = new Proxy({} as SanityClient, {
  get(_target, prop) {
    const actualClient = getClient();
    const value = (actualClient as any)[prop];

    // Wrap fetch method with retry logic
    if (prop === "fetch" && typeof value === "function") {
      return function (query: string, params?: any, options?: any) {
        return fetchWithRetry(() =>
          value.call(actualClient, query, params, options)
        );
      };
    }

    if (typeof value === "function") {
      return value.bind(actualClient);
    }
    return value;
  },
});

export const client = baseClient;
