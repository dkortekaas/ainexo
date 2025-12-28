import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema voor het updaten van een gebruiker
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["SUPERUSER", "ADMIN", "USER"]).optional(),
  isActive: z.boolean().optional(),
  subscriptionStatus: z
    .enum([
      "TRIAL",
      "ACTIVE",
      "CANCELED",
      "PAST_DUE",
      "UNPAID",
      "INCOMPLETE",
      "INCOMPLETE_EXPIRED",
      "PAUSED",
    ])
    .optional(),
  subscriptionPlan: z
    .enum(["STARTER", "PROFESSIONAL", "BUSINESS", "ENTERPRISE"])
    .optional(),
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

    // Check if user is a superuser
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPERUSER") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const body = await req.json();
    const validationResult = updateUserSchema.safeParse(body);

    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({ error: validationResult.error.format() }),
        { status: 400 }
      );
    }

    const { id } = await params;
    const updateData = validationResult.data;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Prevent updating own role to non-superuser
    if (
      id === session.user.id &&
      updateData.role &&
      updateData.role !== "SUPERUSER"
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Cannot change your own role" }),
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[ADMIN_USER_UPDATE]", error);
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

    // Check if user is a superuser
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPERUSER") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const { id } = await params;

    // Prevent deleting yourself
    if (id === session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: "Cannot delete your own account" }),
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Delete user (this will cascade delete related records)
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("[ADMIN_USER_DELETE]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
