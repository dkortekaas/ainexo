/**
 * Unit Tests for reCAPTCHA Verification
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock fetch
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch as unknown as typeof fetch;

// Import after mocks
import { verifyRecaptchaToken, isRecaptchaEnabled } from "@/lib/recaptcha";

describe("reCAPTCHA Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.RECAPTCHA_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  });

  describe("verifyRecaptchaToken()", () => {
    it("should verify valid reCAPTCHA token", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";

      const mockResponse = {
        success: true,
        score: 0.9,
        action: "register",
        challenge_ts: "2025-11-05T12:00:00Z",
        hostname: "localhost",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await verifyRecaptchaToken("valid-token", "register", 0.5);

      expect(result.success).toBe(true);
      expect(result.score).toBe(0.9);
      expect(result.error).toBeUndefined();
    });

    it("should reject token with low score", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";

      const mockResponse = {
        success: true,
        score: 0.3, // Below threshold
        action: "register",
        challenge_ts: "2025-11-05T12:00:00Z",
        hostname: "localhost",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await verifyRecaptchaToken(
        "low-score-token",
        "register",
        0.5
      );

      expect(result.success).toBe(false);
      expect(result.score).toBe(0.3);
      expect(result.error).toContain("score too low");
    });

    it("should reject token with wrong action", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";

      const mockResponse = {
        success: true,
        score: 0.9,
        action: "login", // Wrong action
        challenge_ts: "2025-11-05T12:00:00Z",
        hostname: "localhost",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await verifyRecaptchaToken("token", "register", 0.5);

      expect(result.success).toBe(false);
      expect(result.error).toContain("action mismatch");
    });

    it("should handle missing token", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";

      const result = await verifyRecaptchaToken(null, "register", 0.5);

      expect(result.success).toBe(false);
      expect(result.error).toContain("token is required");
    });

    it("should handle Google API errors", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";

      const mockResponse = {
        success: false,
        "error-codes": ["invalid-input-secret", "timeout-or-duplicate"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await verifyRecaptchaToken("token", "register", 0.5);

      expect(result.success).toBe(false);
      expect(result.error).toContain("verification failed");
    });

    it("should handle network errors", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await verifyRecaptchaToken("token", "register", 0.5);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should allow all requests in development without config", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      // @ts-expect-error - NODE_ENV is read-only in types but can be modified at runtime in tests
      process.env.NODE_ENV = "development";
      // No RECAPTCHA_SECRET_KEY set

      const result = await verifyRecaptchaToken("any-token", "register", 0.5);

      expect(result.success).toBe(true);
      expect(result.score).toBe(1.0);

      // Restore original NODE_ENV
      if (originalNodeEnv) {
        // @ts-expect-error - NODE_ENV is read-only in types but can be modified at runtime in tests
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        // @ts-expect-error - NODE_ENV is read-only in types but can be modified at runtime in tests
        delete process.env.NODE_ENV;
      }
    });

    it("should fail closed in production without config", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      // @ts-expect-error - NODE_ENV is read-only in types but can be modified at runtime in tests
      process.env.NODE_ENV = "production";
      // No RECAPTCHA_SECRET_KEY set

      const result = await verifyRecaptchaToken("any-token", "register", 0.5);

      expect(result.success).toBe(false);
      expect(result.error).toContain("not configured");

      // Restore original NODE_ENV
      if (originalNodeEnv) {
        // @ts-expect-error - NODE_ENV is read-only in types but can be modified at runtime in tests
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        // @ts-expect-error - NODE_ENV is read-only in types but can be modified at runtime in tests
        delete process.env.NODE_ENV;
      }
    });

    it("should support custom score thresholds", async () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";

      const mockResponse = {
        success: true,
        score: 0.6,
        action: "login",
        challenge_ts: "2025-11-05T12:00:00Z",
        hostname: "localhost",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Should pass with threshold 0.5
      const result1 = await verifyRecaptchaToken("token", "login", 0.5);
      expect(result1.success).toBe(true);

      // Should fail with threshold 0.7
      const result2 = await verifyRecaptchaToken("token", "login", 0.7);
      expect(result2.success).toBe(false);
    });
  });

  describe("isRecaptchaEnabled()", () => {
    it("should return false when not configured", () => {
      expect(isRecaptchaEnabled()).toBe(false);
    });

    it("should return false when only secret key is set", () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret";
      expect(isRecaptchaEnabled()).toBe(false);
    });

    it("should return false when only site key is set", () => {
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      expect(isRecaptchaEnabled()).toBe(false);
    });

    it("should return true when both keys are set", () => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret";
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
      expect(isRecaptchaEnabled()).toBe(true);
    });
  });

  describe("Integration - Different Actions", () => {
    beforeEach(() => {
      process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";
    });

    it("should handle register action", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.9,
          action: "register",
          challenge_ts: "2025-11-05T12:00:00Z",
          hostname: "localhost",
        }),
      } as Response);

      const result = await verifyRecaptchaToken("token", "register");
      expect(result.success).toBe(true);
    });

    it("should handle login action", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.8,
          action: "login",
          challenge_ts: "2025-11-05T12:00:00Z",
          hostname: "localhost",
        }),
      } as Response);

      const result = await verifyRecaptchaToken("token", "login");
      expect(result.success).toBe(true);
    });

    it("should handle forgot_password action", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.7,
          action: "forgot_password",
          challenge_ts: "2025-11-05T12:00:00Z",
          hostname: "localhost",
        }),
      } as Response);

      const result = await verifyRecaptchaToken("token", "forgot_password");
      expect(result.success).toBe(true);
    });
  });
});
