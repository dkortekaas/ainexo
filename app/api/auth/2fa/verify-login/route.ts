// app/api/auth/2fa/verify-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  decryptSecret,
  verifyTOTP,
  parseRecoveryCodes,
  verifyRecoveryCode,
  serializeRecoveryCodes,
  generateDeviceId,
} from "@/lib/2fa";
import { z } from "zod";
import { logSecurityEvent, checkRateLimit, sanitizeIp } from "@/lib/security";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import crypto from "crypto";

interface ExtendedToken {
  id: string;
  email: string;
  name: string;
  role: string;
  requires2FA: boolean;
  twoFactorAuthenticated: boolean;
  needsVerification: boolean;
}

const verifyLoginSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  companyId: z.string().min(1), // Added companyId requirement
  trustDevice: z.boolean().optional(),
  isRecoveryCode: z.boolean().optional(),
  isEmailRecovery: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const t = await getTranslations();
  try {
    const body = await req.json();
    const validationResult = verifyLoginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
    }

    const {
      token,
      email,
      companyId, // Extract companyId from validated data
      trustDevice = false,
      isRecoveryCode = false,
      isEmailRecovery = false,
    } = validationResult.data;

    // Get the user using compound unique constraint
    const user = await db.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
        twoFactorEnabled: true,
        twoFactorVerified: true,
        companyId: true,
        resetToken: true,
        resetTokenExpiry: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: t("error.userNotFoundOr2FANotEnabled") },
        { status: 404 }
      );
    }

    // Check rate limit for failed attempts
    const ipAddress = sanitizeIp(req.headers.get("x-forwarded-for") || null);
    const isRateLimited = await checkRateLimit(
      user.id,
      "2fa_login_failed",
      15, // 15 minutes window
      5 // Max 5 attempts
    );

    if (isRateLimited) {
      await logSecurityEvent(
        user.id,
        user.companyId || undefined,
        "2fa_rate_limited",
        ipAddress,
        req.headers.get("user-agent") || "",
        t("error.rateLimit")
      );

      return NextResponse.json(
        { error: t("error.rateLimit") },
        { status: 429 }
      );
    }

    let isValid = false;
    let isUsingRecoveryCode = false;
    let isUsingEmailRecovery = false;
    let needsReset2FA = false;
    let remainingCodes: string[] = [];

    // Check if using email recovery code
    if (isEmailRecovery) {
      if (!user.resetToken || !user.resetTokenExpiry) {
        return NextResponse.json(
          { error: "Geen geldige herstelcode gevonden. Vraag een nieuwe aan." },
          { status: 400 }
        );
      }

      // Check if recovery code is expired
      if (user.resetTokenExpiry < new Date()) {
        return NextResponse.json(
          { error: "Herstelcode is verlopen. Vraag een nieuwe aan." },
          { status: 400 }
        );
      }

      // Hash the provided token and compare
      const hashedProvidedToken = crypto
        .createHash("sha256")
        .update(token.toUpperCase())
        .digest("hex");

      isValid = hashedProvidedToken === user.resetToken;
      isUsingEmailRecovery = true;
      needsReset2FA = true; // Force user to reset 2FA after email recovery
    } else if (isRecoveryCode) {
      // Check if using backup recovery code
      if (!user.twoFactorBackupCodes) {
        return NextResponse.json(
          { error: t("error.noRecoveryCodesAvailable") },
          { status: 400 }
        );
      }

      // Verify recovery code
      const hashedCodes = parseRecoveryCodes(user.twoFactorBackupCodes);
      const result = verifyRecoveryCode(token, hashedCodes);

      isValid = result.valid;
      remainingCodes = result.remainingCodes;
      isUsingRecoveryCode = true;
    } else {
      // Verify TOTP code
      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: t("error.2FANotConfigured") },
          { status: 400 }
        );
      }

      const secret = decryptSecret(user.twoFactorSecret, user.id);
      isValid = verifyTOTP(token, secret);
    }

    // Handle failed verification
    if (!isValid) {
      await logSecurityEvent(
        user.id,
        user.companyId || undefined,
        "2fa_login_failed",
        ipAddress,
        req.headers.get("user-agent") || "",
        isUsingRecoveryCode
          ? t("error.invalidRecoveryCode")
          : t("error.invalidTOTPCode")
      );

      return NextResponse.json(
        { error: t("error.invalidVerificationCode") },
        { status: 400 }
      );
    }

    // Handle successful verification
    const updateData: Record<string, unknown> = {
      twoFactorVerified: true,
    };

    // If email recovery was used, reset 2FA completely and clear recovery token
    if (isUsingEmailRecovery) {
      updateData.twoFactorEnabled = false;
      updateData.twoFactorSecret = null;
      updateData.twoFactorBackupCodes = null;
      updateData.twoFactorVerified = false;
      updateData.resetToken = null;
      updateData.resetTokenExpiry = null;
    }

    // If recovery code was used, update the remaining codes
    if (
      isUsingRecoveryCode &&
      remainingCodes.length !==
        parseRecoveryCodes(user.twoFactorBackupCodes).length
    ) {
      updateData.twoFactorBackupCodes = serializeRecoveryCodes(remainingCodes);
    }

    // Update user
    await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // If device should be trusted, create trusted device record
    if (trustDevice) {
      const deviceId = generateDeviceId();
      const userAgent = req.headers.get("user-agent") || "";

      // Create expiry date (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Get device name from user agent
      let deviceName = "Unknown Device";
      if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
        deviceName = userAgent.includes("iPad") ? "iPad" : "iPhone";
      } else if (userAgent.includes("Android")) {
        deviceName = "Android Device";
      } else if (userAgent.includes("Windows")) {
        deviceName = "Windows PC";
      } else if (userAgent.includes("Mac")) {
        deviceName = "Mac";
      } else if (userAgent.includes("Linux")) {
        deviceName = "Linux PC";
      }

      // Create trusted device
      // await db.trustedDevice.create({
      //   data: {
      //     userId: user.id,
      //     deviceIdentifier: deviceId,
      //     deviceName,
      //     ipAddress,
      //     userAgent,
      //     expiresAt: expiryDate,
      //   },
      // });

      // Set cookie with device ID
      const response = NextResponse.json({
        success: true,
        twoFactorAuthenticated: true,
      });

      response.cookies.set("trusted_device", deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expiryDate,
        path: "/",
      });

      return response;
    }

    // Log successful 2FA verification
    await logSecurityEvent(
      user.id,
      user.companyId || undefined,
      "2fa_login_success",
      ipAddress,
      req.headers.get("user-agent") || "",
      isUsingRecoveryCode
        ? t("success.authenticatedWithRecoveryCode")
        : t("success.authenticatedWithTOTP")
    );

    // Update the session token
    const sessionToken = (await getToken({ req })) as unknown as ExtendedToken;
    if (sessionToken) {
      sessionToken.requires2FA = false;
      sessionToken.twoFactorAuthenticated = true;
      sessionToken.needsVerification = false;
    }

    return NextResponse.json({
      success: true,
      twoFactorAuthenticated: true,
      needsReset2FA: isUsingEmailRecovery,
      message: isUsingEmailRecovery
        ? "Ingelogd met email herstelcode. Je moet 2FA opnieuw instellen voor je account veiligheid."
        : undefined,
    });
  } catch (error) {
    console.error("[2FA_VERIFY_LOGIN_POST]", error);
    return NextResponse.json(
      { error: t("error.2FAVerificationError") },
      { status: 500 }
    );
  }
}
