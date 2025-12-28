import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user to find their company
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admins can view team members
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    if (!currentUser.companyId) {
      return NextResponse.json(
        { error: "User not associated with a company" },
        { status: 400 }
      );
    }

    // Get all team members from the same company
    const teamMembers = await db.user.findMany({
      where: {
        companyId: currentUser.companyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Note: We don't have lastLogin in the current schema, so we'll use updatedAt as a proxy
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Format the response to match the expected interface
    const formattedMembers = teamMembers.map((member) => {
      const initials = member.name
        ? member.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : member.email.slice(0, 2).toUpperCase();

      const registeredDate = new Date(member.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - registeredDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let registeredText;
      if (diffDays === 1) {
        registeredText = "1 dag geleden";
      } else if (diffDays < 7) {
        registeredText = `${diffDays} dagen geleden`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        registeredText =
          weeks === 1 ? "1 week geleden" : `${weeks} weken geleden`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        registeredText =
          months === 1 ? "1 maand geleden" : `${months} maanden geleden`;
      } else {
        const years = Math.floor(diffDays / 365);
        registeredText =
          years === 1 ? "1 jaar geleden" : `${years} jaar geleden`;
      }

      // For lastLogin, we'll use updatedAt as a proxy since we don't have actual login tracking
      const lastActivityDate = new Date(member.updatedAt);
      const lastActivityDiffTime = Math.abs(
        now.getTime() - lastActivityDate.getTime()
      );
      const lastActivityDiffDays = Math.ceil(
        lastActivityDiffTime / (1000 * 60 * 60 * 24)
      );

      let lastLoginText;
      if (lastActivityDiffDays === 0) {
        lastLoginText = "Vandaag";
      } else if (lastActivityDiffDays === 1) {
        lastLoginText = "Gisteren";
      } else if (lastActivityDiffDays < 7) {
        lastLoginText = `${lastActivityDiffDays} dagen geleden`;
      } else if (lastActivityDiffDays < 30) {
        const weeks = Math.floor(lastActivityDiffDays / 7);
        lastLoginText =
          weeks === 1 ? "1 week geleden" : `${weeks} weken geleden`;
      } else {
        const months = Math.floor(lastActivityDiffDays / 30);
        lastLoginText =
          months === 1 ? "1 maand geleden" : `${months} maanden geleden`;
      }

      return {
        id: member.id,
        initials,
        name: member.name || "Geen naam",
        email: member.email,
        role: member.role,
        isActive: member.isActive,
        registered: registeredText,
        lastLogin: lastLoginText,
      };
    });

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
