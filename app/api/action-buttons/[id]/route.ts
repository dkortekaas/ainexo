import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const actionButton = await db.actionButton.findFirst({
      where: {
        id,
        assistant: {
          userId: session.user.id,
        },
      },
    });

    if (!actionButton) {
      return NextResponse.json(
        { error: "Action button not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(actionButton);
  } catch (error) {
    console.error("Error fetching action button:", error);
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { buttonText, question, priority, enabled } = body;

    const { id } = await params;

    // Verify the action button belongs to the user
    const existingButton = await db.actionButton.findFirst({
      where: {
        id,
        assistant: {
          userId: session.user.id,
        },
      },
    });

    if (!existingButton) {
      return NextResponse.json(
        { error: "Action button not found" },
        { status: 404 }
      );
    }

    const actionButton = await db.actionButton.update({
      where: { id },
      data: {
        ...(buttonText !== undefined && { buttonText }),
        ...(question !== undefined && { question }),
        ...(priority !== undefined && { priority }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    return NextResponse.json(actionButton);
  } catch (error) {
    console.error("Error updating action button:", error);
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the action button belongs to the user
    const existingButton = await db.actionButton.findFirst({
      where: {
        id,
        assistant: {
          userId: session.user.id,
        },
      },
    });

    if (!existingButton) {
      return NextResponse.json(
        { error: "Action button not found" },
        { status: 404 }
      );
    }

    await db.actionButton.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Action button deleted successfully" });
  } catch (error) {
    console.error("Error deleting action button:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
