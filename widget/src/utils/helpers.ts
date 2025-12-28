/**
 * Generate a cryptographically secure unique session ID
 * Uses Web Crypto API for better security than Math.random()
 */
export function generateSessionId(): string {
  // Use Web Crypto API for secure random values
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 16);
  return `session_${Date.now()}_${randomPart}`;
}

/**
 * Format timestamp for display
 */
export function formatTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Validate API key format
 */
export function isValidApiKey(apiKey: string): boolean {
  return Boolean(apiKey && apiKey.length > 10 && apiKey.startsWith("cbk_"));
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().slice(0, 1000); // Limit to 1000 characters
}

/**
 * Check if running in mobile browser
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
