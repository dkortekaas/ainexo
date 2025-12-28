import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistantId");

    if (!assistantId) {
      return NextResponse.json(
        { error: "Assistant ID is required" },
        { status: 400 }
      );
    }

    // Verify the assistant belongs to the user
    const assistant = await db.chatbotSettings.findFirst({
      where: {
        id: assistantId,
        userId: session.user.id,
      },
    });

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    const actionButtons = await db.actionButton.findMany({
      where: {
        assistantId,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(actionButtons);
  } catch (error) {
    console.error("Error fetching action buttons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      assistantId,
      buttonText,
      question,
      priority = 50,
      enabled = true,
    } = body;

    if (!assistantId || !buttonText || !question) {
      return NextResponse.json(
        {
          error: "Assistant ID, button text, and question are required",
        },
        { status: 400 }
      );
    }

    // Verify the assistant belongs to the user
    const assistant = await db.chatbotSettings.findFirst({
      where: {
        id: assistantId,
        userId: session.user.id,
      },
    });

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    const actionButton = await db.actionButton.create({
      data: {
        assistantId,
        buttonText,
        question,
        priority,
        enabled,
      },
    });

    return NextResponse.json(actionButton, { status: 201 });
  } catch (error) {
    console.error("Error creating action button:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
