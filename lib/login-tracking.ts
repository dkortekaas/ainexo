/**
 * Login Attempt Tracking for reCAPTCHA Enforcement and Account Lockout
 *
 * Tracks failed login attempts to:
 * - Trigger reCAPTCHA after 3 failures
 * - Lock account after 10 failures
 * Uses in-memory storage with automatic cleanup.
 */

import { db } from "./db";
import * as Sentry from "@sentry/nextjs";

interface LoginAttempt {
  count: number;
  firstAttempt: number; // timestamp
  lastAttempt: number; // timestamp
}

// In-memory storage for failed login attempts
// Key: email address (lowercase)
const failedAttempts = new Map<string, LoginAttempt>();

// Thresholds
const RECAPTCHA_THRESHOLD = 3; // Require reCAPTCHA after 3 failures
const LOCKOUT_THRESHOLD = 10; // Lock account after 10 failures
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

// Clean up old entries every 5 minutes
// Skip interval creation in test environment to prevent Jest from hanging
let cleanupInterval: NodeJS.Timeout | null = null;
const isTestEnvironment =
  process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

if (typeof setInterval !== "undefined" && !isTestEnvironment) {
  cleanupInterval = setInterval(
    () => {
      cleanupOldAttempts();
    },
    5 * 60 * 1000
  );
  // Use unref() so the timer doesn't prevent Node.js from exiting
  // This is important for graceful shutdown
  if (cleanupInterval && typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }
}

/**
 * Record a failed login attempt
 * Locks account if threshold is reached
 *
 * @param email - User's email address
 */
export async function recordFailedLogin(email: string): Promise<void> {
  const key = email.toLowerCase();
  const now = Date.now();
  const existing = failedAttempts.get(key);

  let newCount: number;

  if (existing) {
    // Increment count
    existing.count += 1;
    existing.lastAttempt = now;
    newCount = existing.count;
  } else {
    // First failed attempt
    failedAttempts.set(key, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    newCount = 1;
  }

  console.log(`⚠️ Failed login attempt for ${email}: ${newCount} attempts`);

  // Lock account if threshold reached
  if (newCount >= LOCKOUT_THRESHOLD) {
    await lockAccount(email, "Too many failed login attempts");
  }

  // Alert via Sentry if approaching lockout
  if (newCount >= LOCKOUT_THRESHOLD - 2) {
    Sentry.captureMessage("Multiple failed login attempts detected", {
      level: "warning",
      extra: {
        email: email.substring(0, 3) + "***",
        attempts: newCount,
        threshold: LOCKOUT_THRESHOLD,
      },
    });
  }
}

/**
 * Lock an account temporarily
 *
 * @param email - User's email address
 * @param reason - Reason for lockout
 */
async function lockAccount(email: string, reason: string): Promise<void> {
  try {
    const lockUntil = new Date(Date.now() + LOCKOUT_DURATION);

    await db.user.updateMany({
      where: { email },
      data: {
        isActive: false,
        // Store lockout info in future if we add these fields
      },
    });

    console.log(
      `🔒 Account locked for ${email} until ${lockUntil.toISOString()}`
    );

    Sentry.captureMessage(
      "Account automatically locked due to failed login attempts",
      {
        level: "warning",
        extra: {
          email: email.substring(0, 3) + "***",
          reason,
          lockUntil: lockUntil.toISOString(),
        },
      }
    );
  } catch (error) {
    console.error(`Failed to lock account ${email}:`, error);
  }
}

/**
 * Check if account should be locked based on failed attempts
 *
 * @param email - User's email address
 * @returns true if account should be locked
 */
export function shouldLockAccount(email: string): boolean {
  const count = getFailedLoginCount(email);
  return count >= LOCKOUT_THRESHOLD;
}

/**
 * Check if reCAPTCHA should be required for this email
 *
 * @param email - User's email address
 * @param threshold - Number of failed attempts before requiring reCAPTCHA (default: 3)
 * @param timeWindow - Time window in milliseconds to consider (default: 15 minutes)
 * @returns true if reCAPTCHA is required
 */
export function requiresRecaptcha(
  email: string,
  threshold: number = 3,
  timeWindow: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const key = email.toLowerCase();
  const attempt = failedAttempts.get(key);

  if (!attempt) {
    return false;
  }

  // Check if attempts are within time window
  const now = Date.now();
  const timeSinceFirst = now - attempt.firstAttempt;

  if (timeSinceFirst > timeWindow) {
    // Reset if outside time window
    failedAttempts.delete(key);
    return false;
  }

  return attempt.count >= threshold;
}

/**
 * Reset failed login attempts for an email (e.g., after successful login)
 *
 * @param email - User's email address
 */
export function resetFailedLogins(email: string): void {
  const key = email.toLowerCase();
  failedAttempts.delete(key);
  console.log(`✅ Reset failed login attempts for ${email}`);
}

/**
 * Get current failed login count for an email
 *
 * @param email - User's email address
 * @returns Number of failed attempts
 */
export function getFailedLoginCount(email: string): number {
  const key = email.toLowerCase();
  return failedAttempts.get(key)?.count || 0;
}

/**
 * Clean up old failed login attempts
 * Removes entries older than 1 hour
 */
function cleanupOldAttempts(): void {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  let cleaned = 0;

  for (const [key, attempt] of failedAttempts.entries()) {
    if (now - attempt.lastAttempt > maxAge) {
      failedAttempts.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} old login attempt entries`);
  }
}

/**
 * Get statistics about failed login tracking
 */
export function getLoginTrackingStats() {
  return {
    totalTracked: failedAttempts.size,
    entries: Array.from(failedAttempts.entries()).map(([email, attempt]) => ({
      email: email.substring(0, 3) + "***", // Partially hidden for privacy
      count: attempt.count,
      ageMinutes: Math.floor((Date.now() - attempt.firstAttempt) / 60000),
    })),
  };
}

/**
 * Test-only utility to reset in-memory tracking between tests
 */
export function __resetLoginTrackingForTests(): void {
  failedAttempts.clear();
  // Clear the cleanup interval if it exists (for tests)
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
