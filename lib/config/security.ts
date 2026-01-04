/**
 * Security Configuration Constants
 *
 * Centralized security settings for the application.
 * Changes here affect security posture across the entire system.
 */

export const SecurityConfig = {
  /**
   * Password Security
   */
  password: {
    // Bcrypt cost factor (higher = more secure but slower)
    // Standard: 12 (good balance of security and performance)
    bcryptCostFactor: 12,

    // Minimum password requirements
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,

    // Password validation regex patterns
    patterns: {
      uppercase: /[A-Z]/,
      lowercase: /[a-z]/,
      numbers: /[0-9]/,
      specialChars: /[^A-Za-z0-9]/,
    },
  },

  /**
   * Session Configuration
   */
  session: {
    // Session duration: 7 days
    maxAge: 7 * 24 * 60 * 60, // in seconds
    // Update session every 24 hours (sliding window)
    updateAge: 24 * 60 * 60, // in seconds
  },

  /**
   * Rate Limiting
   */
  rateLimit: {
    // Registration: 5 attempts per hour per IP
    registration: {
      maxAttempts: 5,
      windowSeconds: 3600, // 1 hour
    },

    // Login: 5 attempts per 15 minutes per IP
    login: {
      maxAttempts: 5,
      windowSeconds: 900, // 15 minutes
    },

    // Password reset: 3 attempts per hour per IP
    passwordReset: {
      maxAttempts: 3,
      windowSeconds: 3600, // 1 hour
    },

    // API chat: 60 requests per minute per API key
    chat: {
      maxAttempts: 60,
      windowSeconds: 60, // 1 minute
    },
  },

  /**
   * File Upload Security
   */
  fileUpload: {
    // Avatar upload
    avatar: {
      maxSize: 2 * 1024 * 1024, // 2 MB
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const,
      allowedMimeTypes: {
        jpg: ['image/jpeg'],
        jpeg: ['image/jpeg'],
        png: ['image/png'],
        webp: ['image/webp'],
        gif: ['image/gif'],
      } as const,
    },

    // Document upload
    document: {
      maxSize: 10 * 1024 * 1024, // 10 MB
      allowedExtensions: ['pdf', 'docx', 'txt'] as const,
      allowedMimeTypes: {
        pdf: ['application/pdf'],
        docx: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        txt: ['text/plain'],
      } as const,
    },
  },

  /**
   * CORS Configuration
   */
  cors: {
    // Public widget endpoint allows wildcard for embedding
    publicWidget: {
      allowWildcard: true,
      allowedMethods: ['GET', 'OPTIONS'] as const,
      allowedHeaders: ['Content-Type', 'X-Chatbot-API-Key'] as const,
    },

    // Standard API endpoints
    api: {
      allowWildcard: false,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Chatbot-API-Key',
      ] as const,
    },
  },

  /**
   * Token Configuration
   */
  token: {
    // Email verification token expiry
    emailVerification: {
      expiryHours: 24,
    },

    // Password reset token expiry
    passwordReset: {
      expiryHours: 1,
    },

    // API key format
    apiKey: {
      prefix: 'cbk_',
      environment: {
        live: 'live',
        test: 'test',
      },
      length: 64, // Total length including prefix
    },
  },

  /**
   * Two-Factor Authentication (2FA)
   */
  twoFactor: {
    // TOTP settings
    totpWindow: 1, // Allow 1 step before/after current time
    totpStep: 30, // 30 seconds per step

    // Trusted device duration
    trustedDeviceDays: 30,
  },

  /**
   * Security Headers
   */
  headers: {
    // Content Security Policy
    csp: {
      enabled: true,
      directives: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
      ],
    },

    // Additional security headers
    hsts: {
      enabled: true,
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
  },

  /**
   * Account Security
   */
  account: {
    // Maximum failed login attempts before account lock
    maxFailedLogins: 5,
    // Account lock duration in minutes
    lockDurationMinutes: 15,
    // Grace period for expired subscriptions (days)
    subscriptionGracePeriodDays: 7,
  },
} as const;

/**
 * Helper function to get bcrypt cost factor
 * Use this instead of hardcoding values
 */
export const getBcryptCostFactor = () => SecurityConfig.password.bcryptCostFactor;

/**
 * Helper function to validate password strength
 */
export const validatePasswordStrength = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const { minLength, patterns } = SecurityConfig.password;

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (!patterns.uppercase.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!patterns.lowercase.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!patterns.numbers.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!patterns.specialChars.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Helper function to validate file upload
 */
export const validateFileUpload = (
  file: File,
  type: 'avatar' | 'document'
): { valid: boolean; error?: string } => {
  const config = SecurityConfig.fileUpload[type];

  // Check file size
  if (file.size > config.maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${config.maxSize / 1024 / 1024}MB`,
    };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !config.allowedExtensions.includes(extension as any)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${config.allowedExtensions.join(', ')}`,
    };
  }

  // Check MIME type
  const allowedMimes = config.allowedMimeTypes[extension as keyof typeof config.allowedMimeTypes];
  if (!allowedMimes || !allowedMimes.includes(file.type as any)) {
    return {
      valid: false,
      error: 'File type does not match extension',
    };
  }

  return { valid: true };
};

export default SecurityConfig;
