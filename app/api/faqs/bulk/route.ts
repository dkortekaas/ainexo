import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface FAQImportData {
  question: string;
  answer: string;
  enabled?: boolean;
  order?: number;
}

// POST /api/faqs/bulk - Bulk import FAQs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { assistantId, faqs } = body;

    if (!assistantId) {
      return NextResponse.json(
        { error: "Assistant ID is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(faqs) || faqs.length === 0) {
      return NextResponse.json(
        { error: "FAQs array is required and must not be empty" },
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

    // Validate and prepare FAQ data
    const MAX_QUESTION_LENGTH = 500;
    const MAX_ANSWER_LENGTH = 5000;
    const errors: Array<{ row: number; errors: string[] }> = [];
    const validFAQs: FAQImportData[] = [];

    faqs.forEach((faq: FAQImportData, index: number) => {
      const rowErrors: string[] = [];

      if (!faq.question || faq.question.trim().length === 0) {
        rowErrors.push("Question is required");
      } else if (faq.question.length > MAX_QUESTION_LENGTH) {
        rowErrors.push(
          `Question must not exceed ${MAX_QUESTION_LENGTH} characters`
        );
      }

      if (!faq.answer || faq.answer.trim().length === 0) {
        rowErrors.push("Answer is required");
      } else if (faq.answer.length > MAX_ANSWER_LENGTH) {
        rowErrors.push(
          `Answer must not exceed ${MAX_ANSWER_LENGTH} characters`
        );
      }

      if (rowErrors.length > 0) {
        errors.push({ row: index + 1, errors: rowErrors });
      } else {
        validFAQs.push({
          question: faq.question.trim(),
          answer: faq.answer.trim(),
          enabled: faq.enabled !== undefined ? faq.enabled : true,
          order: faq.order !== undefined ? faq.order : 0,
        });
      }
    });

    if (validFAQs.length === 0) {
      return NextResponse.json(
        {
          error: "No valid FAQs to import",
          imported: 0,
          failed: faqs.length,
          errors,
        },
        { status: 400 }
      );
    }

    // Batch insert FAQs
    let imported = 0;
    let failed = 0;

    try {
      // Use createMany for better performance
      const result = await db.fAQ.createMany({
        data: validFAQs.map((faq) => ({
          assistantId,
          question: faq.question,
          answer: faq.answer,
          enabled: faq.enabled,
          order: faq.order,
        })),
        skipDuplicates: false, // We want to know if there are duplicates
      });

      imported = result.count;
      failed = validFAQs.length - imported;
    } catch (error) {
      console.error("Error bulk creating FAQs:", error);

      // If createMany fails, try individual inserts to get better error info
      for (const faq of validFAQs) {
        try {
          await db.fAQ.create({
            data: {
              assistantId,
              question: faq.question,
              answer: faq.answer,
              enabled: faq.enabled,
              order: faq.order,
            },
          });
          imported++;
        } catch (individualError) {
          failed++;
          console.error("Error creating individual FAQ:", individualError);
        }
      }
    }

    return NextResponse.json({
      success: failed === 0,
      imported,
      failed: failed + errors.length,
      total: faqs.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error bulk importing FAQs:", error);
    return NextResponse.json(
      {
        error: "Failed to bulk import FAQs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
