import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/faqs/[id] - Get a specific FAQ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Load current user with company for scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // First find the FAQ
    const faq = await db.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    // Then verify the assistant belongs to the company
    if (faq.assistantId) {
      const assistant = await db.chatbotSettings.findFirst({
        where: {
          id: faq.assistantId,
          users: {
            companyId: currentUser.companyId,
          },
        },
      });

      if (!assistant) {
        return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
      }
    }

    return NextResponse.json(faq);
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    return NextResponse.json({ error: "Failed to fetch FAQ" }, { status: 500 });
  }
}

// PUT /api/faqs/[id] - Update a FAQ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { question, answer, enabled, order } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
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

    // First find the FAQ
    const existingFAQ = await db.fAQ.findUnique({
      where: { id },
    });

    if (!existingFAQ) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    // Then verify the assistant belongs to the company
    if (existingFAQ.assistantId) {
      const assistant = await db.chatbotSettings.findFirst({
        where: {
          id: existingFAQ.assistantId,
          users: {
            companyId: currentUser.companyId,
          },
        },
      });

      if (!assistant) {
        return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
      }
    }

    const faq = await db.fAQ.update({
      where: { id },
      data: {
        question,
        answer,
        enabled: enabled !== undefined ? enabled : existingFAQ.enabled,
        order: order !== undefined ? order : existingFAQ.order,
      },
    });

    return NextResponse.json(faq);
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return NextResponse.json(
      { error: "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

// DELETE /api/faqs/[id] - Delete a FAQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Load current user with company for scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // First find the FAQ
    const existingFAQ = await db.fAQ.findUnique({
      where: { id },
    });

    if (!existingFAQ) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    // Then verify the assistant belongs to the company
    if (existingFAQ.assistantId) {
      const assistant = await db.chatbotSettings.findFirst({
        where: {
          id: existingFAQ.assistantId,
          users: {
            companyId: currentUser.companyId,
          },
        },
      });

      if (!assistant) {
        return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
      }
    }

    await db.fAQ.delete({
      where: { id },
    });

    return NextResponse.json({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return NextResponse.json(
      { error: "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}
