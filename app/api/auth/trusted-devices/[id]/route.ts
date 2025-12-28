// app/api/auth/trusted-devices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { logSecurityEvent } from "@/lib/security";

// DELETE /api/auth/trusted-devices/[id] - Remove a trusted device
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om vertrouwde apparaten te beheren" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // // Verify the device belongs to the user
    // const device = await db.trustedDevice.findUnique({
    //   where: { id },
    //   select: { userId: true },
    // });

    // if (!device) {
    //   return NextResponse.json(
    //     { error: "Apparaat niet gevonden" },
    //     { status: 404 }
    //   );
    // }

    // if (device.userId !== session.user.id) {
    //   return NextResponse.json(
    //     { error: "Je hebt geen toegang tot dit apparaat" },
    //     { status: 403 }
    //   );
    // }

    // // Delete the device
    // await db.trustedDevice.delete({
    //   where: { id },
    // });

    // Log the event
    await logSecurityEvent(
      session.user.id,
      undefined,
      "trusted_device_removed",
      req.headers.get("x-forwarded-for") || "",
      req.headers.get("user-agent") || "",
      `Trusted device ${id} removed`
    );

    return NextResponse.json({
      success: true,
      message: "Apparaat succesvol verwijderd",
    });
  } catch (error) {
    console.error("[TRUSTED_DEVICE_DELETE]", error);
    return NextResponse.json(
      {
        error: "Er is een fout opgetreden bij het verwijderen van het apparaat",
      },
      { status: 500 }
    );
  }
}
