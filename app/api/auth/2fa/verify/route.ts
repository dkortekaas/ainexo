// app/api/auth/2fa/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  decryptSecret,
  verifyTOTP,
  generateRecoveryCodes,
  hashRecoveryCodes,
  serializeRecoveryCodes,
} from "@/lib/2fa";
import { logSecurityEvent } from "@/lib/security";
import { z } from "zod";
import { logger } from "@/lib/logger";

const verifySchema = z.object({
  token: z.string().length(6).regex(/^\d+$/),
});

type VerifySchemaType = z.infer<typeof verifySchema>;

export async function POST(req: NextRequest) {
  const session = await getAuthSession();

  try {
    if (!session?.user) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om 2FA te verifiëren" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = verifySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Ongeldige token" }, { status: 400 });
    }

    const { token } = validationResult.data;

    // Get user with 2FA secret
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorVerified: true,
        companyId: true,
      },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden of 2FA setup niet gestart" },
        { status: 404 }
      );
    }

    if (user.twoFactorEnabled && user.twoFactorVerified) {
      return NextResponse.json(
        { error: "2FA is al ingeschakeld en geverifieerd" },
        { status: 400 }
      );
    }

    // Decrypt the secret
    const secret = decryptSecret(user.twoFactorSecret, user.id);

    // Verify the token
    const isValidToken = verifyTOTP(token, secret);

    if (!isValidToken) {
      // Log failed verification attempt
      await logSecurityEvent(
        user.id,
        user.companyId || undefined,
        "2fa_verification_failed",
        req.headers.get("x-forwarded-for") || "",
        req.headers.get("user-agent") || "",
        "Invalid TOTP token provided during setup"
      );

      return NextResponse.json(
        { error: "Ongeldige verificatiecode. Probeer opnieuw." },
        { status: 400 }
      );
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes();
    const hashedCodes = hashRecoveryCodes(recoveryCodes);
    const serializedCodes = serializeRecoveryCodes(hashedCodes);

    // Enable 2FA for the user
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorVerified: true,
        twoFactorBackupCodes: serializedCodes,
      },
    });

    // Log successful 2FA setup
    await logSecurityEvent(
      user.id,
      user.companyId || undefined,
      "2fa_setup_complete",
      req.headers.get("x-forwarded-for") || "",
      req.headers.get("user-agent") || "",
      "2FA setup successfully completed"
    );

    return NextResponse.json({
      success: true,
      data: {
        recoveryCodes, // Send plain recovery codes to user for saving
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("2FA verification failed", {
      context: { errorMessage },
      userId: session?.user?.id,
      companyId: session?.user?.companyId,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });
    return NextResponse.json(
      { error: "Failed to verify 2FA code" },
      { status: 500 }
    );
  }
}
