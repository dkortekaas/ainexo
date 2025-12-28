import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for the update of a team member
const updateMemberSchema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPERUSER"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id } = await params;
    const body = await req.json();
    const validationResult = updateMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.format(),
        }),
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check if the user exists and belongs to the same company
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    if (!currentUser?.companyId) {
      return new NextResponse(
        JSON.stringify({ error: "User not associated with a company" }),
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
        role: true,
        name: true,
        email: true,
      },
    });

    if (!targetUser) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Check if users are in the same company
    if (targetUser.companyId !== currentUser.companyId) {
      return new NextResponse(
        JSON.stringify({ error: "User not in the same company" }),
        { status: 403 }
      );
    }

    // Prevent users from changing their own role or status
    if (id === session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: "Cannot modify your own account" }),
        { status: 400 }
      );
    }

    // Only admins and superusers can modify other users
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERUSER") {
      return new NextResponse(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403 }
      );
    }

    // Update the user
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Member updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[TEAM_MEMBER_UPDATE]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id } = await params;

    // Check if the user exists and belongs to the same company
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    if (!currentUser?.companyId) {
      return new NextResponse(
        JSON.stringify({ error: "User not associated with a company" }),
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
        role: true,
        name: true,
        email: true,
      },
    });

    if (!targetUser) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Check if users are in the same company
    if (targetUser.companyId !== currentUser.companyId) {
      return new NextResponse(
        JSON.stringify({ error: "User not in the same company" }),
        { status: 403 }
      );
    }

    // Prevent users from deleting themselves
    if (id === session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: "Cannot delete your own account" }),
        { status: 400 }
      );
    }

    // Only admins and superusers can delete other users
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERUSER") {
      return new NextResponse(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403 }
      );
    }

    // Delete the user
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Member deleted successfully",
    });
  } catch (error) {
    console.error("[TEAM_MEMBER_DELETE]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
