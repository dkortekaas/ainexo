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
        sources: {
          files: 0,
          websites: 0,
          faqs: 0,
        },
        total: 0,
        period: days,
      });
    }

    // Get all KnowledgeFiles for user's assistants to create a lookup
    const userKnowledgeFiles = await db.knowledgeFile.findMany({
      where: {
        assistantId: {
          in: assistantIds,
        },
      },
      select: {
        id: true,
      },
    });

    const userFileIds = new Set(userKnowledgeFiles.map((file) => file.id));

    // Get all user's websites
    const userWebsites = await db.website.findMany({
      where: {
        assistantId: {
          in: assistantIds,
        },
      },
      select: {
        id: true,
      },
    });

    const userWebsiteIds = new Set(userWebsites.map((website) => website.id));

    // Get all user's FAQs
    const userFaqs = await db.fAQ.findMany({
      where: {
        assistantId: {
          in: assistantIds,
        },
      },
      select: {
        id: true,
      },
    });

    const userFaqIds = new Set(userFaqs.map((faq) => faq.id));

    // OPTIMIZATION: Limit conversations to prevent memory exhaustion
    // In production environments with millions of conversations, this prevents
    // fetching the entire database. Consider using date-based archiving for older data.
    const MAX_CONVERSATIONS = 10000;

    // Get conversations in the date range (with limit to prevent memory exhaustion)
    const conversations = await db.conversation.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        sources: {
          include: {
            document: {
              select: {
                id: true,
                type: true,
                metadata: true,
              },
            },
          },
        },
      },
      take: MAX_CONVERSATIONS,
      orderBy: {
        createdAt: "desc", // Get most recent conversations first
      },
    });

    // Filter conversations to only include those from user's knowledge sources
    const filteredConversations = conversations.filter((conv) => {
      return conv.sources.some((source) => {
        const metadata = source.document.metadata as any;
        const fileId = metadata?.fileId;
        const websiteId = metadata?.websiteId;
        const faqId = metadata?.faqId;

        return (
          (fileId && userFileIds.has(fileId)) ||
          (websiteId && userWebsiteIds.has(websiteId)) ||
          (faqId && userFaqIds.has(faqId))
        );
      });
    });

    // Count sources by type
    const sourceCounts = {
      files: 0,
      websites: 0,
      faqs: 0,
    };

    filteredConversations.forEach((conv) => {
      conv.sources.forEach((source) => {
        const metadata = source.document.metadata as any;
        const fileId = metadata?.fileId;
        const websiteId = metadata?.websiteId;
        const faqId = metadata?.faqId;

        if (fileId && userFileIds.has(fileId)) {
          sourceCounts.files++;
        } else if (websiteId && userWebsiteIds.has(websiteId)) {
          sourceCounts.websites++;
        } else if (faqId && userFaqIds.has(faqId)) {
          sourceCounts.faqs++;
        }
      });
    });

    const total =
      sourceCounts.files + sourceCounts.websites + sourceCounts.faqs;

    return NextResponse.json({
      sources: sourceCounts,
      total,
      period: days,
    });
  } catch (error) {
    console.error("Error fetching knowledge source statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge source statistics" },
      { status: 500 }
    );
  }
}
