import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { WebsiteScraper } from "@/lib/WebsiteScraper";
import { chunkWebsiteContent } from "@/lib/chunking-optimized";
import {
  generateEmbeddings,
  estimateTokens,
  EMBEDDINGS_ENABLED,
} from "@/lib/openai";
import {
  getPaginationParams,
  getPrismaOptions,
  createPaginatedResponse,
} from "@/lib/pagination";
import { validateScrapingUrl } from "@/lib/url-validator";

// GET /api/websites - Get all websites for a specific assistant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistantId");

    if (!assistantId) {
      return NextResponse.json(
        { error: "Assistant ID is required" },
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

    // Parse pagination parameters
    const pagination = getPaginationParams(request);

    const where = {
      assistantId: assistantId,
    };

    // Get total count for pagination metadata
    const total = await db.website.count({ where });

    const websites = await db.website.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...getPrismaOptions(pagination),
    });

    // Return paginated response
    return NextResponse.json(
      createPaginatedResponse(
        websites,
        pagination.page,
        pagination.limit,
        total
      )
    );
  } catch (error) {
    console.error("Error fetching websites:", error);
    return NextResponse.json(
      { error: "Failed to fetch websites" },
      { status: 500 }
    );
  }
}

// POST /api/websites - Create a new website
export async function POST(request: NextRequest) {
  let session;
  let assistantId: string | undefined;
  let url: string | undefined;

  try {
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    url = body.url;
    assistantId = body.assistantId;
    const { name, description, syncInterval } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!assistantId) {
      return NextResponse.json(
        { error: "Assistant ID is required" },
        { status: 400 }
      );
    }

    // Validate URL format and check for SSRF
    const urlValidation = validateScrapingUrl(url);
    if (!urlValidation.valid) {
      console.warn(
        `🚫 Invalid/unsafe URL rejected: ${url} - ${urlValidation.error}`
      );
      return NextResponse.json(
        { error: urlValidation.error || "Invalid URL" },
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

    // Normalize URL for comparison (remove trailing slash, convert to lowercase)
    const normalizedUrl = url.toLowerCase().replace(/\/$/, "");

    // Check if website already exists for this assistant
    const existingWebsite = await db.website.findFirst({
      where: {
        assistantId: assistantId,
        url: {
          equals: normalizedUrl,
          mode: "insensitive",
        },
      },
    });

    if (existingWebsite) {
      return NextResponse.json(
        {
          error:
            "This website URL has already been added to this assistant. Please choose a different URL or edit the existing one.",
          code: "DUPLICATE_URL",
        },
        { status: 409 }
      );
    }

    const website = await db.website.create({
      data: {
        assistantId: assistantId,
        url: normalizedUrl,
        name: name || null,
        description: description || null,
        syncInterval: syncInterval || "never",
        status: "PENDING",
      },
    });

    // Start scraping automatically in the background
    // Use .catch() to prevent errors from crashing the request
    scrapeWebsiteInBackground(website.id, website.url).catch((error) => {
      console.error("Background scraping error (non-blocking):", error);
      // Update website status to ERROR if scraping fails immediately
      db.website
        .update({
          where: { id: website.id },
          data: {
            status: "ERROR",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Failed to start scraping",
          },
        })
        .catch((updateError) => {
          console.error("Failed to update website status:", updateError);
        });
    });

    return NextResponse.json(website, { status: 201 });
  } catch (error: unknown) {
    // Prisma unique constraint -> duplicate URL
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "Deze website URL is al toegevoegd. Kies een andere URL of bewerk de bestaande.",
          code: "DUPLICATE_URL",
        },
        { status: 409 }
      );
    }

    // Enhanced error logging for production debugging
    console.error("Error creating website:", {
      error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
      assistantId: assistantId || "unknown",
      url: url || "unknown",
      userId: session?.user?.id || "unknown",
    });

    return NextResponse.json(
      {
        error: "Failed to create website",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Background scraping function
async function scrapeWebsiteInBackground(websiteId: string, url: string) {
  const startTime = Date.now();
  let syncLog: { id: string } | null = null;

  try {
    // Create sync log record
    syncLog = await db.websiteSyncLog.create({
      data: {
        websiteId,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    // Update status to SYNCING
    await db.website.update({
      where: { id: websiteId },
      data: {
        status: "SYNCING",
        lastSync: new Date(),
      },
    });

    // Get website to retrieve maxDepth and maxUrls
    const websiteData = await db.website.findUnique({
      where: { id: websiteId },
      select: { maxDepth: true, maxUrls: true },
    });

    // Clear existing pages
    await db.websitePage.deleteMany({
      where: { websiteId },
    });

    const maxUrls = websiteData?.maxUrls || 50;
    const maxDepth = websiteData?.maxDepth || 3;
    const scraper = new WebsiteScraper(maxUrls, maxDepth);
    const scrapedData = await scraper.scrapeWebsite(url);

    // Combine all content from all pages
    const combinedContent = scrapedData.pages
      .map((page) => page.content)
      .filter((content) => content.trim().length > 0)
      .join("\n\n");

    // Extract all unique links
    const allLinks = scrapedData.pages
      .flatMap((page) => page.links)
      .filter((link, index, array) => array.indexOf(link) === index); // Remove duplicates

    // Count successfully scraped pages (pages with content and no error)
    const successfulPages = scrapedData.pages.filter(
      (page) => page.content.trim().length > 0 && !page.error
    );

    // Only mark as ERROR if NO pages were successfully scraped
    // If at least some pages succeeded, mark as COMPLETED (partial success is still success)
    const status = successfulPages.length > 0 ? "COMPLETED" : "ERROR";

    // Update website with scraped content
    await db.website.update({
      where: { id: websiteId },
      data: {
        status: status,
        scrapedContent: combinedContent,
        scrapedLinks: allLinks,
        pageCount: scrapedData.pages.length,
        errorMessage:
          scrapedData.errors.length > 0 ? scrapedData.errors.join("; ") : null,
        lastSync: new Date(),
      },
    });

    // Save individual pages and create sync log entries
    let successCount = 0;
    let failedCount = 0;

    for (const page of scrapedData.pages) {
      const websitePage = await db.websitePage.create({
        data: {
          websiteId,
          url: page.url,
          title: page.title,
          content: page.content,
          links: page.links,
          status: page.error ? "ERROR" : "COMPLETED",
          errorMessage: page.error,
          scrapedAt: new Date(),
        },
      });

      // Create sync log entry for this page
      if (syncLog) {
        const entryStatus = page.error
          ? "FAILED"
          : page.content.trim().length > 0
            ? "SUCCESS"
            : "SKIPPED";

        if (entryStatus === "SUCCESS") successCount++;
        if (entryStatus === "FAILED") failedCount++;

        await db.websiteSyncLogEntry.create({
          data: {
            syncLogId: syncLog.id,
            url: page.url,
            status: entryStatus as
              | "SUCCESS"
              | "FAILED"
              | "SKIPPED"
              | "ALREADY_VISITED",
            errorMessage: page.error,
            contentSize: page.content
              ? Buffer.byteLength(page.content, "utf8")
              : 0,
            scrapedAt: new Date(),
          },
        });
      }

      // Create document chunks for RAG if content exists and OpenAI is available
      if (
        page.content &&
        page.content.trim().length > 0 &&
        !page.error &&
        process.env.OPENAI_API_KEY &&
        EMBEDDINGS_ENABLED
      ) {
        try {
          await createDocumentChunksForPage(
            {
              id: websitePage.id,
              url: websitePage.url,
              title: websitePage.title,
              content: websitePage.content,
              scrapedAt: websitePage.scrapedAt,
              links: (websitePage.links as string[]) || [],
            },
            { id: websiteId, url: websitePage.url }
          );
        } catch (embeddingError) {
          console.warn(
            `Failed to create embeddings for page ${page.url}:`,
            embeddingError
          );
          // Continue without embeddings - the page is still saved
        }
      }
    }

    // Update sync log with completion data
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);

    if (syncLog) {
      await db.websiteSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          duration,
          totalUrls: scrapedData.pages.length,
          successCount,
          failedCount,
          skippedCount: scrapedData.pages.length - successCount - failedCount,
          errorMessage:
            scrapedData.errors.length > 0
              ? scrapedData.errors.join("; ")
              : null,
        },
      });
    }

    console.log(
      `Successfully scraped website ${url}: ${scrapedData.pages.length} pages in ${duration}s`
    );
  } catch (error) {
    console.error(`Error scraping website ${url}:`, error);

    // Update sync log if exists
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);

    if (syncLog) {
      await db.websiteSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          duration,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      });
    }

    // Update website status to ERROR
    await db.website.update({
      where: { id: websiteId },
      data: {
        status: "ERROR",
        errorMessage:
          error instanceof Error ? error.message : "Unknown error occurred",
        lastSync: new Date(),
      },
    });
  }
}

// Create document chunks for RAG system
async function createDocumentChunksForPage(
  websitePage: {
    id: string;
    url: string;
    title: string | null;
    content: string;
    scrapedAt: Date | null;
    links?: string[];
  },
  website: { id: string; url: string }
) {
  try {
    // Chunk the content
    const chunks = chunkWebsiteContent(
      websitePage.content,
      websitePage.url,
      websitePage.title || undefined
    );

    // Create a document record first
    const document = await db.document.create({
      data: {
        name: websitePage.title || websitePage.url,
        originalName: websitePage.title || websitePage.url,
        type: "URL",
        url: websitePage.url,
        contentText: websitePage.content,
        metadata: {
          websiteId: website.id,
          websiteUrl: website.url,
          pageId: websitePage.id,
          pageUrl: websitePage.url,
          scrapedAt: websitePage.scrapedAt?.toISOString(),
          links: websitePage.links || [],
        },
      },
    });

    // Create document chunks in database
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const documentChunk = await db.documentChunk.create({
        data: {
          documentId: document.id,
          chunkIndex: i,
          content: chunk.content,
          metadata: {
            source: "website",
            websiteId: website.id,
            websiteUrl: website.url,
            pageId: websitePage.id,
            pageUrl: websitePage.url,
            pageTitle: websitePage.title,
            chunkIndex: i,
            totalChunks: chunks.length,
            scrapedAt: websitePage.scrapedAt?.toISOString(),
            links: websitePage.links || [],
          },
          tokenCount: estimateTokens(chunk.content),
        },
      });

      // Generate embeddings if OpenAI is available
      if (process.env.OPENAI_API_KEY && EMBEDDINGS_ENABLED) {
        try {
          const embeddings = await generateEmbeddings([chunk.content]);
          // Use raw SQL to update the embedding field since Prisma client has issues with vector type
          await db.$executeRaw`
            UPDATE document_chunks 
            SET embedding = ${JSON.stringify(embeddings[0])}::vector 
            WHERE id = ${documentChunk.id}
          `;
        } catch (embeddingError) {
          console.warn(
            `Failed to generate embeddings for chunk ${i} of page ${websitePage.url}:`,
            embeddingError
          );
          // Continue without embeddings - the chunk is still saved
        }
      }
    }

    console.log(
      `Created ${chunks.length} document chunks for page ${websitePage.url}`
    );
  } catch (error) {
    console.error(
      `Error creating document chunks for page ${websitePage.url}:`,
      error
    );
    throw error;
  }
}
