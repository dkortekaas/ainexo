import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { estimateTokens } from "@/lib/openai";
import { generateBatchEmbeddings } from "@/lib/embedding-service-optimized";
import { logger } from "@/lib/logger";

// POST /api/files/[id]/reindex - Re-generate embeddings for a file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    logger.debug(`🔄 Re-indexing file: ${id}`);

    // Load current user with company for scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the file
    const file = await db.knowledgeFile.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify the assistant belongs to the company
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

    // Find the associated document
    const document = await db.document.findFirst({
      where: {
        name: file.originalName,
        type: file.mimeType as any,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found in database" },
        { status: 404 }
      );
    }

    // Get all chunks for this document
    const chunks = await db.documentChunk.findMany({
      where: { documentId: document.id },
      orderBy: { chunkIndex: "asc" },
    });

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No chunks found for this document" },
        { status: 404 }
      );
    }

    logger.debug(`📦 Found ${chunks.length} chunks to re-index`);

    // Generate new embeddings
    try {
      const chunkTexts = chunks.map((chunk) => chunk.content);
      logger.debug(
        `🔄 Generating embeddings for ${chunkTexts.length} chunks...`
      );

      const embeddings = await generateBatchEmbeddings(chunkTexts);

      logger.debug(`✅ Generated ${embeddings.length} embeddings`);

      // Update each chunk with new embedding
      let updated = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        await db.$executeRaw`
          UPDATE document_chunks 
          SET embedding = ${`[${embedding.join(",")}]`}::vector
          WHERE id = ${chunk.id}
        `;

        updated++;

        if (updated % 10 === 0) {
          logger.debug(`📊 Updated ${updated}/${chunks.length} chunks`);
        }
      }

      logger.debug(
        `✅ Successfully re-indexed ${updated} chunks for file: ${file.originalName}`
      );

      // Update file status
      await db.knowledgeFile.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully re-indexed ${updated} chunks`,
        chunksUpdated: updated,
      });
    } catch (error) {
      logger.error("Error generating embeddings:", error);
      return NextResponse.json(
        {
          error: "Failed to generate embeddings",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error re-indexing file:", error);
    return NextResponse.json(
      {
        error: "Failed to re-index file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
