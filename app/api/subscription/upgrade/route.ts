import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import {
  SUBSCRIPTION_PLANS_WITH_PRICES,
  type SubscriptionPlanType,
} from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, companyId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Validate that the planId is a valid paid subscription plan (TRIAL has no price)
    if (
      !planId ||
      !(planId in SUBSCRIPTION_PLANS_WITH_PRICES)
    ) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get the user and verify they belong to the company
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If companyId is provided, verify the user belongs to that company
    if (companyId && user.companyId !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the plan details
    const selectedPlan =
      SUBSCRIPTION_PLANS_WITH_PRICES[
        planId as keyof typeof SUBSCRIPTION_PLANS_WITH_PRICES
      ];

    if (!selectedPlan.priceId) {
      return NextResponse.json(
        { error: "Plan not configured for payments" },
        { status: 400 }
      );
    }

    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
          ...(user.companyId && { companyId: user.companyId }),
        },
      });

      customerId = customer.id;

      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session_url = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/account?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/account?canceled=true`,
      metadata: {
        userId: user.id,
        planId: planId,
        ...(user.companyId && { companyId: user.companyId }),
      },
    });

    return NextResponse.json({ url: session_url.url });
  } catch (error) {
    console.error("Error creating subscription upgrade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
