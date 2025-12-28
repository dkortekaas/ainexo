/**
 * CORS (Cross-Origin Resource Sharing) Security Helper
 *
 * Validates request origins against allowed domains to prevent
 * unauthorized cross-origin access to the API.
 */

import { logger } from "./logger";

/**
 * Validates if a given origin is allowed based on the allowedDomains list
 *
 * @param origin - The origin from the request headers (e.g., "https://example.com")
 * @param allowedDomains - Array of allowed domains from chatbot settings
 * @returns true if origin is allowed, false otherwise
 */
export function isOriginAllowed(
  origin: string | null,
  allowedDomains: string[]
): boolean {
  if (!origin) {
    return false;
  }

  // If allowedDomains is empty or contains '*', allow all origins
  // (though this should be avoided in production)
  if (allowedDomains.length === 0 || allowedDomains.includes("*")) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const originHostname = originUrl.hostname;

    // Check if origin matches any allowed domain
    return allowedDomains.some((domain) => {
      // Remove protocol if present in domain
      const cleanDomain = domain.replace(/^https?:\/\//, "").toLowerCase();
      const cleanOrigin = originHostname.toLowerCase();

      // Exact match
      if (cleanDomain === cleanOrigin) {
        return true;
      }

      // Wildcard subdomain match (e.g., *.example.com)
      if (cleanDomain.startsWith("*.")) {
        const baseDomain = cleanDomain.substring(2); // Remove *.
        return (
          cleanOrigin === baseDomain || cleanOrigin.endsWith("." + baseDomain)
        );
      }

      return false;
    });
  } catch (error) {
    logger.error("Invalid origin URL", {
      origin,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Generates CORS headers based on origin validation
 *
 * @param origin - The origin from the request headers
 * @param allowedDomains - Array of allowed domains from chatbot settings
 * @returns Headers object with appropriate CORS headers
 */
export function getCorsHeaders(
  origin: string | null,
  allowedDomains: string[]
): Record<string, string> {
  const isAllowed = isOriginAllowed(origin, allowedDomains);

  if (!isAllowed) {
    // Return minimal headers without allowing the origin
    return {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Chatbot-API-Key",
    };
  }

  // Return full CORS headers with the validated origin
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Chatbot-API-Key",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

/**
 * Validates CORS for a request and returns error response if not allowed
 *
 * @param origin - The origin from the request headers
 * @param allowedDomains - Array of allowed domains from chatbot settings
 * @returns null if allowed, error message string if not allowed
 */
export function validateCorsOrigin(
  origin: string | null,
  allowedDomains: string[]
): string | null {
  if (!isOriginAllowed(origin, allowedDomains)) {
    logger.warn("CORS: Blocked request from unauthorized origin", {
      origin,
      allowedDomains: allowedDomains.length > 0 ? allowedDomains.join(", ") : "none",
    });
    return "Origin not allowed";
  }

  return null;
}
