// lib/encryption.ts
import crypto from "crypto";
import { logger } from "@/lib/logger";

// Encryption key MUST be set in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validate encryption key on module load
if (!ENCRYPTION_KEY) {
  throw new Error(
    "ENCRYPTION_KEY environment variable is required for encryption. " +
    "Generate a secure key with: openssl rand -hex 32"
  );
}

if (ENCRYPTION_KEY.length < 32) {
  throw new Error(
    "ENCRYPTION_KEY must be at least 32 characters long. " +
    "Current length: " + ENCRYPTION_KEY.length
  );
}

const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts text using AES-256-CBC algorithm
 * @param text Text to encrypt
 * @param salt Additional salt to strengthen encryption (e.g., userId)
 * @returns Encrypted text as base64 string with IV prepended
 */
export function encrypt(text: string, salt: string = ""): string {
  // Create a unique key based on the main key and the salt
  const key = crypto
    .createHash("sha256")
    .update(ENCRYPTION_KEY + salt)
    .digest();

  // Create a random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  // Encrypt the text
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Prepend IV to the encrypted text (IV doesn't need to be secret)
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypts text using AES-256-CBC algorithm
 * @param encryptedText Text to decrypt (must include IV)
 * @param salt The same salt used during encryption
 * @returns Decrypted text
 */
export function decrypt(encryptedText: string, salt: string = ""): string {
  try {
    // Create a unique key based on the main key and the salt
    const key = crypto
      .createHash("sha256")
      .update(ENCRYPTION_KEY + salt)
      .digest();

    // Split IV and encrypted text
    const textParts = encryptedText.split(":");
    const iv = Buffer.from(textParts[0], "hex");
    const encryptedData = textParts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("Decryption error", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

/**
 * Generate a secure random string
 * @param length Length of the string to generate
 * @returns Random string
 */
export function generateRandomString(length: number = 32): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}
