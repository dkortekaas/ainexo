// app/api/users/[id]/reset-2fa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { logSecurityEvent } from "@/lib/security";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om 2FA te resetten" },
        { status: 401 }
      );
    }

    // Get the user ID from the URL params
    const { id } = await context.params;
    const targetUserId = id;

    // Check if the logged-in user is an admin
    const adminUser = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        role: true,
        companyId: true,
      },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Je hebt geen rechten om 2FA te resetten voor andere gebruikers",
        },
        { status: 403 }
      );
    }

    // Get the target user to reset 2FA for
    const targetUser = await db.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
        twoFactorEnabled: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Check if admin and target user are in the same company
    if (adminUser.companyId !== targetUser.companyId) {
      return NextResponse.json(
        {
          error:
            "Je kunt alleen 2FA resetten voor gebruikers in je eigen bedrijf",
        },
        { status: 403 }
      );
    }

    // Reset 2FA settings for the target user
    await db.user.update({
      where: {
        id: targetUserId,
      },
      data: {
        twoFactorEnabled: false,
        twoFactorVerified: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    // Delete all trusted devices for the user
    // await db.trustedDevice.deleteMany({
    //   where: {
    //     userId: targetUserId,
    //   },
    // });

    // Log the 2FA reset action
    await logSecurityEvent(
      session.user.id, // Admin who performed the action
      adminUser.companyId || undefined,
      "admin_reset_2fa",
      req.headers.get("x-forwarded-for") || "",
      req.headers.get("user-agent") || "",
      `Admin reset 2FA for user: ${targetUser.email || targetUser.id}`
    );

    // Create a notification for the target user
    await db.notification.create({
      data: {
        targetUsers: [targetUserId],
        title: "2FA-instellingen gereset",
        createdBy: session.user.id,
        message:
          "Je 2FA-instellingen zijn gereset door een beheerder. Je moet 2FA opnieuw instellen.",
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "2FA-instellingen succesvol gereset",
    });
  } catch (error) {
    console.error("[USER_RESET_2FA_POST]", error);
    return NextResponse.json(
      { error: "Er is een interne serverfout opgetreden" },
      { status: 500 }
    );
  }
}
