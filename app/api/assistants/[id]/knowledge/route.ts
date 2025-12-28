import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/assistants/[id]/knowledge - Create a new knowledge base entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: assistantId } = await params;
    const body = await request.json();
    const { type, faqId, websiteId, documentId, enabled = true } = body;

    // Validate type
    if (!type || !["FAQ", "WEBSITE", "DOCUMENT"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be FAQ, WEBSITE, or DOCUMENT" },
        { status: 400 }
      );
    }

    // Validate that at least one reference ID is provided based on type
    if (type === "FAQ" && !faqId) {
      return NextResponse.json(
        { error: "FAQ ID is required for FAQ type" },
        { status: 400 }
      );
    }
    if (type === "WEBSITE" && !websiteId) {
      return NextResponse.json(
        { error: "Website ID is required for WEBSITE type" },
        { status: 400 }
      );
    }
    if (type === "DOCUMENT" && !documentId) {
      return NextResponse.json(
        { error: "Document ID is required for DOCUMENT type" },
        { status: 400 }
      );
    }

    // Load current user with company for scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the assistant belongs to the company
    const assistant = await db.chatbotSettings.findFirst({
      where: {
        id: assistantId,
        users: {
          companyId: currentUser.companyId,
        },
      },
    });

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    // Verify the referenced resource exists and belongs to the same company
    if (type === "FAQ" && faqId) {
      const faq = await db.fAQ.findFirst({
        where: {
          id: faqId,
          assistantId,
        },
      });

      if (!faq) {
        return NextResponse.json(
          { error: "FAQ not found or does not belong to this assistant" },
          { status: 404 }
        );
      }
    }

    if (type === "WEBSITE" && websiteId) {
      const website = await db.website.findFirst({
        where: {
          id: websiteId,
          assistantId,
        },
      });

      if (!website) {
        return NextResponse.json(
          { error: "Website not found or does not belong to this assistant" },
          { status: 404 }
        );
      }
    }

    if (type === "DOCUMENT" && documentId) {
      // Documents might not have assistantId, so we check if it exists
      const document = await db.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
    }

    // Check if knowledge base entry already exists for this resource
    const existingEntry = await db.knowledgeBase.findFirst({
      where: {
        assistantId,
        ...(type === "FAQ" && { faqId }),
        ...(type === "WEBSITE" && { websiteId }),
        ...(type === "DOCUMENT" && { documentId }),
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Knowledge base entry already exists for this resource" },
        { status: 409 }
      );
    }

    // Create the knowledge base entry
    const knowledgeBase = await db.knowledgeBase.create({
      data: {
        assistantId,
        type,
        faqId: type === "FAQ" ? faqId : null,
        websiteId: type === "WEBSITE" ? websiteId : null,
        documentId: type === "DOCUMENT" ? documentId : null,
        enabled,
      },
      include: {
        faq: true,
        website: true,
        document: true,
      },
    });

    return NextResponse.json(knowledgeBase, { status: 201 });
  } catch (error) {
    console.error("Error creating knowledge base entry:", error);
    return NextResponse.json(
      { error: "Failed to create knowledge base entry" },
      { status: 500 }
    );
  }
}

// GET /api/assistants/[id]/knowledge - Get all knowledge base entries for an assistant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: assistantId } = await params;

    // Load current user with company for scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the assistant belongs to the company
    const assistant = await db.chatbotSettings.findFirst({
      where: {
        id: assistantId,
        users: {
          companyId: currentUser.companyId,
        },
      },
    });

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    // Get all knowledge base entries for this assistant
    const knowledgeBases = await db.knowledgeBase.findMany({
      where: {
        assistantId,
      },
      include: {
        faq: true,
        website: true,
        document: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(knowledgeBases);
  } catch (error) {
    console.error("Error fetching knowledge base entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge base entries" },
      { status: 500 }
    );
  }
}
