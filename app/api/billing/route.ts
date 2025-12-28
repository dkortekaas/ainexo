import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, SUBSCRIPTION_PLANS_WITH_PRICES } from "@/lib/stripe";
import { checkGracePeriod } from "@/lib/subscription";

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
        name: true,
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
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            billingName: true,
            billingEmail: true,
            vatNumber: true,
            billingAddress: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate trial status early (needed for early returns)
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

    // Get invoices if customer exists
    let invoices: any[] = [];
    let paymentMethods: any[] = [];

    if (user.stripeCustomerId) {
      try {
        // First verify the customer exists in Stripe
        try {
          await stripe.customers.retrieve(user.stripeCustomerId);
        } catch (customerError: any) {
          // If customer doesn't exist, clear the invalid ID from database
          if (
            customerError.type === "StripeInvalidRequestError" &&
            customerError.code === "resource_missing"
          ) {
            // Stripe customer not found - clear invalid ID from database
            // Note: Customer ID not logged for security reasons
            await db.user.update({
              where: { id: user.id },
              data: { stripeCustomerId: null },
            });
            // Skip fetching invoices/payment methods since customer doesn't exist
            return NextResponse.json({
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionPlan: user.subscriptionPlan,
                stripeCustomerId: null,
                stripeSubscriptionId: user.stripeSubscriptionId,
                trialStartDate: user.trialStartDate,
                trialEndDate: user.trialEndDate,
                subscriptionStartDate: user.subscriptionStartDate,
                subscriptionEndDate: user.subscriptionEndDate,
                subscriptionCancelAt: user.subscriptionCancelAt,
                subscriptionCanceled: user.subscriptionCanceled,
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
              company: user.company,
              invoices: [],
              paymentMethods: [],
            });
          }
          throw customerError;
        }

        // Get invoices
        const stripeInvoices = await stripe.invoices.list({
          customer: user.stripeCustomerId,
          limit: 12, // Last 12 invoices
        });

        invoices = stripeInvoices.data.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          created: new Date(invoice.created * 1000),
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          paidAt: invoice.status_transitions.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : null,
          invoicePdf: invoice.invoice_pdf,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
        }));

        // Get payment methods
        const stripePaymentMethods = await stripe.paymentMethods.list({
          customer: user.stripeCustomerId,
          type: "card",
        });

        paymentMethods = stripePaymentMethods.data.map((pm) => ({
          id: pm.id,
          type: pm.type,
          card: pm.card
            ? {
                brand: pm.card.brand,
                last4: pm.card.last4,
                expMonth: pm.card.exp_month,
                expYear: pm.card.exp_year,
              }
            : null,
        }));
      } catch (error) {
        // Error fetching Stripe data - continue without displaying sensitive info
        // Log only error type for debugging
        if (error instanceof Error) {
          console.error("Error fetching Stripe data:", error.message);
        }
        // Continue even if Stripe data fails
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        trialStartDate: user.trialStartDate,
        trialEndDate: user.trialEndDate,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        subscriptionCancelAt: user.subscriptionCancelAt,
        subscriptionCanceled: user.subscriptionCanceled,
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
      company: user.company,
      invoices,
      paymentMethods,
    });
  } catch (error) {
    // Log only error message to avoid leaking sensitive data
    if (error instanceof Error) {
      console.error("Error fetching billing data:", error.message);
    } else {
      console.error("Error fetching billing data: Unknown error");
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can update billing details
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        companyId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && user.role !== "SUPERUSER") {
      return NextResponse.json(
        { error: "Only admins can update billing details" },
        { status: 403 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: "User not associated with a company" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { billingName, billingEmail, vatNumber, billingAddress } = body;

    // Update company billing details
    const updatedCompany = await db.company.update({
      where: { id: user.companyId },
      data: {
        billingName,
        billingEmail,
        vatNumber,
        billingAddress,
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Error updating billing details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
