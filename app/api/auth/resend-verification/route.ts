import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendEmailVerificationEmail } from "@/lib/email";
import { generateToken } from "@/lib/token";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      // Don't reveal if user exists (prevent email enumeration)
      return NextResponse.json(
        {
          message: "If an account exists with this email, a verification email will be sent.",
        },
        { status: 200 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          message: "Email is already verified",
          alreadyVerified: true,
        },
        { status: 200 }
      );
    }

    // Delete any existing verification tokens for this email
    await db.verificationToken.deleteMany({
      where: {
        identifier: email,
      },
    });

    // Generate new verification token
    const verificationToken = generateToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token in database
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: tokenExpiry,
      },
    });

    // Send email verification email
    try {
      await sendEmailVerificationEmail(email, verificationToken, {
        id: user.id,
        companyId: user.companyId,
        name: user.name,
      });
      logger.info(`[RESEND_VERIFICATION] Verification email resent to ${email.substring(0, 3)}***`);
    } catch (emailError) {
      logger.error(`[RESEND_VERIFICATION] Failed to send verification email: ${emailError}`);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Verification email sent successfully",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`[RESEND_VERIFICATION] Unexpected error: ${error}`);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
