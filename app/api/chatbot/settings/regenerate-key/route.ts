import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/assistant-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate new API key using assistant utils
    const newApiKey = generateApiKey();

    // Update the chatbot settings with new API key
    const updatedSettings = await db.chatbotSettings.updateMany({
      where: {
        userId: session.user.id,
      },
      data: {
        apiKey: newApiKey,
        updatedAt: new Date(),
      },
    });

    if (updatedSettings.count === 0) {
      return NextResponse.json(
        { error: "No chatbot settings found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      apiKey: newApiKey,
      message: "API key succesvol geregenereerd. Update je embed code.",
    });
  } catch (error) {
    console.error("Error regenerating API key:", error);
    return NextResponse.json(
      { error: "Failed to regenerate API key" },
      { status: 500 }
    );
  }
}
