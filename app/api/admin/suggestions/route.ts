import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateSuggestionSchema = z.object({
  suggestionId: z.string().min(1),
  status: z.enum(["PENDING", "REVIEWED", "IMPLEMENTED", "DISMISSED"]),
  notes: z.string().optional(),
});

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
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // Build where clause
    const whereClause: any = {};
    if (priority) {
      whereClause.priority = priority.toUpperCase();
    }
    if (status) {
      whereClause.status = status.toUpperCase();
    }
    if (type) {
      whereClause.type = type.toUpperCase();
    }

    const suggestions = await db.improvementSuggestion.findMany({
      where: whereClause,
      include: {
        analysis: {
          include: {
            // Include related analysis data
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    // Get statistics by priority
    const priorityStats = await Promise.all([
      db.improvementSuggestion.count({
        where: { priority: "CRITICAL", status: "PENDING" },
      }),
      db.improvementSuggestion.count({
        where: { priority: "HIGH", status: "PENDING" },
      }),
      db.improvementSuggestion.count({
        where: { priority: "MEDIUM", status: "PENDING" },
      }),
      db.improvementSuggestion.count({
        where: { priority: "LOW", status: "PENDING" },
      }),
    ]);

    const [critical, high, medium, low] = priorityStats;

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        statistics: {
          pending: {
            critical,
            high,
            medium,
            low,
            total: critical + high + medium + low,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { suggestionId, status, notes } = updateSuggestionSchema.parse(body);

    const updatedSuggestion = await db.improvementSuggestion.update({
      where: {
        id: suggestionId,
      },
      data: {
        status: status as any,
        updatedAt: new Date(),
      },
    });

    // If implementing a suggestion, log the action
    if (status === "IMPLEMENTED") {
      console.log(
        `✅ Implemented suggestion ${suggestionId}: ${updatedSuggestion.description}`
      );

      // You could add additional logic here to automatically implement certain types of suggestions
      // For example, if it's a knowledge base suggestion, you could trigger a knowledge base update
    }

    return NextResponse.json({
      success: true,
      data: updatedSuggestion,
      message: `Suggestion ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Error updating suggestion:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
