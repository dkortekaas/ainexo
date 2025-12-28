import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { SubscriptionStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { syncSubscriptionFromStripe } from "@/lib/subscription-crud";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      // Check if user is in trial - sync is only for paid subscriptions
      const userWithStatus = await db.user.findUnique({
        where: { id: user.id },
        select: { subscriptionStatus: true },
      });
      
      if (userWithStatus?.subscriptionStatus === "TRIAL") {
        return NextResponse.json(
          { error: "Sync is only available for paid subscriptions. Trial users don't have a Stripe customer yet." },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 404 }
      );
    }

    let activeSubscription: Stripe.Subscription | null = null;

    // If we already have a subscription ID, fetch it directly
    if (user.stripeSubscriptionId) {
      try {
        activeSubscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId
        );
        console.log(`Retrieved subscription ${activeSubscription.id} directly`);
      } catch (error) {
        console.log(`Failed to retrieve subscription ${user.stripeSubscriptionId}, falling back to list`);
        activeSubscription = null;
      }
    }

    // If we don't have a subscription yet, or retrieval failed, list all subscriptions
    if (!activeSubscription) {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "all",
        limit: 10,
        expand: ['data.items.data.price'],
      });

      console.log(`Found ${subscriptions.data.length} subscriptions for customer ${user.stripeCustomerId}`);

      // Find the active or most recent subscription
      activeSubscription = subscriptions.data.find(
        (sub) => sub.status === "active" || sub.status === "trialing"
      ) || subscriptions.data[0];

      if (!activeSubscription) {
        return NextResponse.json(
          { error: "No subscription found in Stripe" },
          { status: 404 }
        );
      }
    }

    // Sync subscription using CRUD function
    const updatedSubscription = await syncSubscriptionFromStripe(user.id);

    console.log(
      `Updated user ${user.id}: plan=${updatedSubscription.subscriptionPlan}, status=${updatedSubscription.subscriptionStatus}`
    );

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.stripeSubscriptionId,
        plan: updatedSubscription.subscriptionPlan,
        status: updatedSubscription.subscriptionStatus,
        currentPeriodStart: updatedSubscription.subscriptionStartDate,
        currentPeriodEnd: updatedSubscription.subscriptionEndDate,
      },
    });
  } catch (error: any) {
    console.error("Error syncing subscription:", error);
    return NextResponse.json(
      { error: "Failed to sync subscription", details: error.message },
      { status: 500 }
    );
  }
}
