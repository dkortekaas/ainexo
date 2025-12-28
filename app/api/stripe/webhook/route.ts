import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { db } from "@/lib/db";
import { updateSubscriptionFromStripeWebhook, updateSubscription } from "@/lib/subscription-crud";
import { SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";

// This is required for Stripe webhook signature verification
export const runtime = "nodejs";

// Disable body parsing to get raw body for webhook signature verification
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const result = await updateSubscriptionFromStripeWebhook(subscription);
  if (result) {
    console.log(`Subscription created for user ${result.userId}: ${result.subscriptionPlan}`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const result = await updateSubscriptionFromStripeWebhook(subscription);
  if (result) {
    console.log(
      `Subscription updated for user ${result.userId}: status=${result.subscriptionStatus}, plan=${result.subscriptionPlan}`
    );
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Update user to canceled status using CRUD function
  await updateSubscription(user.id, {
    subscriptionStatus: SubscriptionStatus.CANCELED,
    subscriptionCanceled: true,
    subscriptionEndDate: new Date(),
  });

  console.log(`Subscription deleted for user ${user.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string | null;

  if (!subscriptionId) {
    // Not a subscription payment, ignore
    return;
  }

  // Find user by Stripe customer ID
  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // If subscription was past_due or unpaid, update to active
  if (
    user.subscriptionStatus === "PAST_DUE" ||
    user.subscriptionStatus === "UNPAID"
  ) {
    await updateSubscription(user.id, {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    });
    console.log(`Payment succeeded, user ${user.id} reactivated`);
  }

  console.log(`Payment succeeded for user ${user.id}, invoice ${invoice.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string | null;

  if (!subscriptionId) {
    // Not a subscription payment, ignore
    return;
  }

  // Find user by Stripe customer ID
  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Update subscription status to past_due
  await updateSubscription(user.id, {
    subscriptionStatus: SubscriptionStatus.PAST_DUE,
  });

  console.log(`Payment failed for user ${user.id}, invoice ${invoice.id}`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    // Not a subscription checkout, ignore
    return;
  }

  // Find user by Stripe customer ID
  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Fetch the subscription to get plan details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error("No price ID found in subscription");
    return;
  }

  const plan = getPlanByPriceId(priceId);
  if (!plan) {
    console.error(`Unknown price ID: ${priceId}`);
    return;
  }

  // Update user with subscription info using CRUD function
  await updateSubscriptionFromStripeWebhook(subscription);

  console.log(`Checkout completed for user ${user.id}: ${plan}`);
}
