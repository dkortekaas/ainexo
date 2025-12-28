import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { readFile } from "fs/promises";

// GET /api/files/[id]/content - Get document content and metadata
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

    // Get the knowledge file
    const knowledgeFile = await prisma.knowledgeFile.findUnique({
      where: { id },
    });

    if (!knowledgeFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Enforce ownership
    if (
      (knowledgeFile as { userId?: string }).userId &&
      (knowledgeFile as { userId?: string }).userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get the associated document if it exists
    const document = await prisma.document.findFirst({
      where: {
        metadata: {
          path: ["fileId"],
          equals: id,
        },
      },
      include: {
        chunks: {
          orderBy: { chunkIndex: "asc" },
        },
      },
    });

    // Get document chunks count
    const chunksCount = document?.chunks?.length || 0;

    // Calculate word count from content or chunks
    let wordCount = 0;
    let contentText = "";

    if (document?.contentText) {
      contentText = document.contentText;
      wordCount = document.contentText.split(/\s+/).length;
    } else if (document?.chunks && document.chunks.length > 0) {
      contentText = document.chunks.map((chunk) => chunk.content).join("\n\n");
      wordCount = contentText.split(/\s+/).length;
    } else {
      // Try to read the original file if no document exists
      try {
        contentText = await readFile(knowledgeFile.filePath, "utf-8");
        wordCount = contentText.split(/\s+/).length;
      } catch (error) {
        console.warn("Could not read file content:", error);
        contentText = "Content niet beschikbaar";
      }
    }

    // Format file size
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Get file extension
    const fileExtension =
      knowledgeFile.originalName.split(".").pop()?.toUpperCase() || "UNKNOWN";

    const response = {
      id: knowledgeFile.id,
      title: knowledgeFile.originalName,
      type: fileExtension,
      size: formatFileSize(knowledgeFile.fileSize),
      uploadedAt: knowledgeFile.createdAt,
      status: knowledgeFile.status.toLowerCase(),
      content: contentText,
      metadata: {
        mimeType: knowledgeFile.mimeType,
        fileExtension: fileExtension,
        words: wordCount,
        chunks: chunksCount,
        description: knowledgeFile.description,
        errorMessage: knowledgeFile.errorMessage,
        documentId: document?.id,
        hasEmbeddings:
          document?.chunks?.some(
            (chunk) => (chunk as { embedding?: unknown }).embedding
          ) || false,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching file content:", error);
    return NextResponse.json(
      { error: "Failed to fetch file content" },
      { status: 500 }
    );
  }
}
