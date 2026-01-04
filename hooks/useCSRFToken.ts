/**
 * React Hook for CSRF Token Management
 *
 * Provides easy access to CSRF tokens for client-side forms and API calls.
 */

import { useEffect, useState } from "react";

interface CSRFTokenState {
  token: string | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and manage CSRF tokens
 *
 * Usage:
 * ```typescript
 * const { token, loading, error } = useCSRFToken();
 *
 * const handleSubmit = async (data) => {
 *   const response = await fetch("/api/endpoint", {
 *     method: "POST",
 *     headers: {
 *       "Content-Type": "application/json",
 *       "X-CSRF-Token": token || "",
 *     },
 *     body: JSON.stringify(data),
 *   });
 * };
 * ```
 */
export function useCSRFToken(): CSRFTokenState {
  const [state, setState] = useState<CSRFTokenState>({
    token: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchToken() {
      try {
        const response = await fetch("/api/csrf");

        if (!response.ok) {
          throw new Error("Failed to fetch CSRF token");
        }

        const data = await response.json();

        if (mounted) {
          setState({
            token: data.csrfToken,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            token: null,
            loading: false,
            error: error instanceof Error ? error : new Error("Unknown error"),
          });
        }
      }
    }

    fetchToken();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/**
 * Utility function to fetch CSRF token (for use outside of React components)
 *
 * Usage:
 * ```typescript
 * const token = await fetchCSRFToken();
 * ```
 */
export async function fetchCSRFToken(): Promise<string> {
  const response = await fetch("/api/csrf");

  if (!response.ok) {
    throw new Error("Failed to fetch CSRF token");
  }

  const data = await response.json();
  return data.csrfToken;
}

/**
 * Utility function to include CSRF token in fetch requests
 *
 * Usage:
 * ```typescript
 * const response = await fetchWithCSRF("/api/endpoint", {
 *   method: "POST",
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await fetchCSRFToken();

  const headers = new Headers(options.headers);
  headers.set("X-CSRF-Token", token);

  return fetch(url, {
    ...options,
    headers,
  });
}

export default useCSRFToken;
