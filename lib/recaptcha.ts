/**
 * reCAPTCHA v3 Integration
 *
 * Provides server-side verification for Google reCAPTCHA v3 tokens.
 * Used to protect authentication endpoints from bot attacks and abuse.
 *
 * Features:
 * - Server-side token verification
 * - Configurable score threshold (0.0 - 1.0)
 * - Action verification
 * - Error handling with fallback
 * - Development mode support
 */

interface RecaptchaVerifyResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

interface VerifyResult {
  success: boolean;
  score?: number;
  error?: string;
}

/**
 * Verify a reCAPTCHA token from the client
 *
 * @param token - The reCAPTCHA token from the client
 * @param expectedAction - The expected action (e.g., 'register', 'login', 'forgot_password')
 * @param minScore - Minimum score to consider valid (default: 0.5)
 * @returns Verification result with success status
 */
export async function verifyRecaptchaToken(
  token: string | null | undefined,
  expectedAction: string,
  minScore: number = 0.5
): Promise<VerifyResult> {
  // In development or if reCAPTCHA is not configured, allow all requests
  if (process.env.NODE_ENV === 'development' && !process.env.RECAPTCHA_SECRET_KEY) {
    console.warn('⚠️ reCAPTCHA not configured in development - skipping verification');
    return { success: true, score: 1.0 };
  }

  // If no secret key is configured, fail closed (deny request)
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.error('❌ RECAPTCHA_SECRET_KEY not configured');
    return {
      success: false,
      error: 'reCAPTCHA not configured on server',
    };
  }

  // Token is required
  if (!token) {
    return {
      success: false,
      error: 'reCAPTCHA token is required',
    };
  }

  try {
    // Call Google reCAPTCHA API
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    if (!response.ok) {
      console.error('❌ reCAPTCHA API request failed:', response.status);
      return {
        success: false,
        error: 'Failed to verify reCAPTCHA token',
      };
    }

    const data: RecaptchaVerifyResponse = await response.json();

    // Check if verification was successful
    if (!data.success) {
      const errors = data['error-codes']?.join(', ') || 'unknown error';
      console.warn(`⚠️ reCAPTCHA verification failed: ${errors}`);
      return {
        success: false,
        error: `reCAPTCHA verification failed: ${errors}`,
      };
    }

    // Check if action matches expected action
    if (data.action !== expectedAction) {
      console.warn(
        `⚠️ reCAPTCHA action mismatch: expected '${expectedAction}', got '${data.action}'`
      );
      return {
        success: false,
        error: 'reCAPTCHA action mismatch',
      };
    }

    // Check if score meets minimum threshold
    if (data.score < minScore) {
      console.warn(
        `⚠️ reCAPTCHA score too low: ${data.score} < ${minScore} (action: ${expectedAction})`
      );
      return {
        success: false,
        score: data.score,
        error: `reCAPTCHA score too low: ${data.score}`,
      };
    }

    console.log(`✅ reCAPTCHA verified: score ${data.score} (action: ${expectedAction})`);

    return {
      success: true,
      score: data.score,
    };
  } catch (error) {
    console.error('❌ Error verifying reCAPTCHA:', error);
    return {
      success: false,
      error: 'Failed to verify reCAPTCHA token',
    };
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use verifyRecaptchaToken instead
 */
export async function verifyRecaptcha(token: string): Promise<boolean> {
  const result = await verifyRecaptchaToken(token, 'legacy', 0.5);
  return result.success;
}

/**
 * Check if reCAPTCHA is enabled and configured
 */
export function isRecaptchaEnabled(): boolean {
  return !!(
    process.env.RECAPTCHA_SECRET_KEY &&
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  );
}

/**
 * Get reCAPTCHA site key for client-side integration
 */
export function getRecaptchaSiteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
}
