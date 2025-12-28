import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

// Schema voor query parameters
const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  status: z.string().optional().nullable(),
  sortBy: z.string().optional().default("created"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Check if user is a superuser
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "SUPERUSER") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    });

    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    // Build Stripe query parameters
    const stripeParams: any = {
      limit: limit,
      expand: ["data.customer", "data.items.data.price.product"],
    };

    if (query.status && query.status !== "all") {
      stripeParams.status = query.status;
    }

    // Handle sorting
    if (query.sortBy === "created") {
      stripeParams.created = query.sortOrder === "asc" ? { gte: 0 } : undefined;
    }

    // Get subscriptions from Stripe
    const stripeSubscriptions = await stripe.subscriptions.list(stripeParams);

    // Get total count (approximate)
    const totalCount = stripeSubscriptions.data.length;

    // Transform Stripe data to our format
    const subscriptions = await Promise.all(
      stripeSubscriptions.data.map(async (subscription) => {
        // Get user from our database
        const dbUser = await db.user.findFirst({
          where: {
            OR: [
              { stripeCustomerId: subscription.customer as string },
              { stripeSubscriptionId: subscription.id },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        return {
          id: subscription.id,
          customerId: subscription.customer as string,
          status: subscription.status,
          currentPeriodStart: new Date(
            (subscription as any).current_period_start * 1000
          ).toISOString(),
          currentPeriodEnd: new Date(
            (subscription as any).current_period_end * 1000
          ).toISOString(),
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
          canceledAt: (subscription as any).canceled_at
            ? new Date((subscription as any).canceled_at * 1000).toISOString()
            : null,
          created: new Date(subscription.created * 1000).toISOString(),
          plan:
            typeof subscription.items.data[0]?.price?.product === "object" &&
            subscription.items.data[0]?.price?.product &&
            "name" in subscription.items.data[0].price.product
              ? subscription.items.data[0].price.product.name
              : "Unknown",
          price: subscription.items.data[0]?.price?.unit_amount || 0,
          currency: subscription.items.data[0]?.price?.currency || "eur",
          interval:
            subscription.items.data[0]?.price?.recurring?.interval || "month",
          user: dbUser,
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      subscriptions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("[ADMIN_SUBSCRIPTIONS_GET]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
