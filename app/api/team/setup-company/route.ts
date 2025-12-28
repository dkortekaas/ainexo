import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, companyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user already has a company, return it
    if (user.companyId) {
      const company = await db.company.findUnique({
        where: { id: user.companyId },
        select: { id: true, name: true },
      });
      return NextResponse.json({ company });
    }

    // Create a default company for the user
    const companyName = user.name
      ? `${user.name}'s Company`
      : `${user.email}'s Company`;

    const company = await db.company.create({
      data: {
        name: companyName,
        description: "Default company created for user",
      },
    });

    // Update user with companyId
    await db.user.update({
      where: { id: user.id },
      data: { companyId: company.id },
    });

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
      },
    });
  } catch (error) {
    console.error("Error setting up company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
