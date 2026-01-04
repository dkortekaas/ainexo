/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup.
 * Prevents runtime errors due to missing configuration.
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  example?: string;
}

const requiredEnvVars: EnvVar[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection string',
    example: 'postgresql://user:password@host:port/database',
  },

  // NextAuth
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'Secret key for NextAuth session encryption (min 32 chars)',
    validator: (value) => value.length >= 32,
    example: 'generate-with-openssl-rand-base64-32',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'Base URL of the application',
    example: 'https://your-domain.com',
  },

  // Encryption
  {
    name: 'ENCRYPTION_KEY',
    required: true,
    description: 'AES-256 encryption key (min 32 chars)',
    validator: (value) => value.length >= 32,
    example: 'generate-with-openssl-rand-base64-32',
  },

  // OpenAI
  {
    name: 'OPENAI_API_KEY',
    required: true,
    description: 'OpenAI API key for AI features',
    example: 'sk-...',
  },

  // Email
  {
    name: 'RESEND_API_KEY',
    required: true,
    description: 'Resend API key for sending emails',
    example: 're_...',
  },
  {
    name: 'RESEND_FROM_EMAIL',
    required: true,
    description: 'Email address to send from',
    example: 'noreply@your-domain.com',
  },

  // Stripe
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe secret key for payment processing',
    example: 'sk_...',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    description: 'Stripe webhook signing secret',
    example: 'whsec_...',
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key (client-side)',
    example: 'pk_...',
  },

  // reCAPTCHA
  {
    name: 'RECAPTCHA_SECRET_KEY',
    required: true,
    description: 'Google reCAPTCHA secret key',
    example: '6L...',
  },
  {
    name: 'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
    required: true,
    description: 'Google reCAPTCHA site key (client-side)',
    example: '6L...',
  },

  // Vercel Blob (for file storage)
  {
    name: 'BLOB_READ_WRITE_TOKEN',
    required: true,
    description: 'Vercel Blob storage token',
    example: 'vercel_blob_...',
  },

  // Sanity CMS
  {
    name: 'NEXT_PUBLIC_SANITY_PROJECT_ID',
    required: true,
    description: 'Sanity project ID',
    example: 'abc123',
  },
  {
    name: 'NEXT_PUBLIC_SANITY_DATASET',
    required: true,
    description: 'Sanity dataset name',
    example: 'production',
  },
  {
    name: 'SANITY_API_TOKEN',
    required: false,
    description: 'Sanity API token (optional, for studio)',
    example: 'sk...',
  },

  // Upstash Redis (for rate limiting)
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: true,
    description: 'Upstash Redis REST API URL',
    example: 'https://...upstash.io',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: true,
    description: 'Upstash Redis REST API token',
    example: 'A...',
  },

  // Cron Jobs
  {
    name: 'CRON_SECRET',
    required: true,
    description: 'Secret for authenticating cron job requests',
    example: 'generate-random-secret',
  },

  // Optional: Analytics
  {
    name: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    required: false,
    description: 'Google Analytics measurement ID',
    example: 'G-...',
  },

  // Optional: Sentry
  {
    name: 'SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error tracking',
    example: 'https://...@sentry.io/...',
  },

  // Optional: Admin Email
  {
    name: 'ADMIN_EMAIL',
    required: false,
    description: 'Admin email for notifications',
    example: 'admin@your-domain.com',
  },
];

/**
 * Validation Results
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
}

/**
 * Validate all required environment variables
 */
export const validateEnvironment = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];

    // Check if required variable is missing
    if (envVar.required && !value) {
      missing.push(envVar.name);
      errors.push(
        `❌ Missing required environment variable: ${envVar.name}\n   Description: ${envVar.description}${envVar.example ? `\n   Example: ${envVar.example}` : ''}`
      );
      continue;
    }

    // Skip validation if optional and not set
    if (!envVar.required && !value) {
      warnings.push(
        `⚠️  Optional environment variable not set: ${envVar.name}\n   Description: ${envVar.description}`
      );
      continue;
    }

    // Run custom validator if provided
    if (value && envVar.validator && !envVar.validator(value)) {
      errors.push(
        `❌ Invalid value for ${envVar.name}\n   Description: ${envVar.description}${envVar.example ? `\n   Example: ${envVar.example}` : ''}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missing,
  };
};

/**
 * Check if running in production
 */
export const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = () => process.env.NODE_ENV === 'development';

/**
 * Pretty print validation results
 */
export const printValidationResults = (results: ValidationResult) => {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ENVIRONMENT VARIABLE VALIDATION');
  console.log('='.repeat(80));

  if (results.valid) {
    console.log('\n✅ All required environment variables are set and valid!\n');
  } else {
    console.log('\n❌ Environment validation failed!\n');
    console.log('Missing variables:', results.missing.length);
    console.log('Total errors:', results.errors.length);
    console.log('');
  }

  // Print errors
  if (results.errors.length > 0) {
    console.log('ERRORS:');
    console.log('-'.repeat(80));
    results.errors.forEach((error) => console.log(error + '\n'));
  }

  // Print warnings
  if (results.warnings.length > 0) {
    console.log('WARNINGS:');
    console.log('-'.repeat(80));
    results.warnings.forEach((warning) => console.log(warning + '\n'));
  }

  console.log('='.repeat(80) + '\n');
};

/**
 * Validate and exit on error (for startup scripts)
 */
export const validateOrExit = () => {
  const results = validateEnvironment();
  printValidationResults(results);

  if (!results.valid) {
    console.error(
      '💥 Application cannot start with missing environment variables.'
    );
    console.error('Please check your .env file or environment configuration.\n');
    process.exit(1);
  }
};

/**
 * Get environment variable with fallback
 */
export const getEnvVar = (name: string, fallback?: string): string => {
  const value = process.env[name];
  if (!value && !fallback) {
    throw new Error(`Environment variable ${name} is not set and has no fallback`);
  }
  return value || fallback!;
};

/**
 * Get required environment variable (throws if not set)
 */
export const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Required environment variable ${name} is not set. Application cannot continue.`
    );
  }
  return value;
};

// Export for use in other files
export default {
  validate: validateEnvironment,
  validateOrExit,
  printResults: printValidationResults,
  isProduction,
  isDevelopment,
  getEnvVar,
  getRequiredEnvVar,
};
