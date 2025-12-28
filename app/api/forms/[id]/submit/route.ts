import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const submitSchema = z.object({
  data: z.record(z.string()),
  sessionId: z.string().optional(),
  metadata: z
    .object({
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
    })
    .optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
    const apiKey = request.headers.get("X-Chatbot-API-Key");

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key vereist" },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = submitSchema.parse(body);

    // Get the form and verify it exists and is enabled
    const form = await db.contactForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { success: false, error: "Formulier niet gevonden" },
        { status: 404 }
      );
    }

    if (!form.enabled) {
      return NextResponse.json(
        { success: false, error: "Formulier is uitgeschakeld" },
        { status: 403 }
      );
    }

    // Verify API key matches the assistant
    const assistant = await db.chatbotSettings.findUnique({
      where: { id: form.assistantId || undefined },
    });

    if (!assistant || assistant.apiKey !== apiKey) {
      return NextResponse.json(
        { success: false, error: "Ongeldig API key" },
        { status: 401 }
      );
    }

    // Get IP address
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "";

    // Save the form submission
    await db.formSubmission.create({
      data: {
        formId,
        sessionId: validatedData.sessionId || "",
        assistantId: form.assistantId,
        data: validatedData.data,
        ipAddress,
        userAgent: validatedData.metadata?.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Formulier succesvol verzonden",
      redirectUrl: form.redirectUrl,
    });
  } catch (error) {
    console.error("Form submission error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Ongeldige gegevens" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
