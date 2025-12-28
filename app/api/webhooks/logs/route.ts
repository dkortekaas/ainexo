import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/webhooks/logs
 * Get webhook event logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && user.role !== "SUPERUSER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const eventType = searchParams.get("eventType");
    const userId = searchParams.get("userId");
    const triggered = searchParams.get("triggered");
    const webhookConfigId = searchParams.get("webhookConfigId");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (eventType) {
      where.eventType = eventType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (triggered !== null && triggered !== undefined) {
      where.triggered = triggered === "true";
    }

    if (webhookConfigId) {
      where.webhookConfigId = webhookConfigId;
    }

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      db.webhookEventLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          webhookConfig: {
            select: {
              id: true,
              url: true,
              description: true,
            },
          },
        },
      }),
      db.webhookEventLog.count({ where }),
    ]);

    // Calculate statistics
    const eventTypeStats = await db.webhookEventLog.groupBy({
      by: ["eventType"],
      _count: true,
      orderBy: {
        _count: {
          eventType: "desc",
        },
      },
      take: 10, // Top 10 event types
    });

    const triggeredStats = await db.webhookEventLog.groupBy({
      by: ["triggered"],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: {
        total,
        triggered: triggeredStats.find((s) => s.triggered)?._count || 0,
        notTriggered: triggeredStats.find((s) => !s.triggered)?._count || 0,
        eventTypes: eventTypeStats.map((s) => ({
          eventType: s.eventType,
          count: s._count,
        })),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch webhook logs", {
      context: { error: error instanceof Error ? error.message : String(error) },
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch webhook logs" },
      { status: 500 }
    );
  }
}
