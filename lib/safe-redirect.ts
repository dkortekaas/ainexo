/**
 * Validates and safely redirects to a URL
 * Prevents open redirect vulnerabilities by validating URLs before redirecting
 */

const TRUSTED_DOMAINS = [
  'stripe.com',
  'checkout.stripe.com',
  // Add other trusted external domains here if needed
];

/**
 * Checks if a URL is safe to redirect to
 * @param url - The URL to validate
 * @returns true if the URL is safe, false otherwise
 */
export function isSafeRedirectUrl(url: string): boolean {
  try {
    // Parse the URL
    const parsedUrl = new URL(url, window.location.origin);

    // Allow same-origin redirects
    if (parsedUrl.origin === window.location.origin) {
      return true;
    }

    // Check if the domain is in our trusted list
    const hostname = parsedUrl.hostname;
    const isTrusted = TRUSTED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    return isTrusted;
  } catch (error) {
    // Invalid URL
    return false;
  }
}

/**
 * Safely redirects to a URL after validation
 * @param url - The URL to redirect to
 * @throws Error if the URL is not safe
 */
export function safeRedirect(url: string): void {
  if (!isSafeRedirectUrl(url)) {
    throw new Error('Invalid or untrusted redirect URL');
  }

  window.location.href = url;
}

/**
 * Safely redirects with user feedback (toast notification)
 * @param url - The URL to redirect to
 * @param message - Optional message to show before redirecting
 */
export async function safeRedirectWithFeedback(
  url: string,
  message: string = 'Redirecting...'
): Promise<void> {
  if (!isSafeRedirectUrl(url)) {
    throw new Error('Invalid or untrusted redirect URL');
  }

  // Note: Import toast dynamically to avoid circular dependencies
  // Component should handle showing the toast message

  // Small delay to show the message
  await new Promise(resolve => setTimeout(resolve, 500));

  window.location.href = url;
}
