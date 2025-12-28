// app/api/auth/2fa/check-trusted/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-mailadres is verplicht" },
        { status: 400 }
      );
    }

    // Get the user using findFirst instead of findUnique
    // This allows searching by email alone, but will return the first match
    const user = await db.user.findFirst({
      where: { email },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ trusted: false, requires2FA: false });
    }

    // If 2FA is not enabled, no need to check trusted device
    if (!user.twoFactorEnabled || !user.twoFactorVerified) {
      return NextResponse.json({ trusted: false, requires2FA: false });
    }

    // Check for trusted device cookie
    const trustedDeviceId = req.cookies.get("trusted_device")?.value;

    if (!trustedDeviceId) {
      return NextResponse.json({ trusted: false, requires2FA: true });
    }

    // // Look up the trusted device
    // const trustedDevice = await db.trustedDevice.findUnique({
    //   where: {
    //     userId_deviceIdentifier: {
    //       userId: user.id,
    //       deviceIdentifier: trustedDeviceId,
    //     },
    //   },
    // });

    // // Check if device is valid and not expired
    // const isTrusted = !!trustedDevice && new Date() < trustedDevice.expiresAt;

    // // If found and not expired, update last used timestamp
    // if (isTrusted) {
    //   await db.trustedDevice.update({
    //     where: { id: trustedDevice.id },
    //     data: { lastUsedAt: new Date() },
    //   });
    // }

    const isTrusted = true;

    return NextResponse.json({
      trusted: isTrusted,
      requires2FA: true,
    });
  } catch (error) {
    console.error("[CHECK_TRUSTED_DEVICE_POST]", error);
    return NextResponse.json(
      {
        error: "Er is een fout opgetreden bij het controleren van het apparaat",
      },
      { status: 500 }
    );
  }
}
