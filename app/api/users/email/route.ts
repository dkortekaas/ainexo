import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Schema voor het valideren van email wijziging
const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: "Ongeldig email adres" }),
  currentPassword: z
    .string()
    .min(1, { message: "Huidig wachtwoord is verplicht" }),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({
          error: "Je moet ingelogd zijn om je email te wijzigen",
        }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const validationResult = changeEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Validatie gefaald",
          details: validationResult.error.format(),
        }),
        { status: 400 }
      );
    }

    const { newEmail, currentPassword } = validationResult.data;

    // Haal de huidige gebruiker op met wachtwoord
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!currentUser || !currentUser.password) {
      return new NextResponse(
        JSON.stringify({ error: "Gebruiker niet gevonden" }),
        { status: 404 }
      );
    }

    // Controleer of het nieuwe email adres al bestaat
    const existingUser = await db.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ error: "Dit email adres is al in gebruik" }),
        { status: 409 }
      );
    }

    // Verifieer het huidige wachtwoord
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      currentUser.password
    );

    if (!isPasswordValid) {
      return new NextResponse(
        JSON.stringify({ error: "Huidig wachtwoord is onjuist" }),
        { status: 400 }
      );
    }

    // Update het email adres
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { email: newEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Email adres succesvol gewijzigd",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[USER_EMAIL_CHANGE]", error);
    return new NextResponse(
      JSON.stringify({
        error: "Er is een interne serverfout opgetreden",
      }),
      { status: 500 }
    );
  }
}
