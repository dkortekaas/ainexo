import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import {
  readFileFromStorage,
  fileExists,
  getFileUrl,
} from "@/lib/blob-storage";

// GET /api/files/[id]/download - Download a file
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
    const file = await prisma.knowledgeFile.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Enforce ownership
    if (
      (file as { userId?: string }).userId &&
      (file as { userId?: string }).userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if file exists in storage (Blob Storage in production, local /tmp in development)
    const exists = await fileExists(file.filePath);

    if (!exists) {
      // Fallback: Try to get content from database
      const document = await prisma.document.findFirst({
        where: {
          metadata: {
            path: ["fileId"],
            equals: id,
          },
        },
      });

      if (document?.contentText) {
        // Convert text content back to buffer
        // Note: This only works for text-based files (TXT, CSV, JSON)
        // For binary files (PDF, DOCX), the original file is required
        const fileBuffer = Buffer.from(document.contentText, "utf-8");
        console.warn(
          `File ${file.filePath} not found in storage, using database content as fallback for ${file.originalName}`
        );

        return new NextResponse(new Uint8Array(fileBuffer), {
          headers: {
            "Content-Type": file.mimeType,
            "Content-Disposition": `attachment; filename="${file.originalName}"`,
            "Content-Length": fileBuffer.length.toString(),
          },
        });
      } else {
        return NextResponse.json(
          {
            error:
              "File not found in storage and no database content available",
            message:
              "The file was processed but the original file is no longer available.",
          },
          { status: 404 }
        );
      }
    }

    // Read file from storage (Blob Storage or local filesystem)
    const fileBuffer = await readFileFromStorage(file.filePath);

    // Return file with appropriate headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.originalName}"`,
        "Content-Length": file.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
