// app/api/users/check/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";

export async function GET(req: NextRequest) {
  const t = await getTranslations();

  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { message: t("error.emailRequired") },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("[USER_CHECK_GET]", error);
    return NextResponse.json(
      {
        message: t("error.checkUser"),
      },
      { status: 500 }
    );
  }
}
