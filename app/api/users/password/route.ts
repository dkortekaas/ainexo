import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash, compare } from "bcryptjs";
import { z } from "zod";

// Schema voor het valideren van de wachtwoord wijziging
const passwordSchema = z.object({
  currentPassword: z
    .string()
    .min(6, { message: "Huidig wachtwoord is verplicht" }),
  newPassword: z
    .string()
    .min(8, { message: "Nieuw wachtwoord moet minstens 8 tekens bevatten" }),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({
          error: "Je moet ingelogd zijn om je wachtwoord te wijzigen",
        }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const validationResult = passwordSchema.safeParse(body);

    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({ error: validationResult.error.format() }),
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Haal de huidige gebruiker op inclusief wachtwoord
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return new NextResponse(
        JSON.stringify({ error: "Gebruiker niet gevonden" }),
        { status: 404 }
      );
    }

    // Verifieer het huidige wachtwoord
    const isPasswordValid = await compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return new NextResponse(
        JSON.stringify({ error: "Huidig wachtwoord is onjuist" }),
        { status: 400 }
      );
    }

    // Hash het nieuwe wachtwoord
    const hashedPassword = await hash(newPassword, 10);

    // Update het wachtwoord in de database
    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return new NextResponse(
      JSON.stringify({ message: "Wachtwoord succesvol bijgewerkt" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[USER_PASSWORD_PATCH]", error);
    return new NextResponse(
      JSON.stringify({ error: "Er is een interne serverfout opgetreden" }),
      { status: 500 }
    );
  }
}
