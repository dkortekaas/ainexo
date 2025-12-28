import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const languageSchema = z.object({
  language: z.enum(["nl", "en", "de", "fr", "es"]),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Je moet ingelogd zijn om je taalvoorkeur te wijzigen" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { language } = languageSchema.parse(body);

    // Update user's language preference
    // const updatedUser = await db.user.update({
    //   where: {
    //     id: session.user.id,
    //   },
    //   data: {
    //     language,
    //   },
    // });

    return NextResponse.json(
      { message: "Taalvoorkeur succesvol bijgewerkt" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LANGUAGE_PATCH]", error);
    return NextResponse.json(
      {
        message:
          "Er is een fout opgetreden bij het bijwerken van je taalvoorkeur",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Je moet ingelogd zijn om je taalvoorkeur op te halen" },
        { status: 401 }
      );
    }

    // const user = await db.user.findUnique({
    //   where: {
    //     id: session.user.id,
    //   },
    //   select: {
    //     language: true,
    //   },
    // });

    return NextResponse.json({ language: "nl" });
  } catch (error) {
    console.error("[LANGUAGE_GET]", error);
    return NextResponse.json(
      {
        message:
          "Er is een fout opgetreden bij het ophalen van je taalvoorkeur",
      },
      { status: 500 }
    );
  }
}
