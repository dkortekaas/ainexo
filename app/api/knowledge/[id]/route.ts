import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/knowledge/[id] - Update a knowledge base entry
export async function PATCH(
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
    const { enabled } = body;

    // Load current user with company for scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the knowledge base entry
    const existingKnowledgeBase = await db.knowledgeBase.findUnique({
      where: { id },
      include: {
        assistant: true,
      },
    });

    if (!existingKnowledgeBase) {
      return NextResponse.json(
        { error: "Knowledge base entry not found" },
        { status: 404 }
      );
    }

    // Verify the assistant belongs to the company
    const assistant = await db.chatbotSettings.findFirst({
      where: {
        id: existingKnowledgeBase.assistantId,
        users: {
          companyId: currentUser.companyId,
        },
      },
    });

    if (!assistant) {
      return NextResponse.json(
        { error: "Knowledge base entry not found" },
        { status: 404 }
      );
    }

    // Update the knowledge base entry
    const updatedKnowledgeBase = await db.knowledgeBase.update({
      where: { id },
      data: {
        enabled:
          enabled !== undefined ? enabled : existingKnowledgeBase.enabled,
      },
      include: {
        faq: true,
        website: true,
        document: true,
      },
    });

    return NextResponse.json(updatedKnowledgeBase);
  } catch (error) {
    console.error("Error updating knowledge base entry:", error);
    return NextResponse.json(
      { error: "Failed to update knowledge base entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/knowledge/[id] - Delete a knowledge base entry
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

    // Find the knowledge base entry
    const existingKnowledgeBase = await db.knowledgeBase.findUnique({
      where: { id },
      include: {
        assistant: true,
      },
    });

    if (!existingKnowledgeBase) {
      return NextResponse.json(
        { error: "Knowledge base entry not found" },
        { status: 404 }
      );
    }

    // Verify the assistant belongs to the company
    const assistant = await db.chatbotSettings.findFirst({
      where: {
        id: existingKnowledgeBase.assistantId,
        users: {
          companyId: currentUser.companyId,
        },
      },
    });

    if (!assistant) {
      return NextResponse.json(
        { error: "Knowledge base entry not found" },
        { status: 404 }
      );
    }

    // Delete the knowledge base entry (this does not delete the FAQ/Website/Document)
    await db.knowledgeBase.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Knowledge base entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting knowledge base entry:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge base entry" },
      { status: 500 }
    );
  }
}
