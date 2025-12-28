import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";

export async function POST(req: NextRequest) {
  const t = await getTranslations();
  const session = await getAuthSession();

  try {
    const { level, message, context, userId, companyId, ipAddress, userAgent } =
      await req.json();

    // await db.applicationLog.create({
    //   data: {
    //     level,
    //     message,
    //     context: context ? JSON.stringify(context) : null,
    //     userId,
    //     companyId,
    //     ipAddress,
    //     userAgent,
    //   },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to write log to database:", error);
    return NextResponse.json(
      { message: t("error.internalServerError") },
      { status: 500 }
    );
  }
}
