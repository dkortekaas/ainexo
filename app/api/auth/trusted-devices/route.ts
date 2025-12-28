// app/api/auth/trusted-devices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/auth/trusted-devices - Retrieve all trusted devices for the user
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om vertrouwde apparaten te bekijken" },
        { status: 401 }
      );
    }

    // const devices = await db.trustedDevice.findMany({
    //   where: { userId: session.user.id },
    //   orderBy: { lastUsedAt: "desc" },
    // });

    // // Filter out expired devices
    // const currentDate = new Date();
    // const validDevices = devices.filter(
    //   (device) => device.expiresAt > currentDate
    // );

    return NextResponse.json({ devices: [] });
  } catch (error) {
    console.error("[TRUSTED_DEVICES_GET]", error);
    return NextResponse.json(
      {
        error:
          "Er is een fout opgetreden bij het ophalen van vertrouwde apparaten",
      },
      { status: 500 }
    );
  }
}
