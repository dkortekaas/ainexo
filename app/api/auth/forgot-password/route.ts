import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateToken } from "@/lib/token";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

export async function POST(req: Request) {
  try {
    const { email, recaptchaToken } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Verify reCAPTCHA token (prevent password reset spam)
    const recaptchaResult = await verifyRecaptchaToken(
      recaptchaToken,
      "forgot_password",
      0.5 // Minimum score
    );

    if (!recaptchaResult.success) {
      console.warn(
        `[FORGOT_PASSWORD] reCAPTCHA failed for ${email}: ${recaptchaResult.error}`
      );
      return NextResponse.json(
        { error: "Bot detected. Please try again." },
        { status: 403 }
      );
    }

    // Find user by email
    const user = await db.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json(
        {
          message:
            "If an account exists, you will receive a password reset email",
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = generateToken();

    // Store reset token and expiry in database
    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      },
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken, {
        id: user.id,
        companyId: user.companyId,
      });
      console.log(
        `[FORGOT_PASSWORD] Password reset email sent successfully to ${email}`
      );
    } catch (emailError) {
      console.error(
        `[FORGOT_PASSWORD] Failed to send password reset email to ${email}:`,
        emailError
      );
      // Log the full error details
      if (emailError instanceof Error) {
        console.error(`[FORGOT_PASSWORD] Error details:`, {
          message: emailError.message,
          stack: emailError.stack,
        });
      }
      // Still return success to prevent email enumeration, but log the error
      // The user won't receive the email, but we don't reveal this to prevent attacks
    }

    return NextResponse.json(
      {
        message:
          "If an account exists, you will receive a password reset email",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot password:", error);

    // Check if error message contains database connection keywords
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "";

    // Check if it's a Prisma database connection error
    if (
      errorName === "PrismaClientInitializationError" ||
      errorMessage.includes("Can't reach database server") ||
      errorMessage.includes("P1001") ||
      errorMessage.includes("P1000") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("PrismaClient")
    ) {
      console.error(
        "[FORGOT_PASSWORD] Database connection error:",
        errorMessage
      );
      return NextResponse.json(
        {
          error:
            "Database connection failed. Please try again later or contact support if the problem persists.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
