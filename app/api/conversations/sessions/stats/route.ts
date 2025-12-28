import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

// GET /api/conversations/sessions/stats?assistantId=...
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

    // Verify assistant ownership
    const assistant = await prisma.chatbotSettings.findFirst({
      where: { id: assistantId, userId: session.user.id },
    });
    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    // Get conversation session statistics
    const [
      totalSessions,
      activeSessions,
      totalMessages,
      avgMessagesPerSession,
    ] = await Promise.all([
      // Total sessions
      prisma.conversationSession.count({
        where: {
          assistantId: assistantId,
        },
      }),
      // Active sessions (last 24 hours)
      prisma.conversationSession.count({
        where: {
          assistantId: assistantId,
          lastActivity: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Total messages
      prisma.conversationMessage.count({
        where: {
          session: {
            assistantId: assistantId,
          },
        },
      }),
      // Average messages per session
      prisma.conversationSession.aggregate({
        where: {
          assistantId: assistantId,
        },
        _avg: {
          messageCount: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalSessions,
      activeSessions,
      totalMessages,
      avgMessagesPerSession: Math.round(
        avgMessagesPerSession._avg.messageCount || 0
      ),
    });
  } catch (error) {
    console.error("Error fetching conversation session statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation session statistics" },
      { status: 500 }
    );
  }
}
