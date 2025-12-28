import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    // If companyId is provided, validate that the user belongs to that company
    if (companyId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          companyId: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          trialStartDate: true,
          trialEndDate: true,
          subscriptionStartDate: true,
          subscriptionEndDate: true,
          subscriptionCanceled: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Verify user belongs to the requested company
      if (user.companyId !== companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Calculate subscription status
      const now = new Date();
      const isTrialActive =
        user.subscriptionStatus === "TRIAL" &&
        user.trialEndDate &&
        user.trialEndDate > now;

      const isSubscriptionActive =
        user.subscriptionStatus === "ACTIVE" &&
        !user.subscriptionCanceled &&
        (!user.subscriptionEndDate || user.subscriptionEndDate > now);

      const hasActiveSubscription = isTrialActive || isSubscriptionActive;

      return NextResponse.json({
        hasActiveSubscription,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        isTrialActive,
        isSubscriptionActive,
        trialEndDate: user.trialEndDate,
        subscriptionEndDate: user.subscriptionEndDate,
        subscriptionCanceled: user.subscriptionCanceled,
      });
    }

    // If no companyId provided, return user's subscription data
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        trialStartDate: true,
        trialEndDate: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        subscriptionCancelAt: true,
        subscriptionCanceled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate trial status
    const now = new Date();
    const isTrialActive =
      user.subscriptionStatus === "TRIAL" &&
      user.trialEndDate &&
      user.trialEndDate > now;

    const trialDaysRemaining = user.trialEndDate
      ? Math.max(
          0,
          Math.ceil(
            (user.trialEndDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    const hasActiveSubscription =
      isTrialActive ||
      (user.subscriptionStatus === "ACTIVE" && !user.subscriptionCanceled);

    return NextResponse.json({
      user: {
        ...user,
        isTrialActive,
        trialDaysRemaining,
        hasActiveSubscription,
      },
      hasActiveSubscription,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
