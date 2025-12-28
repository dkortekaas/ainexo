import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/websites/[id]/pages - Get all pages for a specific website
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
      console.error("User not found in database:", session.user.id);
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
        include: {
          users: {
            select: {
              companyId: true,
            },
          },
        },
      });

      if (!assistant) {
        return NextResponse.json(
          { error: "Unauthorized to access this website" },
          { status: 403 }
        );
      }
    }

    // Get all pages for this website
    const pages = await db.websitePage.findMany({
      where: {
        websiteId,
      },
      orderBy: {
        scrapedAt: "desc",
      },
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error("Error fetching website pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch website pages" },
      { status: 500 }
    );
  }
}
