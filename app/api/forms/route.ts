import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  getPaginationParams,
  getPrismaOptions,
  createPaginatedResponse,
} from "@/lib/pagination";

const formFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["text", "email", "phone", "textarea", "select"]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
});

const formCreateSchema = z.object({
  assistantId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  enabled: z.boolean().optional().default(true),
  redirectUrl: z.string().url().optional(),
  fields: z.array(formFieldSchema).optional().default([]),
  triggers: z.array(z.string()).optional().default([]),
});

// GET /api/forms?assistantId=...
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

    // Ensure assistant belongs to user
    const assistant = await db.chatbotSettings.findFirst({
      where: { id: assistantId, userId: session.user.id },
    });
    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    // Parse pagination parameters
    const pagination = getPaginationParams(request);

    const where = { assistantId };

    // Get total count for pagination metadata
    const total = await db.contactForm.count({ where });

    const forms = await db.contactForm.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...getPrismaOptions(pagination),
    });

    // Return paginated response
    return NextResponse.json(
      createPaginatedResponse(forms, pagination.page, pagination.limit, total)
    );
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

// POST /api/forms
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parse = formCreateSchema.safeParse(json);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parse.error.flatten() },
        { status: 400 }
      );
    }
    const {
      assistantId,
      name,
      description,
      enabled,
      redirectUrl,
      fields,
      triggers,
    } = parse.data;

    const assistant = await db.chatbotSettings.findFirst({
      where: { id: assistantId, userId: session.user.id },
    });
    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    const created = await db.contactForm.create({
      data: {
        assistantId,
        name,
        description,
        enabled,
        redirectUrl,
        fields,
        triggers,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}
