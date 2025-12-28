import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load current user for company scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    // Check if assistant exists and belongs to same company
    const existingAssistant = await db.chatbotSettings.findFirst({
      where: {
        id,
        users: { companyId: currentUser.companyId },
      },
    });

    if (!existingAssistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    // Only ADMINs can toggle
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Toggle isActive status
    const updatedAssistant = await db.chatbotSettings.update({
      where: { id },
      data: {
        isActive: !existingAssistant.isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedAssistant.id,
      isActive: updatedAssistant.isActive,
      message: updatedAssistant.isActive
        ? "Assistant activated successfully"
        : "Assistant deactivated successfully",
    });
  } catch (error) {
    console.error("Error toggling assistant status:", error);
    return NextResponse.json(
      { error: "Failed to toggle assistant status" },
      { status: 500 }
    );
  }
}

