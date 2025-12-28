/**
 * URL Validation and SSRF Protection
 *
 * Prevents Server-Side Request Forgery (SSRF) attacks by validating
 * user-provided URLs before making requests.
 */

/**
 * List of private/internal IP ranges to block (SSRF protection)
 */
const BLOCKED_IP_RANGES = [
  // Loopback addresses
  /^127\./,
  /^localhost$/i,
  /^::1$/,
  /^0\.0\.0\.0$/,

  // Private IP ranges (RFC 1918)
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,

  // Link-local addresses
  /^169\.254\./,
  /^fe80:/i,

  // Multicast
  /^224\./,
  /^ff00:/i,

  // Documentation ranges
  /^192\.0\.2\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,

  // Other special-use addresses
  /^0\./,
  /^255\./,
];

/**
 * Check if a hostname is a blocked private/internal address
 */
function isBlockedHostname(hostname: string): boolean {
  // Check against blocked patterns
  return BLOCKED_IP_RANGES.some((pattern) => pattern.test(hostname));
}

/**
 * Validate URL for SSRF protection
 *
 * @param urlString - URL to validate
 * @returns Object with valid flag and optional error message
 */
export function validateUrlSafety(urlString: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const url = new URL(urlString);

    // Only allow HTTP and HTTPS
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {
        valid: false,
        error: `Protocol "${url.protocol}" not allowed. Only HTTP and HTTPS are supported.`,
      };
    }

    // Check for blocked hostnames
    const hostname = url.hostname.toLowerCase();

    if (isBlockedHostname(hostname)) {
      console.warn(`🚫 SSRF attempt blocked: ${hostname}`);
      return {
        valid: false,
        error: "Access to private/internal addresses is not allowed for security reasons.",
      };
    }

    // Block URLs with authentication credentials (potential credential leak)
    if (url.username || url.password) {
      return {
        valid: false,
        error: "URLs with embedded credentials are not allowed.",
      };
    }

    // Additional checks for suspicious patterns
    if (hostname.includes("@")) {
      return {
        valid: false,
        error: "Invalid hostname format.",
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid URL format",
    };
  }
}

/**
 * Validate and sanitize URL for scraping
 * Combines format validation with security checks
 */
export function validateScrapingUrl(urlString: string): {
  valid: boolean;
  url?: URL;
  error?: string;
} {
  // First check safety
  const safetyCheck = validateUrlSafety(urlString);
  if (!safetyCheck.valid) {
    return safetyCheck;
  }

  // Parse URL
  try {
    const url = new URL(urlString);

    // Normalize URL (remove fragments, sort query params)
    url.hash = "";

    return {
      valid: true,
      url,
    };
  } catch (error) {
    return {
      valid: false,
      error: "Invalid URL format",
    };
  }
}
