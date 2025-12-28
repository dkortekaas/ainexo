import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const formFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["text", "email", "phone", "textarea", "select"]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
});

const formUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  redirectUrl: z.string().url().nullable().optional(),
  fields: z.array(formFieldSchema).optional(),
  triggers: z.array(z.string()).optional(),
});

// Helper to ensure ownership via assistantId
async function ensureOwnership(formId: string, userId: string) {
  const form = await db.contactForm.findUnique({ where: { id: formId } });
  if (!form) return { ok: false, status: 404 as const };
  if (!form.assistantId) return { ok: false, status: 403 as const };
  const assistant = await db.chatbotSettings.findFirst({
    where: { id: form.assistantId, userId },
  });
  if (!assistant) return { ok: false, status: 404 as const };
  return { ok: true, form };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const check = await ensureOwnership(id, session.user.id);
    if (!("ok" in check) || !check.ok)
      return NextResponse.json(
        { error: "Not found" },
        { status: check.status }
      );
    return NextResponse.json(check.form);
  } catch (error) {
    console.error("Error getting form:", error);
    return NextResponse.json({ error: "Failed to get form" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const check = await ensureOwnership(id, session.user.id);
    if (!("ok" in check) || !check.ok)
      return NextResponse.json(
        { error: "Not found" },
        { status: check.status }
      );

    const json = await request.json();
    const parsed = formUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, description, enabled, redirectUrl, fields, triggers } =
      parsed.data;
    const updated = await db.contactForm.update({
      where: { id },
      data: { name, description, enabled, redirectUrl, fields, triggers },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const check = await ensureOwnership(id, session.user.id);
    if (!("ok" in check) || !check.ok)
      return NextResponse.json(
        { error: "Not found" },
        { status: check.status }
      );

    await db.contactForm.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
}
