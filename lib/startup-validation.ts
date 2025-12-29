/**
 * Environment Variable Validation
 *
 * This module validates all required environment variables at application startup.
 * It prevents the application from starting with missing or invalid configuration,
 * providing clear error messages to help diagnose issues.
 *
 * Usage:
 * - Automatically runs on server startup
 * - Validates format, length, and presence of critical variables
 * - Provides helpful error messages for debugging
 */

import { z } from "zod";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

/**
 * Environment Variable Schema
 *
 * Defines validation rules for all critical environment variables.
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (url) => url.startsWith("postgres://") || url.startsWith("postgresql://"),
      "DATABASE_URL must be a valid PostgreSQL connection string"
    ),

  // NextAuth
  NEXTAUTH_URL: z
    .string()
    .min(1, "NEXTAUTH_URL is required")
    .url("NEXTAUTH_URL must be a valid URL"),

  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters for security")
    .refine(
      (secret) => secret !== "your-nextauth-secret-here-min-32-chars",
      "NEXTAUTH_SECRET cannot be the default value from .env.example"
    ),

  // Encryption Key
  ENCRYPTION_KEY: z
    .string()
    .min(32, "ENCRYPTION_KEY must be at least 32 characters for AES-256")
    .max(64, "ENCRYPTION_KEY should be 32-64 characters")
    .refine(
      (key) => key.length > 0,
      "ENCRYPTION_KEY is required for encrypting 2FA secrets"
    ),

  // OpenAI API
  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY is required for AI features")
    .refine(
      (key) => key.startsWith("sk-"),
      "OPENAI_API_KEY must start with 'sk-'"
    ),

  // Email (Resend)
  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY is required for sending emails via Resend")
    .refine(
      (key) => key.startsWith("re_"),
      "RESEND_API_KEY must start with 're_'"
    ),

  // RESEND_FROM_EMAIL is optional - falls back to config.email if not set
  RESEND_FROM_EMAIL: z
    .string()
    .email("RESEND_FROM_EMAIL must be a valid email address")
    .refine(
      (email) => email !== "noreply@yourdomain.com",
      "RESEND_FROM_EMAIL cannot be the default value"
    )
    .optional(),

  // Stripe (conditional - required in production)
  STRIPE_SECRET_KEY: z
    .string()
    .trim()
    .refine(
      (key) => {
        // Allow empty string (will be handled by optional check)
        if (!key || key.trim().length === 0) {
          return true;
        }

        const trimmedKey = key.trim();
        const isProduction =
          process.env.NODE_ENV === "production" ||
          process.env.VERCEL_ENV === "production";

        if (isProduction) {
          return trimmedKey.startsWith("sk_live_");
        }
        // In development/preview, allow both test and live keys
        return (
          trimmedKey.startsWith("sk_test_") || trimmedKey.startsWith("sk_live_")
        );
      },
      (key) => {
        const isProduction =
          process.env.NODE_ENV === "production" ||
          process.env.VERCEL_ENV === "production";
        const trimmedKey = key?.trim() || "";
        const preview = trimmedKey.substring(
          0,
          Math.min(15, trimmedKey.length)
        );

        if (isProduction) {
          return {
            message: `STRIPE_SECRET_KEY must start with 'sk_live_' in production. Current value: "${preview}${trimmedKey.length > 15 ? "..." : ""}" (length: ${trimmedKey.length}). Please check your Vercel environment variables and ensure the key starts with 'sk_live_'.`,
          };
        }
        return {
          message: `STRIPE_SECRET_KEY must start with 'sk_test_' or 'sk_live_' in development. Current value: "${preview}${trimmedKey.length > 15 ? "..." : ""}" (length: ${trimmedKey.length})`,
        };
      }
    )
    .optional()
    .or(z.literal("")), // Allow empty string

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .refine(
      (secret) => secret.startsWith("whsec_"),
      "STRIPE_WEBHOOK_SECRET must start with 'whsec_'"
    )
    .optional(),

  // Stripe Price IDs (required in production)
  STRIPE_STARTER_PRICE_ID: z.string().optional(),
  STRIPE_PROFESSIONAL_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().optional(),

  // Cron Secret
  CRON_SECRET: z
    .string()
    .min(32, "CRON_SECRET must be at least 32 characters")
    .optional(),

  // Optional Services
  RECAPTCHA_SITE_KEY: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),

  // Sentry (optional but recommended)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Upstash Redis (optional but recommended)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Vercel Blob Storage (required in production)
  BLOB_READ_WRITE_TOKEN: z
    .string()
    .refine(
      (token) => {
        // In production, token is required
        const isProduction =
          process.env.NODE_ENV === "production" ||
          process.env.VERCEL_ENV === "production";
        if (isProduction) {
          return token && token.length > 0 && token.startsWith("vercel_blob_");
        }
        // In development, token is optional
        return true;
      },
      {
        message:
          "BLOB_READ_WRITE_TOKEN is required in production and must start with 'vercel_blob_'",
      }
    )
    .optional(),

  // Vercel (auto-populated)
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
});

type EnvSchema = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 *
 * @returns Validated environment variables
 * @throws Error if validation fails
 */
export function validateEnvironmentVariables(): EnvSchema {
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = !!process.env.VERCEL;

  console.log(
    `\n${colors.cyan}🔍 Validating environment variables...${colors.reset}\n`
  );

  try {
    const env = envSchema.parse(process.env);

    // Additional production-specific validations
    if (isProduction) {
      const productionErrors: string[] = [];

      // Check Stripe in production
      if (!env.STRIPE_SECRET_KEY) {
        productionErrors.push(
          "STRIPE_SECRET_KEY is required in production for payment processing"
        );
      }

      if (!env.STRIPE_WEBHOOK_SECRET) {
        productionErrors.push(
          "STRIPE_WEBHOOK_SECRET is required in production for webhook security"
        );
      }

      if (
        !env.STRIPE_STARTER_PRICE_ID ||
        !env.STRIPE_PROFESSIONAL_PRICE_ID ||
        !env.STRIPE_ENTERPRISE_PRICE_ID
      ) {
        productionErrors.push(
          "All Stripe Price IDs (STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE) are required in production"
        );
      }

      // Check Vercel Blob Storage in production
      if (!env.BLOB_READ_WRITE_TOKEN) {
        productionErrors.push(
          "BLOB_READ_WRITE_TOKEN is required in production for file storage. Create a Blob store in Vercel Dashboard → Storage and add the token to environment variables."
        );
      }

      // Check Sentry in production
      if (!env.NEXT_PUBLIC_SENTRY_DSN && !env.SENTRY_DSN) {
        console.log(
          `${colors.yellow}⚠️  Warning: Sentry DSN not configured - error tracking will not work${colors.reset}`
        );
      }

      // Check Redis in production
      if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
        console.log(
          `${colors.yellow}⚠️  Warning: Upstash Redis not configured - rate limiting may not work correctly${colors.reset}`
        );
      }

      if (productionErrors.length > 0) {
        throw new Error(
          `Production environment validation failed:\n${productionErrors
            .map((err) => `  - ${err}`)
            .join("\n")}`
        );
      }
    }

    // Success
    console.log(
      `${colors.green}✅ All required environment variables are valid!${colors.reset}\n`
    );

    // Print configuration summary
    printConfigSummary(env, isProduction, isVercel);

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        `${colors.red}❌ Environment variable validation failed:${colors.reset}\n`
      );

      error.errors.forEach((err) => {
        const path = err.path.join(".");
        console.error(
          `  ${colors.red}•${colors.reset} ${path}: ${err.message}`
        );
      });

      console.error(
        `\n${colors.yellow}💡 Tip: Check your .env file and compare with .env.example${colors.reset}\n`
      );

      process.exit(1);
    }

    throw error;
  }
}

/**
 * Print configuration summary
 */
function printConfigSummary(
  env: EnvSchema,
  isProduction: boolean,
  isVercel: boolean
): void {
  console.log(`${colors.blue}📋 Configuration Summary:${colors.reset}`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Platform: ${isVercel ? "Vercel" : "Local/Custom"}`);
  console.log(
    `  Database: ${env.DATABASE_URL.includes("localhost") ? "Local" : "Remote"}`
  );
  console.log(
    `  OpenAI: ${env.OPENAI_API_KEY ? "Configured ✓" : "Not configured ✗"}`
  );
  console.log(
    `  Stripe: ${env.STRIPE_SECRET_KEY ? "Configured ✓" : "Not configured ✗"}`
  );
  console.log(
    `  Sentry: ${env.NEXT_PUBLIC_SENTRY_DSN || env.SENTRY_DSN ? "Configured ✓" : "Not configured ✗"}`
  );
  console.log(
    `  Redis: ${env.UPSTASH_REDIS_REST_URL ? "Configured ✓" : "Not configured ✗"}`
  );
  console.log(
    `  Email: ${env.RESEND_API_KEY ? "Configured ✓" : "Not configured ✗"}`
  );
  console.log("");
}

/**
 * Get validated environment variables
 *
 * Use this instead of process.env for type-safe access to env vars
 */
export function getEnv(): EnvSchema {
  return envSchema.parse(process.env);
}

// Auto-run validation on import (only on server)
if (typeof window === "undefined") {
  // Only validate on server startup, not during build
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    validateEnvironmentVariables();
  }
}
