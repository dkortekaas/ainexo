import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/webhooks/stats
 * Get overall webhook statistics and health metrics
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

    // Get time range from query params (default: last 24 hours)
    const { searchParams } = new URL(request.url);
    const hoursParam = searchParams.get("hours");
    const hours = hoursParam ? parseInt(hoursParam) : 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Webhook configuration stats
    const totalConfigs = await db.webhookConfig.count();
    const activeConfigs = await db.webhookConfig.count({
      where: { isActive: true },
    });

    // Delivery stats (all time)
    const deliveryStatusStats = await db.webhookDelivery.groupBy({
      by: ["status"],
      _count: true,
    });

    const totalDeliveries = deliveryStatusStats.reduce(
      (sum, stat) => sum + stat._count,
      0
    );
    const successfulDeliveries =
      deliveryStatusStats.find((s) => s.status === "SUCCESS")?._count || 0;
    const failedDeliveries =
      deliveryStatusStats.find((s) => s.status === "FAILED")?._count || 0;
    const pendingDeliveries =
      deliveryStatusStats.find((s) => s.status === "PENDING")?._count || 0;
    const retryingDeliveries =
      deliveryStatusStats.find((s) => s.status === "RETRYING")?._count || 0;

    // Recent deliveries (within time range)
    const recentDeliveries = await db.webhookDelivery.count({
      where: {
        createdAt: { gte: since },
      },
    });

    const recentSuccessful = await db.webhookDelivery.count({
      where: {
        status: "SUCCESS",
        createdAt: { gte: since },
      },
    });

    const recentFailed = await db.webhookDelivery.count({
      where: {
        status: "FAILED",
        createdAt: { gte: since },
      },
    });

    // Event log stats
    const totalEvents = await db.webhookEventLog.count();
    const triggeredEvents = await db.webhookEventLog.count({
      where: { triggered: true },
    });

    const recentEvents = await db.webhookEventLog.count({
      where: {
        createdAt: { gte: since },
      },
    });

    // Top event types (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const topEventTypes = await db.webhookEventLog.groupBy({
      by: ["eventType"],
      where: {
        createdAt: { gte: weekAgo },
      },
      _count: true,
      orderBy: {
        _count: {
          eventType: "desc",
        },
      },
      take: 10,
    });

    // Webhook configs with most deliveries
    const topWebhooks = await db.webhookConfig.findMany({
      take: 5,
      orderBy: {
        deliveries: {
          _count: "desc",
        },
      },
      select: {
        id: true,
        url: true,
        description: true,
        isActive: true,
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    // Failed deliveries needing attention
    const failedDeliveriesNeedingRetry = await db.webhookDelivery.count({
      where: {
        status: "FAILED",
        attempts: { lt: 3 },
        createdAt: { gte: weekAgo },
      },
    });

    // Calculate success rate
    const successRate =
      totalDeliveries > 0
        ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(2)
        : "0.00";

    const recentSuccessRate =
      recentDeliveries > 0
        ? ((recentSuccessful / recentDeliveries) * 100).toFixed(2)
        : "0.00";

    // Health status
    let healthStatus = "healthy";
    if (recentSuccessRate < "80") {
      healthStatus = "critical";
    } else if (recentSuccessRate < "95") {
      healthStatus = "warning";
    }

    return NextResponse.json({
      success: true,
      timeRange: {
        hours,
        since: since.toISOString(),
      },
      health: {
        status: healthStatus,
        recentSuccessRate: parseFloat(recentSuccessRate),
        failedDeliveriesNeedingRetry,
      },
      configurations: {
        total: totalConfigs,
        active: activeConfigs,
        inactive: totalConfigs - activeConfigs,
      },
      deliveries: {
        total: totalDeliveries,
        successful: successfulDeliveries,
        failed: failedDeliveries,
        pending: pendingDeliveries,
        retrying: retryingDeliveries,
        successRate: parseFloat(successRate),
        recent: {
          total: recentDeliveries,
          successful: recentSuccessful,
          failed: recentFailed,
          successRate: parseFloat(recentSuccessRate),
        },
      },
      events: {
        total: totalEvents,
        triggered: triggeredEvents,
        notTriggered: totalEvents - triggeredEvents,
        recent: recentEvents,
        topTypes: topEventTypes.map((t) => ({
          eventType: t.eventType,
          count: t._count,
        })),
      },
      topWebhooks: topWebhooks.map((w) => ({
        id: w.id,
        url: w.url,
        description: w.description,
        isActive: w.isActive,
        deliveryCount: w._count.deliveries,
      })),
    });
  } catch (error) {
    logger.error("Failed to fetch webhook stats", {
      context: { error: error instanceof Error ? error.message : String(error) },
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch webhook stats" },
      { status: 500 }
    );
  }
}
