// lib/2fa.ts
import crypto from "crypto";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { encrypt, decrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

// Generate a random secret for TOTP
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

// Encrypt the TOTP secret for storage
export function encryptSecret(secret: string, userId: string): string {
  return encrypt(secret, userId);
}

// Decrypt the TOTP secret for verification
export function decryptSecret(encryptedSecret: string, userId: string): string {
  return decrypt(encryptedSecret, userId);
}

// Verify a TOTP token
export function verifyTOTP(
  token: string,
  secret: string,
  userId?: string,
  companyId?: string
): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    logger.error("Error verifying TOTP", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId: userId,
      companyId: companyId,
    });
    throw error;
  }
}

// Generate a QR code URL for authenticator apps
export async function generateQRCode(
  secret: string,
  email: string,
  issuer: string = "Declaratie Portal"
): Promise<string> {
  const otpauth = authenticator.keyuri(email, issuer, secret);
  return await qrcode.toDataURL(otpauth);
}

// Generate recovery codes
export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 6 groups of 4 alphanumeric characters
    const code = Array(6)
      .fill(0)
      .map(() => crypto.randomBytes(2).toString("hex"))
      .join("-");
    codes.push(code);
  }
  return codes;
}

// Hash recovery codes for storage
export function hashRecoveryCodes(codes: string[]): string[] {
  return codes.map((code) => {
    const hash = crypto.createHash("sha256");
    hash.update(code);
    return hash.digest("hex");
  });
}

// Store hashed recovery codes as JSON string
export function serializeRecoveryCodes(hashedCodes: string[]): string {
  return JSON.stringify(hashedCodes);
}

// Parse stored recovery codes
export function parseRecoveryCodes(
  serializedCodes: string | null,
  userId?: string,
  companyId?: string
): string[] {
  if (!serializedCodes) return [];
  try {
    return JSON.parse(serializedCodes);
  } catch (error) {
    logger.error("Error parsing recovery codes", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId: userId,
      companyId: companyId,
    });
    throw error;
  }
}

// Verify a recovery code
export function verifyRecoveryCode(
  code: string,
  hashedCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  const normalizedCode = code.trim().toLowerCase();
  const hash = crypto.createHash("sha256").update(normalizedCode).digest("hex");

  const index = hashedCodes.indexOf(hash);
  if (index === -1) {
    return { valid: false, remainingCodes: hashedCodes };
  }

  // Remove the used code
  const remainingCodes = [...hashedCodes];
  remainingCodes.splice(index, 1);

  return { valid: true, remainingCodes };
}

// Generate a unique device identifier
export function generateDeviceId(): string {
  return crypto.randomBytes(16).toString("hex");
}
