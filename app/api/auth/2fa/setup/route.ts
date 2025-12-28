// app/api/auth/2fa/setup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateTOTPSecret, encryptSecret, generateQRCode } from "@/lib/2fa";
import { logSecurityEvent } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om 2FA in te stellen" },
        { status: 401 }
      );
    }

    // Check if 2FA is already enabled
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorVerified: true,
        companyId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    if (user.twoFactorEnabled && user.twoFactorVerified) {
      return NextResponse.json(
        { error: "2FA is al ingeschakeld voor deze gebruiker" },
        { status: 400 }
      );
    }

    // Generate a new TOTP secret
    const secret = generateTOTPSecret();

    // Generate QR code for the authenticator app
    const qrCode = await generateQRCode(
      secret,
      user.email || "gebruiker@declaratieportal.nl"
    );

    // Encrypt the secret for database storage
    const encryptedSecret = encryptSecret(secret, user.id);

    // Update user with the new secret but don't enable 2FA yet until verification
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorMethod: "authenticator",
        twoFactorSecret: encryptedSecret,
        twoFactorVerified: false,
      },
    });

    // Log the 2FA setup initiation
    await logSecurityEvent(
      user.id,
      user.companyId || undefined,
      "2fa_setup_initiated",
      req.headers.get("x-forwarded-for") || "",
      req.headers.get("user-agent") || "",
      "TOTP setup initiated"
    );

    return NextResponse.json({
      success: true,
      data: {
        qrCode,
        secret, // Sending plain secret for manual entry
      },
    });
  } catch (error) {
    console.error("[2FA_SETUP_POST]", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het instellen van 2FA" },
      { status: 500 }
    );
  }
}
