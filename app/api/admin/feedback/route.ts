import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const rating = searchParams.get("rating");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (rating) {
      whereClause.rating = rating.toUpperCase();
    }

    // Get feedback with pagination
    const [feedback, totalCount] = await Promise.all([
      db.messageFeedback.findMany({
        where: whereClause,
        include: {
          message: {
            include: {
              session: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.messageFeedback.count({
        where: whereClause,
      }),
    ]);

    // Get poor response analysis
    const analysisWhereClause: any = {};
    if (status) {
      analysisWhereClause.analysisStatus = status.toUpperCase();
    }

    const [poorResponses, analysisCount] = await Promise.all([
      db.poorResponseAnalysis.findMany({
        where: analysisWhereClause,
        include: {
          suggestions: {
            orderBy: {
              priority: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.poorResponseAnalysis.count({
        where: analysisWhereClause,
      }),
    ]);

    // Get statistics
    const stats = await Promise.all([
      db.messageFeedback.count({
        where: { rating: "THUMBS_UP" },
      }),
      db.messageFeedback.count({
        where: { rating: "THUMBS_DOWN" },
      }),
      db.poorResponseAnalysis.count({
        where: { analysisStatus: "COMPLETED" },
      }),
      db.improvementSuggestion.count({
        where: { status: "PENDING" },
      }),
    ]);

    const [thumbsUp, thumbsDown, completedAnalysis, pendingSuggestions] = stats;

    return NextResponse.json({
      success: true,
      data: {
        feedback: {
          items: feedback,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
          },
        },
        poorResponses: {
          items: poorResponses,
          pagination: {
            page,
            limit,
            total: analysisCount,
            pages: Math.ceil(analysisCount / limit),
          },
        },
        statistics: {
          thumbsUp,
          thumbsDown,
          totalFeedback: thumbsUp + thumbsDown,
          satisfactionRate:
            totalCount > 0
              ? ((thumbsUp / (thumbsUp + thumbsDown)) * 100).toFixed(1)
              : 0,
          completedAnalysis,
          pendingSuggestions,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching feedback data:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
