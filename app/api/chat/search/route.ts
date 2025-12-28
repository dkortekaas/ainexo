// app/api/chat/search/route.ts
// Next.js 15 App Router API route voor AI chat search

import { NextRequest, NextResponse } from "next/server";
import { searchRelevantContext, formatContextForAI } from "@/lib/search";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Input validation schema
const searchRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  assistantId: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional().default(5),
  threshold: z.number().min(0).max(1).optional().default(0.7),
});

/**
 * POST /api/chat/search
 * Zoekt relevante context voor een chatbot vraag
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = searchRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { query, assistantId, limit, threshold } = validation.data;

    // Voer search uit
    const results = await searchRelevantContext(query, assistantId, {
      limit,
      threshold,
    });

    // Format voor AI
    const formattedContext = formatContextForAI(results);

    return NextResponse.json({
      success: true,
      results,
      context: formattedContext,
      count: results.length,
    });
  } catch (error) {
    console.error("Search API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.format(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to perform search",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/search?query=...&assistantId=...
 * Alternatieve GET endpoint voor eenvoudige queries
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const assistantId = searchParams.get("assistantId");
    const limitParam = searchParams.get("limit");
    const thresholdParam = searchParams.get("threshold");

    // Parse and validate input
    const validation = searchRequestSchema.safeParse({
      query,
      assistantId,
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
      threshold: thresholdParam ? parseFloat(thresholdParam) : undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { query: validQuery, assistantId: validAssistantId, limit, threshold } = validation.data;

    const results = await searchRelevantContext(validQuery, validAssistantId, {
      limit,
      threshold,
    });

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("Search API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.format(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
