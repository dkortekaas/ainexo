import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({
          error: "Je moet ingelogd zijn om je profielgegevens op te halen",
        }),
        { status: 401 }
      );
    }

    // Haal de gebruiker op met alle benodigde gegevens
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
        twoFactorVerified: true,
      },
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "Gebruiker niet gevonden" }),
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_PROFILE_GET]", error);
    return new NextResponse(
      JSON.stringify({ error: "Er is een interne serverfout opgetreden" }),
      { status: 500 }
    );
  }
}

// Schema voor het valideren van de profiel input
const profileSchema = z.object({
  name: z.string().min(1, { message: "Naam is verplicht" }),
  department: z.string().optional(),
  language: z.string().optional(),
  image: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({
          error: "Je moet ingelogd zijn om je profiel bij te werken",
        }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const validationResult = profileSchema.safeParse(body);

    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({ error: validationResult.error.format() }),
        { status: 400 }
      );
    }

    const { name, department, language, image } = validationResult.data;

    const updatedUser = await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
        ...(image !== undefined && { image }),
      },
    });

    // Verwijder gevoelige gegevens voordat we de gebruiker teruggeven
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("[USER_PROFILE_PATCH]", error);
    return new NextResponse(
      JSON.stringify({
        error: "Er is een interne serverfout opgetreden",
      }),
      { status: 500 }
    );
  }
}
