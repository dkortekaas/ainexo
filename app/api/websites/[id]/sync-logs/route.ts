import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getPaginationParams,
  getPrismaOptions,
  createPaginatedResponse,
} from "@/lib/pagination";

// GET /api/websites/[id]/sync-logs - Get all sync logs for a website
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: websiteId } = await params;

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

    // Parse pagination parameters
    const pagination = getPaginationParams(request);

    const where = { websiteId };

    // Get total count for pagination metadata
    const total = await db.websiteSyncLog.count({ where });

    const syncLogs = await db.websiteSyncLog.findMany({
      where,
      orderBy: { startedAt: "desc" },
      ...getPrismaOptions(pagination),
    });

    // Return paginated response
    return NextResponse.json(
      createPaginatedResponse(syncLogs, pagination.page, pagination.limit, total)
    );
  } catch (error) {
    console.error("Error fetching sync logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync logs" },
      { status: 500 }
    );
  }
}
