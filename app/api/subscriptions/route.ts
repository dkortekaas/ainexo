import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  SUBSCRIPTION_PLANS_WITH_PRICES,
  type SubscriptionPlanType,
} from "@/lib/stripe";
import { stripe } from "@/lib/stripe";
import { checkGracePeriod } from "@/lib/subscription";
import { createSubscription, getSubscription } from "@/lib/subscription-crud";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Check grace period status
    const gracePeriodCheck = checkGracePeriod(
      user.subscriptionStatus,
      user.trialEndDate,
      user.subscriptionEndDate
    );

    return NextResponse.json({
      user: {
        ...user,
        isTrialActive,
        trialDaysRemaining,
        currentPlan:
          user.subscriptionPlan &&
          (user.subscriptionPlan in SUBSCRIPTION_PLANS_WITH_PRICES)
            ? SUBSCRIPTION_PLANS_WITH_PRICES[
                user.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS_WITH_PRICES
              ]
            : null,
        gracePeriod: {
          isInGracePeriod: gracePeriodCheck.isInGracePeriod,
          daysRemaining: gracePeriodCheck.daysRemainingInGrace,
          endsAt: gracePeriodCheck.gracePeriodEndsAt,
          message: gracePeriodCheck.message,
          urgency: gracePeriodCheck.urgency,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!plan || !(plan in SUBSCRIPTION_PLANS_WITH_PRICES)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Use CRUD function to create subscription (Stripe checkout)
    const result = await createSubscription(session.user.id, {
      plan: plan as SubscriptionPlanType,
      createStripeCheckout: true,
      successUrl: `${process.env.NEXTAUTH_URL}/account?success=true`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/account?canceled=true`,
    });

    // If result is a checkout URL, return it
    if ("checkoutUrl" in result) {
      return NextResponse.json({ url: result.checkoutUrl });
    }

    // Otherwise return error (shouldn't happen for paid plans)
    return NextResponse.json(
      { error: "Unexpected result from subscription creation" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Error creating subscription:", error);

    // Provide helpful error messages for common Stripe errors
    if (error.type === "StripeAuthenticationError") {
      return NextResponse.json(
        {
          error: "Stripe configuration error",
          message:
            "Invalid Stripe API key. Please check your .env.local file and ensure STRIPE_SECRET_KEY is set correctly. See docs/STRIPE_SETUP_NL.md for help.",
        },
        { status: 500 }
      );
    }

    if (error.type === "StripeInvalidRequestError") {
      if (error.message?.includes("price")) {
        return NextResponse.json(
          {
            error: "Stripe configuration error",
            message:
              "Invalid Stripe Price ID. Please check your .env.local file and ensure all STRIPE_*_PRICE_ID variables are set correctly. See docs/STRIPE_SETUP_NL.md for help.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to create subscription. Please try again later.",
      },
      { status: 500 }
    );
  }
}
