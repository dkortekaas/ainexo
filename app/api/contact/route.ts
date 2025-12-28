import { NextRequest, NextResponse } from "next/server";
import { sendContactFormEmail } from "@/lib/email";
import { z } from "zod";
import { checkRateLimit } from "@/lib/redis-rate-limiter";
import { logger } from "@/lib/logger";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(1, "Company is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per hour per IP
    const identifier = request.headers.get("x-forwarded-for") ||
                      request.headers.get("x-real-ip") ||
                      "unknown";

    const rateLimit = await checkRateLimit(
      `contact:${identifier}`,
      5, // 5 requests
      3600000 // per hour (1 hour = 3600000ms)
    );

    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded for contact form", {
        identifier,
        retryAfter: rateLimit.retryAfter,
      });

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = contactFormSchema.parse(body);

    // Send the email
    await sendContactFormEmail(validatedData);

    return NextResponse.json(
      { message: "Contact form submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error processing contact form", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}
