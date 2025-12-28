import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateEmbedCode } from "@/lib/assistant-utils";

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

    // Get assistant
    const assistant = await db.chatbotSettings.findUnique({
      where: { id },
      select: {
        id: true,
        apiKey: true,
        position: true,
        primaryColor: true,
        userId: true,
      },
    });

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    // Check if user owns this assistant
    if (assistant.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate embed code
    const embedCode = generateEmbedCode(assistant.apiKey, {
      position: assistant.position || undefined,
      primaryColor: assistant.primaryColor || undefined,
    });

    return NextResponse.json({
      embedCode,
      apiKey: assistant.apiKey,
    });
  } catch (error) {
    console.error("Error generating embed code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

