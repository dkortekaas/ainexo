import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { resetFailedLogins } from "@/lib/login-tracking";
import { logSecurityEvent, sanitizeIp } from "@/lib/security";

/**
 * Unlock a locked user account (ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an ADMIN or SUPERUSER
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true, companyId: true },
    });

    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERUSER")) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find the user to unlock
    const userToUnlock = await db.user.findFirst({
      where: { email },
      select: { id: true, email: true, isActive: true, companyId: true },
    });

    if (!userToUnlock) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Unlock the account
    await db.user.update({
      where: { id: userToUnlock.id },
      data: {
        isActive: true,
      },
    });

    // Reset failed login attempts
    resetFailedLogins(email);

    // Log the unlock action
    const ipAddress = sanitizeIp(
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    );
    await logSecurityEvent(
      userToUnlock.id,
      userToUnlock.companyId || undefined,
      "account_unlocked",
      ipAddress,
      request.headers.get("user-agent") || "",
      `Account unlocked by admin: ${currentUser.email}`
    );

    console.log(`🔓 Account unlocked for ${email} by admin ${currentUser.email}`);

    return NextResponse.json({
      success: true,
      message: `Account for ${email} has been unlocked`,
    });
  } catch (error) {
    console.error("Error unlocking account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
