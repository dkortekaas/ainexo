// app/api/auth/2fa/disable/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { logSecurityEvent } from "@/lib/security";
import { z } from "zod";
import { compare } from "bcryptjs";
import { getTranslations } from "next-intl/server";

const disableSchema = z.object({
  password: z.string().min(1, { message: "Wachtwoord is verplicht" }),
});

export async function POST(req: NextRequest) {
  const t = await getTranslations();
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: t("error.notLoggedIn") },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = disableSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: t("error.invalidInput") },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        twoFactorEnabled: true,
        companyId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: t("error.userNotFound") },
        { status: 404 }
      );
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: t("error.2faNotEnabled") },
        { status: 400 }
      );
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        { error: t("error.passwordVerificationFailed") },
        { status: 400 }
      );
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      await logSecurityEvent(
        user.id,
        user.companyId || undefined,
        "2fa_disable_failed",
        req.headers.get("x-forwarded-for") || "",
        req.headers.get("user-agent") || "",
        t("error.invalidPassword")
      );

      return NextResponse.json(
        { error: t("error.invalidPassword") },
        { status: 400 }
      );
    }

    // Disable 2FA
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorVerified: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    // Log 2FA disable
    await logSecurityEvent(
      user.id,
      user.companyId || undefined,
      "2fa_disabled",
      req.headers.get("x-forwarded-for") || "",
      req.headers.get("user-agent") || "",
      t("success.twoFactorDisabled")
    );

    return NextResponse.json({
      success: true,
      message: t("success.twoFactorDisabled"),
    });
  } catch (error) {
    console.error("[2FA_DISABLE_POST]", error);
    return NextResponse.json(
      { error: t("error.generic") },
      { status: 500 }
    );
  }
}
