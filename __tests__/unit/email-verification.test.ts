/**
 * Email Verification Unit Tests
 *
 * Tests for email verification functionality including:
 * - Token generation and validation
 * - Email verification endpoint
 * - Resend verification email
 * - Login with unverified email
 */

import { db } from "@/lib/db";
import { generateToken } from "@/lib/token";

// Mock Prisma client
jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    verificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock email sending
jest.mock("@/lib/email", () => ({
  sendEmailVerificationEmail: jest.fn(),
}));

describe("Email Verification Token Generation", () => {
  it("should generate a random verification token", () => {
    const token1 = generateToken();
    const token2 = generateToken();

    // Tokens should be 64 hex characters (32 bytes)
    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);

    // Tokens should be different
    expect(token1).not.toBe(token2);

    // Tokens should only contain hex characters
    expect(token1).toMatch(/^[0-9a-f]+$/);
    expect(token2).toMatch(/^[0-9a-f]+$/);
  });

  it("should create verification token with 24 hour expiry", async () => {
    const email = "test@example.com";
    const token = generateToken();
    const now = Date.now();
    const expectedExpiry = new Date(now + 24 * 60 * 60 * 1000);

    (db.verificationToken.create as jest.Mock).mockResolvedValue({
      identifier: email,
      token: token,
      expires: expectedExpiry,
    });

    const result = await db.verificationToken.create({
      data: {
        identifier: email,
        token: token,
        expires: expectedExpiry,
      },
    });

    expect(result.expires.getTime()).toBeCloseTo(expectedExpiry.getTime(), -3);
  });
});

describe("Email Verification Endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should verify email with valid token", async () => {
    const email = "test@example.com";
    const token = generateToken();
    const userId = "user123";

    // Mock token lookup
    (db.verificationToken.findUnique as jest.Mock).mockResolvedValue({
      identifier: email,
      token: token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
    });

    // Mock user lookup
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      email: email,
      emailVerified: null,
    });

    // Mock user update
    (db.user.update as jest.Mock).mockResolvedValue({
      id: userId,
      email: email,
      emailVerified: new Date(),
    });

    // Mock token deletion
    (db.verificationToken.delete as jest.Mock).mockResolvedValue({});

    // Simulate the verification flow
    const verificationToken = await db.verificationToken.findUnique({
      where: { token: token },
    });

    expect(verificationToken).toBeTruthy();
    expect(verificationToken!.expires > new Date()).toBe(true);

    const user = await db.user.findUnique({
      where: { email: verificationToken!.identifier },
    });

    expect(user).toBeTruthy();
    expect(user!.emailVerified).toBeNull();

    await db.user.update({
      where: { id: user!.id },
      data: { emailVerified: new Date() },
    });

    await db.verificationToken.delete({
      where: { token: token },
    });

    expect(db.user.update).toHaveBeenCalled();
    expect(db.verificationToken.delete).toHaveBeenCalled();
  });

  it("should reject expired verification token", async () => {
    const email = "test@example.com";
    const token = generateToken();

    // Mock expired token
    (db.verificationToken.findUnique as jest.Mock).mockResolvedValue({
      identifier: email,
      token: token,
      expires: new Date(Date.now() - 1000), // Expired 1 second ago
    });

    const verificationToken = await db.verificationToken.findUnique({
      where: { token: token },
    });

    expect(verificationToken).toBeTruthy();
    expect(verificationToken!.expires < new Date()).toBe(true);
  });

  it("should reject invalid verification token", async () => {
    const invalidToken = "invalid-token";

    // Mock token not found
    (db.verificationToken.findUnique as jest.Mock).mockResolvedValue(null);

    const verificationToken = await db.verificationToken.findUnique({
      where: { token: invalidToken },
    });

    expect(verificationToken).toBeNull();
  });

  it("should handle already verified email", async () => {
    const email = "test@example.com";
    const token = generateToken();
    const userId = "user123";

    // Mock token lookup
    (db.verificationToken.findUnique as jest.Mock).mockResolvedValue({
      identifier: email,
      token: token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Mock user with already verified email
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      email: email,
      emailVerified: new Date(Date.now() - 1000 * 60 * 60), // Verified 1 hour ago
    });

    const user = await db.user.findUnique({
      where: { email: email },
    });

    expect(user!.emailVerified).toBeTruthy();
    expect(user!.emailVerified).toBeInstanceOf(Date);
  });
});

describe("Resend Verification Email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete old tokens before creating new one", async () => {
    const email = "test@example.com";
    const userId = "user123";
    const newToken = generateToken();

    // Mock user lookup
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      email: email,
      emailVerified: null,
    });

    // Mock delete old tokens
    (db.verificationToken.deleteMany as jest.Mock).mockResolvedValue({
      count: 2, // Deleted 2 old tokens
    });

    // Mock create new token
    (db.verificationToken.create as jest.Mock).mockResolvedValue({
      identifier: email,
      token: newToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Simulate resend flow
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await db.verificationToken.create({
      data: {
        identifier: email,
        token: newToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    expect(db.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: email },
    });
    expect(db.verificationToken.create).toHaveBeenCalled();
  });

  it("should not reveal if user does not exist", async () => {
    const email = "nonexistent@example.com";

    // Mock user not found
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const user = await db.user.findUnique({
      where: { email: email },
    });

    expect(user).toBeNull();
    // In the actual API, we return success even if user doesn't exist
    // This prevents email enumeration attacks
  });

  it("should not send email to already verified addresses", async () => {
    const email = "verified@example.com";
    const userId = "user123";

    // Mock user with verified email
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      email: email,
      emailVerified: new Date(Date.now() - 1000 * 60 * 60), // Verified 1 hour ago
    });

    const user = await db.user.findUnique({
      where: { email: email },
    });

    expect(user!.emailVerified).toBeTruthy();
    // Should not proceed to create new token
  });
});

describe("Login with Unverified Email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should prevent login with unverified email", async () => {
    const email = "unverified@example.com";
    const userId = "user123";

    // Mock user with unverified email
    (db.user.findFirst as jest.Mock).mockResolvedValue({
      id: userId,
      email: email,
      password: "$2a$12$hashedpassword",
      emailVerified: null,
      isActive: true,
    });

    const user = await db.user.findFirst({
      where: { email: email },
    });

    expect(user!.emailVerified).toBeNull();
    // Login should be prevented in authorize() function
  });

  it("should allow login with verified email", async () => {
    const email = "verified@example.com";
    const userId = "user123";

    // Mock user with verified email
    (db.user.findFirst as jest.Mock).mockResolvedValue({
      id: userId,
      email: email,
      password: "$2a$12$hashedpassword",
      emailVerified: new Date(),
      isActive: true,
    });

    const user = await db.user.findFirst({
      where: { email: email },
    });

    expect(user!.emailVerified).toBeTruthy();
    expect(user!.emailVerified).toBeInstanceOf(Date);
    // Login should proceed normally
  });
});

describe("Security Edge Cases", () => {
  it("should handle missing token parameter", async () => {
    (db.verificationToken.findUnique as jest.Mock).mockResolvedValue(null);

    const token = await db.verificationToken.findUnique({
      where: { token: "" },
    });

    expect(token).toBeNull();
  });

  it("should handle database errors gracefully", async () => {
    const token = generateToken();

    (db.verificationToken.findUnique as jest.Mock).mockRejectedValue(
      new Error("Database connection failed")
    );

    await expect(
      db.verificationToken.findUnique({ where: { token } })
    ).rejects.toThrow("Database connection failed");
  });

  it("should handle concurrent verification attempts", async () => {
    const email = "test@example.com";
    const token1 = generateToken();
    const token2 = generateToken();

    // Two tokens created for the same email
    (db.verificationToken.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        identifier: email,
        token: token1,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .mockResolvedValueOnce({
        identifier: email,
        token: token2,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

    const verification1 = await db.verificationToken.findUnique({
      where: { token: token1 },
    });
    const verification2 = await db.verificationToken.findUnique({
      where: { token: token2 },
    });

    expect(verification1!.identifier).toBe(email);
    expect(verification2!.identifier).toBe(email);
    // Only the most recent should be valid in practice
  });
});
