/**
 * Unit Tests for Login Attempt Tracking
 */

import { describe, it, expect, beforeEach, afterAll, jest } from "@jest/globals";

// Mock the database and Sentry
jest.mock("@/lib/db", () => ({
  db: {
    user: {
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

// Import after mocks
import {
  recordFailedLogin,
  resetFailedLogins,
  requiresRecaptcha,
  getFailedLoginCount,
  shouldLockAccount,
  __resetLoginTrackingForTests,
} from "@/lib/login-tracking";

// Clean up after all tests
afterAll(() => {
  __resetLoginTrackingForTests();
});

describe("Login Attempt Tracking", () => {
  beforeEach(() => {
    // Reset all failed login attempts before each test
    jest.clearAllMocks();
    __resetLoginTrackingForTests();
  });

  describe("recordFailedLogin()", () => {
    it("should track first failed login attempt", async () => {
      const email = "test@example.com";
      await recordFailedLogin(email);

      const count = getFailedLoginCount(email);
      expect(count).toBe(1);
    });

    it("should increment failed login count", async () => {
      const email = "test@example.com";

      await recordFailedLogin(email);
      await recordFailedLogin(email);
      await recordFailedLogin(email);

      const count = getFailedLoginCount(email);
      expect(count).toBe(3);
    });

    it("should handle case-insensitive emails", async () => {
      await recordFailedLogin("TEST@EXAMPLE.COM");
      await recordFailedLogin("test@example.com");

      const count = getFailedLoginCount("Test@Example.Com");
      expect(count).toBe(2);
    });

    it("should track different emails separately", async () => {
      await recordFailedLogin("user1@example.com");
      await recordFailedLogin("user2@example.com");

      expect(getFailedLoginCount("user1@example.com")).toBe(1);
      expect(getFailedLoginCount("user2@example.com")).toBe(1);
    });
  });

  describe("requiresRecaptcha()", () => {
    it("should not require reCAPTCHA for 0-2 failures", async () => {
      const email = "test@example.com";

      expect(requiresRecaptcha(email)).toBe(false);

      await recordFailedLogin(email);
      expect(requiresRecaptcha(email)).toBe(false);

      await recordFailedLogin(email);
      expect(requiresRecaptcha(email)).toBe(false);
    });

    it("should require reCAPTCHA after 3 failures", async () => {
      const email = "test@example.com";

      await recordFailedLogin(email);
      await recordFailedLogin(email);
      await recordFailedLogin(email);

      expect(requiresRecaptcha(email)).toBe(true);
    });

    it("should support custom threshold", async () => {
      const email = "test@example.com";

      await recordFailedLogin(email);
      await recordFailedLogin(email);

      expect(requiresRecaptcha(email, 2)).toBe(true);
      expect(requiresRecaptcha(email, 3)).toBe(false);
    });
  });

  describe("shouldLockAccount()", () => {
    it("should not lock account for < 10 failures", async () => {
      const email = "test@example.com";

      for (let i = 0; i < 9; i++) {
        await recordFailedLogin(email);
      }

      expect(shouldLockAccount(email)).toBe(false);
    });

    it("should lock account after 10 failures", async () => {
      const email = "test@example.com";

      for (let i = 0; i < 10; i++) {
        await recordFailedLogin(email);
      }

      expect(shouldLockAccount(email)).toBe(true);
    });
  });

  describe("resetFailedLogins()", () => {
    it("should reset failed login counter", async () => {
      const email = "test@example.com";

      await recordFailedLogin(email);
      await recordFailedLogin(email);
      await recordFailedLogin(email);

      expect(getFailedLoginCount(email)).toBe(3);

      resetFailedLogins(email);

      expect(getFailedLoginCount(email)).toBe(0);
      expect(requiresRecaptcha(email)).toBe(false);
    });

    it("should handle resetting non-existent email", () => {
      expect(() => {
        resetFailedLogins("nonexistent@example.com");
      }).not.toThrow();
    });
  });

  describe("getFailedLoginCount()", () => {
    it("should return 0 for email with no failures", () => {
      expect(getFailedLoginCount("new@example.com")).toBe(0);
    });

    it("should return correct count", async () => {
      const email = "test@example.com";

      await recordFailedLogin(email);
      expect(getFailedLoginCount(email)).toBe(1);

      await recordFailedLogin(email);
      expect(getFailedLoginCount(email)).toBe(2);

      await recordFailedLogin(email);
      expect(getFailedLoginCount(email)).toBe(3);
    });
  });

  describe("Integration - Full Flow", () => {
    it("should handle complete brute force attack scenario", async () => {
      const email = "victim@example.com";

      // Attacker tries to brute force
      for (let i = 1; i <= 2; i++) {
        await recordFailedLogin(email);
        expect(requiresRecaptcha(email)).toBe(false);
        expect(shouldLockAccount(email)).toBe(false);
      }

      // After 3rd attempt, reCAPTCHA required
      await recordFailedLogin(email);
      expect(requiresRecaptcha(email)).toBe(true);
      expect(shouldLockAccount(email)).toBe(false);

      // After 10th attempt, account locked
      for (let i = 4; i <= 10; i++) {
        await recordFailedLogin(email);
      }
      expect(requiresRecaptcha(email)).toBe(true);
      expect(shouldLockAccount(email)).toBe(true);

      // After successful login, counter resets
      resetFailedLogins(email);
      expect(getFailedLoginCount(email)).toBe(0);
      expect(requiresRecaptcha(email)).toBe(false);
      expect(shouldLockAccount(email)).toBe(false);
    });
  });
});
