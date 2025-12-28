import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getPaginationParams,
  getPrismaOptions,
} from "@/lib/pagination";
import { checkRateLimit } from "@/lib/redis-rate-limiter";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 100 requests per hour per IP for public endpoint
    const identifier = request.headers.get("x-forwarded-for") ||
                      request.headers.get("x-real-ip") ||
                      "unknown";

    const rateLimit = await checkRateLimit(
      `snippets:${identifier}`,
      100, // 100 requests
      3600000 // per hour
    );

    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded for snippets API", {
        identifier,
        retryAfter: rateLimit.retryAfter,
      });

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    logger.debug("Fetching snippets");

    // Parse pagination parameters
    const pagination = getPaginationParams(request);

    // Get all categories with their snippets (with pagination on snippets)
    const categories = await (db as any).snippetCategory.findMany({
      where: {
        enabled: true,
      },
      include: {
        snippets: {
          where: {
            enabled: true,
          },
          orderBy: {
            order: "asc",
          },
          ...getPrismaOptions(pagination),
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    // Get total count of snippets
    const totalSnippets = await (db as any).snippetExample.count({
      where: { enabled: true },
    });

    logger.debug(`Found ${categories.length} categories, ${totalSnippets} total snippets`);

    // Transform the data to match the expected format
    const transformedCategories = categories.map((category: any) => ({
      id: category.name === "all" ? "all" : category.name,
      label: category.label,
      count: category.snippets.length,
    }));

    // Add the "All" category with total count
    const allCategory = {
      id: "all",
      label: "All",
      count: categories.reduce(
        (total: number, cat: any) => total + cat.snippets.length,
        0
      ),
    };

    // Ensure "All" is first
    const finalCategories = [
      allCategory,
      ...transformedCategories.filter((cat: any) => cat.id !== "all"),
    ];

    // Get all snippets for the "All" category
    const allSnippets = categories.flatMap((category: any) =>
      category.snippets.map((snippet: any) => ({
        id: snippet.id,
        text: snippet.text,
        category: category.label,
        title: snippet.title,
      }))
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalSnippets / pagination.limit);

    return NextResponse.json({
      categories: finalCategories,
      snippets: allSnippets,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: totalSnippets,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching snippets", {
      endpoint: "/api/snippets",
      error: error instanceof Error ? error.message : String(error),
    });

    // Don't expose error details to client
    return NextResponse.json(
      {
        error: "Failed to fetch snippets. Please try again later.",
      },
      { status: 500 }
    );
  }
}
