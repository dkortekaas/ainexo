import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notification = await db.notification.findFirst({
      where: {
        id,
        isActive: true,
        AND: [
          {
            OR: [
              { targetUsers: { has: session.user.id } },
              { targetUsers: { isEmpty: true } },
            ],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        ],
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      isRead,
      title,
      message,
      type,
      priority,
      targetUsers,
      expiresAt,
      isActive,
    } = body;

    // Check if user is superuser for admin operations
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isSuperuser = user?.role === UserRole.SUPERUSER;

    // Find the notification
    const existingNotification = await db.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // If not superuser, only allow marking as read
    if (!isSuperuser) {
      if (isRead === undefined) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const notification = await db.notification.update({
        where: { id },
        data: { isRead },
      });

      return NextResponse.json(notification);
    }

    // Superuser can update all fields
    const updateData: {
      isRead?: boolean;
      title?: string;
      message?: string;
      type?: string;
      priority?: string;
      targetUsers?: string[];
      expiresAt?: Date | null;
      isActive?: boolean;
    } = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (targetUsers !== undefined) updateData.targetUsers = targetUsers;
    if (expiresAt !== undefined)
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const notification = await (
      db.notification as unknown as {
        update: (args: unknown) => Promise<unknown>;
      }
    ).update({
      where: { id },
      data: updateData,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is superuser
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.SUPERUSER) {
      return NextResponse.json(
        { error: "Forbidden - Superuser access required" },
        { status: 403 }
      );
    }

    const existingNotification = await db.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    await db.notification.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
