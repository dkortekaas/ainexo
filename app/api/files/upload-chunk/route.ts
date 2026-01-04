/**
 * Chunked File Upload API Endpoint
 *
 * Handles large file uploads in chunks with progress tracking.
 * Supports pause/resume and automatic retry.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Temporary storage for chunks
const TEMP_DIR = "/tmp/uploads";

const metadataSchema = z.object({
  chunkIndex: z.number().int().min(0),
  totalChunks: z.number().int().min(1),
  uploadId: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().min(1),
  fileType: z.string(),
  checksum: z.string().min(1),
});

/**
 * POST /api/files/upload-chunk
 *
 * Handles a single chunk upload.
 * When all chunks are received, assembles the final file.
 *
 * Request: multipart/form-data
 * - chunk: File (binary data)
 * - metadata: JSON string with chunk info
 *
 * Response:
 * {
 *   "success": true,
 *   "chunkIndex": number,
 *   "totalChunks": number,
 *   "complete": boolean,
 *   "fileUrl": string (only when complete)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const chunk = formData.get("chunk") as File;
    const metadataStr = formData.get("metadata") as string;

    if (!chunk || !metadataStr) {
      return NextResponse.json(
        { success: false, error: "Missing chunk or metadata" },
        { status: 400 }
      );
    }

    // Parse and validate metadata
    const metadata = metadataSchema.parse(JSON.parse(metadataStr));

    logger.debug("[CHUNK_UPLOAD] Received chunk", {
      chunkIndex: metadata.chunkIndex,
      totalChunks: metadata.totalChunks,
      uploadId: metadata.uploadId,
      fileName: metadata.fileName,
    });

    // Create temp directory if it doesn't exist
    const uploadTempDir = join(TEMP_DIR, metadata.uploadId);
    if (!existsSync(uploadTempDir)) {
      await mkdir(uploadTempDir, { recursive: true });
    }

    // Save chunk to temp file
    const chunkPath = join(uploadTempDir, `chunk-${metadata.chunkIndex}`);
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
    await writeFile(chunkPath, chunkBuffer);

    logger.debug("[CHUNK_UPLOAD] Chunk saved", {
      chunkIndex: metadata.chunkIndex,
      path: chunkPath,
      size: chunkBuffer.length,
    });

    // Check if all chunks are received
    const receivedChunks = [];
    for (let i = 0; i < metadata.totalChunks; i++) {
      const path = join(uploadTempDir, `chunk-${i}`);
      if (existsSync(path)) {
        receivedChunks.push(i);
      }
    }

    const isComplete = receivedChunks.length === metadata.totalChunks;

    if (isComplete) {
      logger.debug("[CHUNK_UPLOAD] All chunks received, assembling file", {
        uploadId: metadata.uploadId,
        totalChunks: metadata.totalChunks,
      });

      // Assemble file from chunks
      const chunks: Buffer[] = [];
      for (let i = 0; i < metadata.totalChunks; i++) {
        const path = join(uploadTempDir, `chunk-${i}`);
        const chunkData = await readFile(path);
        chunks.push(chunkData);
      }

      const completeFile = Buffer.concat(chunks);

      // Verify file size
      if (completeFile.length !== metadata.fileSize) {
        logger.error("[CHUNK_UPLOAD] File size mismatch", {
          expected: metadata.fileSize,
          actual: completeFile.length,
        });

        return NextResponse.json(
          {
            success: false,
            error: "File size mismatch after assembly",
          },
          { status: 500 }
        );
      }

      // Verify checksum
      const actualChecksum = await crypto.subtle.digest("SHA-256", completeFile);
      const checksumArray = Array.from(new Uint8Array(actualChecksum));
      const checksumHex = checksumArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (checksumHex !== metadata.checksum) {
        logger.error("[CHUNK_UPLOAD] Checksum mismatch", {
          expected: metadata.checksum,
          actual: checksumHex,
        });

        return NextResponse.json(
          {
            success: false,
            error: "File checksum mismatch after assembly",
          },
          { status: 500 }
        );
      }

      // Upload to blob storage
      const blob = await put(metadata.fileName, completeFile, {
        access: "public",
        contentType: metadata.fileType,
      });

      // Save to database
      const document = await db.document.create({
        data: {
          name: metadata.fileName,
          type: metadata.fileType.includes("pdf") ? "PDF" : "FILE",
          url: blob.url,
          size: metadata.fileSize,
          uploadedBy: session.user.id,
          content: "", // Will be processed later
          embedding: null,
        },
      });

      // Cleanup temp files
      try {
        const fs = await import("fs/promises");
        await fs.rm(uploadTempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logger.warn("[CHUNK_UPLOAD] Failed to cleanup temp files", {
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });
      }

      logger.debug("[CHUNK_UPLOAD] Upload complete", {
        uploadId: metadata.uploadId,
        documentId: document.id,
        fileUrl: blob.url,
      });

      return NextResponse.json({
        success: true,
        complete: true,
        chunkIndex: metadata.chunkIndex,
        totalChunks: metadata.totalChunks,
        fileUrl: blob.url,
        documentId: document.id,
      });
    }

    // Not all chunks received yet
    return NextResponse.json({
      success: true,
      complete: false,
      chunkIndex: metadata.chunkIndex,
      totalChunks: metadata.totalChunks,
      receivedChunks: receivedChunks.length,
    });
  } catch (error) {
    logger.error("[CHUNK_UPLOAD] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid metadata",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
