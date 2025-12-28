import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unlink } from "fs/promises";
import { db } from "@/lib/db";

// GET /api/files/[id] - Get a specific file
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

    // First find the file
    const file = await db.knowledgeFile.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Then verify the assistant belongs to the company
    if (file.assistantId) {
      const assistant = await db.chatbotSettings.findFirst({
        where: {
          id: file.assistantId,
          users: {
            companyId: currentUser.companyId,
          },
        },
      });

      if (!assistant) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error("Error fetching file:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}

// PUT /api/files/[id] - Update a file
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
    const { description, enabled } = body;

    // Load current user with company for scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // First find the file
    const existingFile = await db.knowledgeFile.findUnique({
      where: { id },
    });

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Then verify the assistant belongs to the company
    if (existingFile.assistantId) {
      const assistant = await db.chatbotSettings.findFirst({
        where: {
          id: existingFile.assistantId,
          users: {
            companyId: currentUser.companyId,
          },
        },
      });

      if (!assistant) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    }

    const file = await db.knowledgeFile.update({
      where: { id },
      data: {
        description:
          description !== undefined ? description : existingFile.description,
        enabled: enabled !== undefined ? enabled : existingFile.enabled,
      },
    });

    return NextResponse.json(file);
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}

// DELETE /api/files/[id] - Delete a file
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

    // First find the file
    const existingFile = await db.knowledgeFile.findUnique({
      where: { id },
    });

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Then verify the assistant belongs to the company
    if (existingFile.assistantId) {
      const assistant = await db.chatbotSettings.findFirst({
        where: {
          id: existingFile.assistantId,
          users: {
            companyId: currentUser.companyId,
          },
        },
      });

      if (!assistant) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    }

    // Delete file from filesystem
    try {
      await unlink(existingFile.filePath);
    } catch (error) {
      console.warn("Failed to delete file from filesystem:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete file from database
    await db.knowledgeFile.delete({
      where: { id },
    });

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
