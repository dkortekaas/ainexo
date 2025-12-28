import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Schema voor het valideren van de rol update
const roleUpdateSchema = z.object({
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Ongeldige rol" }),
  }),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    const params = await context.params;

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({
          error: "Je moet ingelogd zijn om een rol bij te werken",
        }),
        { status: 401 }
      );
    }

    // Haal de huidige gebruiker op om te controleren of deze admin is
    const currentUser = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
        companyId: true,
      },
    });

    // Controleer of de gebruiker admin is
    if (!currentUser || currentUser.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({
          error: "Je hebt geen toegang tot deze functionaliteit",
        }),
        { status: 403 }
      );
    }

    // Haal de gebruiker op die bijgewerkt moet worden
    const targetUser = await db.user.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        role: true,
        companyId: true,
      },
    });

    if (!targetUser) {
      return new NextResponse(
        JSON.stringify({
          error: "Gebruiker niet gevonden",
        }),
        { status: 404 }
      );
    }

    // Controleer of de gebruiker in hetzelfde bedrijf zit
    if (targetUser.companyId !== currentUser.companyId) {
      return new NextResponse(
        JSON.stringify({
          error: "Je kunt alleen gebruikers in je eigen bedrijf beheren",
        }),
        { status: 403 }
      );
    }

    // Valideer de request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new NextResponse(
        JSON.stringify({
          error: "Ongeldige request body",
          details: "De request body kon niet geparsed worden als JSON",
        }),
        { status: 400 }
      );
    }

    // Extra validatie om zeker te zijn dat body niet null of undefined is
    if (!body || typeof body !== "object") {
      return new NextResponse(
        JSON.stringify({
          error: "Ongeldige request body",
          details: "De request body is leeg of heeft een ongeldig formaat",
        }),
        { status: 400 }
      );
    }

    const validationResult = roleUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Validatiefout",
          details: validationResult.error.issues
            .map((issue) => issue.message)
            .join(", "),
        }),
        { status: 400 }
      );
    }

    const { role } = validationResult.data;

    // Tel het aantal admins in het bedrijf
    const adminCount = await db.user.count({
      where: {
        companyId: currentUser.companyId,
        role: "ADMIN",
      },
    });

    // Voorkom dat de laatste admin zijn rol verliest
    if (targetUser.role === "ADMIN" && role !== "ADMIN" && adminCount <= 1) {
      return new NextResponse(
        JSON.stringify({
          error: "Je kunt de laatste beheerder niet van zijn rol ontnemen",
        }),
        { status: 400 }
      );
    }

    // Update de rol van de gebruiker
    const updatedUser = await db.user.update({
      where: {
        id: params.id,
      },
      data: {
        role: role as UserRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_ROLE_PATCH]", error);
    return new NextResponse(
      JSON.stringify({
        error: "Er is een fout opgetreden bij het bijwerken van de rol",
        details: error instanceof Error ? error.message : "Onbekende fout",
      }),
      { status: 500 }
    );
  }
}
