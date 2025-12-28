import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days, 7, 30, or 90
    const days = parseInt(period);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // First, get all active assistants for the user
    const userAssistants = await db.chatbotSettings.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const assistantIds = userAssistants.map((assistant) => assistant.id);

    if (assistantIds.length === 0) {
      // No assistants, return empty data
      return NextResponse.json({
        chartData: [],
        total: 0,
        trend: 0,
        period: days,
        previousTotal: 0,
      });
    }

    // OPTIMIZATION: Limit conversation sessions to prevent memory exhaustion
    // In production environments with millions of conversations, this prevents
    // fetching the entire database. Consider using date-based archiving for older data.
    const MAX_SESSIONS = 10000;

    // Get all conversation sessions in the date range filtered by user's assistants
    const conversationSessions = await db.conversationSession.findMany({
      where: {
        assistantId: {
          in: assistantIds,
        },
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        startedAt: "asc",
      },
      take: MAX_SESSIONS,
    });

    const finalConversations = conversationSessions;

    // Group conversations by date
    const dailyCounts: { [key: string]: number } = {};

    // Initialize all dates in range with 0
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = d.toISOString().split("T")[0];
      dailyCounts[dateKey] = 0;
    }

    // Count conversation sessions per day
    finalConversations.forEach((session) => {
      const dateKey = session.startedAt.toISOString().split("T")[0];
      if (dailyCounts[dateKey] !== undefined) {
        dailyCounts[dateKey]++;
      }
    });

    // Convert to array format for chart
    const chartData = Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }));

    // Calculate totals and trends
    const totalConversations = finalConversations.length;
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    // Get previous period conversation sessions with same filtering
    const previousConversations = await db.conversationSession.count({
      where: {
        assistantId: {
          in: assistantIds,
        },
        startedAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    });

    const trend =
      previousConversations > 0
        ? ((totalConversations - previousConversations) /
            previousConversations) *
          100
        : totalConversations > 0
          ? 100
          : 0;

    return NextResponse.json({
      chartData,
      total: totalConversations,
      trend,
      period: days,
      previousTotal: previousConversations,
    });
  } catch (error) {
    console.error("Error fetching conversation statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation statistics" },
      { status: 500 }
    );
  }
}
