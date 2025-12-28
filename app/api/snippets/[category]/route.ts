import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;

    if (category === "all") {
      // Get all snippets from all categories
      const snippets = await (db as any).snippetExample.findMany({
        where: {
          enabled: true,
        },
        include: {
          category: true,
        },
        orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
      });

      const transformedSnippets = snippets.map((snippet: any) => ({
        id: snippet.id,
        text: snippet.text,
        category: snippet.category.label,
        title: snippet.title,
      }));

      return NextResponse.json(transformedSnippets);
    } else {
      // Get snippets from specific category
      const snippets = await (db as any).snippetExample.findMany({
        where: {
          enabled: true,
          category: {
            name: category,
            enabled: true,
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          order: "asc",
        },
      });

      const transformedSnippets = snippets.map((snippet: any) => ({
        id: snippet.id,
        text: snippet.text,
        category: snippet.category.label,
        title: snippet.title,
      }));

      return NextResponse.json(transformedSnippets);
    }
  } catch (error) {
    console.error("Error fetching snippets for category:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippets" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
