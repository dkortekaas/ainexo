import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

// GET /api/conversations/sessions?assistantId=...&page=1&pageSize=20
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistantId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10))
    );

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

    const skip = (page - 1) * pageSize;

    // Get conversation sessions with messages
    const [sessions, total] = await Promise.all([
      prisma.conversationSession.findMany({
        where: {
          assistantId: assistantId,
        },
        orderBy: { lastActivity: "desc" },
        skip,
        take: pageSize,
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sources: {
                include: {
                  document: {
                    select: {
                      id: true,
                      name: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.conversationSession.count({
        where: {
          assistantId: assistantId,
        },
      }),
    ]);

    return NextResponse.json({ sessions, total, page, pageSize });
  } catch (error) {
    console.error("Error fetching conversation sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation sessions" },
      { status: 500 }
    );
  }
}
