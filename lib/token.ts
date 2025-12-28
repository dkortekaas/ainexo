import { randomBytes } from "crypto";

/**
 * Generate a cryptographically secure random token
 * Uses crypto.randomBytes instead of Math.random() for security
 * @param length Length of the token in bytes (default: 32 = 64 hex characters)
 * @returns Hex-encoded random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}
