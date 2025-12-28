import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/webhooks/[id]/deliveries
 * Get delivery history for a webhook
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params to get the actual values
    const { id } = await params;

    // Verify webhook exists
    const webhook = await db.webhookConfig.findUnique({
      where: { id },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const status = searchParams.get("status"); // Filter by status
    const eventType = searchParams.get("eventType"); // Filter by event type

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      webhookConfigId: id,
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    if (eventType) {
      where.eventType = eventType;
    }

    // Fetch deliveries with pagination
    const [deliveries, total] = await Promise.all([
      db.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          eventType: true,
          status: true,
          attempts: true,
          lastAttemptAt: true,
          nextRetryAt: true,
          responseStatus: true,
          error: true,
          createdAt: true,
          updatedAt: true,
          // Exclude large payload and responseBody from list view
        },
      }),
      db.webhookDelivery.count({ where }),
    ]);

    // Calculate statistics
    const stats = await db.webhookDelivery.groupBy({
      by: ["status"],
      where: { webhookConfigId: id },
      _count: true,
    });

    const statistics = {
      total,
      pending: stats.find((s) => s.status === "PENDING")?._count || 0,
      success: stats.find((s) => s.status === "SUCCESS")?._count || 0,
      failed: stats.find((s) => s.status === "FAILED")?._count || 0,
      retrying: stats.find((s) => s.status === "RETRYING")?._count || 0,
    };

    return NextResponse.json({
      success: true,
      deliveries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics,
    });
  } catch (error) {
    logger.error("Failed to fetch webhook deliveries", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch deliveries" },
      { status: 500 }
    );
  }
}
