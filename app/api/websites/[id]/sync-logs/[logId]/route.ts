import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getPaginationParams,
  getPrismaOptions,
  createPaginatedResponse,
} from "@/lib/pagination";

// GET /api/websites/[id]/sync-logs/[logId] - Get a specific sync log with entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: websiteId, logId } = await params;

    // Load current user with company for scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // First find the website
    const website = await db.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Then verify the assistant belongs to the company
    if (website.assistantId) {
      const assistant = await db.chatbotSettings.findFirst({
        where: {
          id: website.assistantId,
          users: {
            companyId: currentUser.companyId,
          },
        },
      });

      if (!assistant) {
        return NextResponse.json(
          { error: "Website not found" },
          { status: 404 }
        );
      }
    }

    // Get the sync log
    const syncLog = await db.websiteSyncLog.findFirst({
      where: {
        id: logId,
        websiteId,
      },
    });

    if (!syncLog) {
      return NextResponse.json({ error: "Sync log not found" }, { status: 404 });
    }

    // Parse pagination parameters for entries
    const pagination = getPaginationParams(request);

    const where = { syncLogId: logId };

    // Get total count for pagination metadata
    const total = await db.websiteSyncLogEntry.count({ where });

    const entries = await db.websiteSyncLogEntry.findMany({
      where,
      orderBy: { scrapedAt: "desc" },
      ...getPrismaOptions(pagination),
    });

    // Return sync log with paginated entries
    return NextResponse.json({
      syncLog,
      entries: createPaginatedResponse(
        entries,
        pagination.page,
        pagination.limit,
        total
      ),
    });
  } catch (error) {
    console.error("Error fetching sync log details:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync log details" },
      { status: 500 }
    );
  }
}
