import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUsageStats, getUserSubscriptionStatus } from "@/lib/subscription";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [usageStats, subscriptionStatus] = await Promise.all([
      getUsageStats(session.user.id),
      getUserSubscriptionStatus(session.user.id),
    ]);

    if (!usageStats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      usage: usageStats,
      limits: {
        assistants: subscriptionStatus.assistantsLimit,
        documents: subscriptionStatus.documentsLimit,
        websites: subscriptionStatus.websitesLimit,
        conversations: subscriptionStatus.conversationsLimit,
      },
      subscription: {
        plan: subscriptionStatus.plan,
        isTrial: subscriptionStatus.isTrial,
        isExpired: subscriptionStatus.isExpired,
      },
    });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

