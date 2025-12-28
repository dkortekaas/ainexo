import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkGracePeriod } from "@/lib/subscription";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Chatbot-API-Key",
};

export async function GET(request: NextRequest) {
  try {
    // Get API key from headers
    const apiKey = request.headers.get("X-Chatbot-API-Key");
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key" },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // Find chatbot settings by API key
    let chatbotSettings = await db.chatbotSettings.findUnique({
      where: { apiKey },
      select: {
        id: true,
        name: true,
        assistantName: true,
        welcomeMessage: true,
        placeholderText: true,
        primaryColor: true,
        secondaryColor: true,
        avatar: true,
        selectedAvatar: true,
        selectedAssistantIcon: true,
        fontFamily: true,
        position: true,
        showBranding: true,
        isActive: true,
        actionButtons: {
          where: { enabled: true },
          orderBy: { priority: "asc" },
          select: {
            id: true,
            buttonText: true,
            question: true,
            priority: true,
          },
        },
        users: {
          select: {
            id: true,
            subscriptionStatus: true,
            trialEndDate: true,
            subscriptionEndDate: true,
            subscriptionCanceled: true,
            isActive: true,
          },
        },
      },
    });

    // No test API keys - all API keys must be valid database entries

    if (!chatbotSettings || !chatbotSettings.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // Check if user's subscription is active
    const user = (chatbotSettings as any).users;
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User account is inactive" },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    // Check subscription status with grace period support
    const gracePeriodCheck = checkGracePeriod(
      user.subscriptionStatus,
      user.trialEndDate,
      user.subscriptionEndDate
    );

    // Only block access if grace period has ended
    if (gracePeriodCheck.shouldBlockAccess) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Subscription expired. Please renew your subscription to continue using the chatbot.",
        },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    // Log if in grace period (for monitoring)
    if (gracePeriodCheck.isInGracePeriod) {
      console.log(
        `⚠️ Widget config accessed during grace period: ${user.id}, ${gracePeriodCheck.daysRemainingInGrace} days remaining`
      );
    }

    return NextResponse.json(
      {
        success: true,
        config: {
          name: chatbotSettings.assistantName || chatbotSettings.name,
          welcomeMessage: chatbotSettings.welcomeMessage,
          placeholderText: chatbotSettings.placeholderText,
          primaryColor: chatbotSettings.primaryColor,
          secondaryColor: chatbotSettings.secondaryColor,
          avatar: chatbotSettings.selectedAvatar || chatbotSettings.avatar,
          assistantIcon:
            (chatbotSettings as any).selectedAssistantIcon || "robot",
          fontFamily: chatbotSettings.fontFamily,
          position: chatbotSettings.position,
          showBranding: chatbotSettings.showBranding,
          actionButtons: (chatbotSettings as any).actionButtons || [],
        },
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error in public config endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
