import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch statistics
  } catch (error) {
    console.error("[DASHBOARD_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
