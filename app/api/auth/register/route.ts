// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { logger } from "@/lib/logger";
import { sendWelcomeEmail, sendEmailVerificationEmail } from "@/lib/email";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import { generateToken } from "@/lib/token";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(1).optional(),
  recaptchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const t = await getTranslations();

  try {
    const body = await req.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return NextResponse.json(
        {
          message: t("error.invalidInput"),
          errors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, companyName, recaptchaToken } =
      validationResult.data;

    // Verify reCAPTCHA token (bot protection)
    const recaptchaResult = await verifyRecaptchaToken(
      recaptchaToken,
      "register",
      0.5 // Minimum score for registration
    );

    if (!recaptchaResult.success) {
      logger.warn(
        `[REGISTER_POST] reCAPTCHA failed for ${email}: ${recaptchaResult.error}`
      );
      return NextResponse.json(
        {
          message: t("error.botDetected"),
          error: recaptchaResult.error,
        },
        { status: 403 }
      );
    }

    // Check if user already exists in the same company
    const existingUser = await db.user.findFirst({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: t("error.userExistsInvite") },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Use provided company name, or fallback to default if not provided
    const finalCompanyName =
      companyName || (name ? `${name}'s Company` : `${email}'s Company`);
    const company = await db.company.create({
      data: {
        name: finalCompanyName,
        description: "Default company created at registration",
      },
    });
    const companyId = company.id;

    // Create new user (email NOT verified yet)
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Registrant becomes ADMIN of their own company
        role: "ADMIN",
        isActive: true,
        companyId: companyId,
        emailVerified: null, // Will be set when user verifies email
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscriptionStatus: true,
        trialStartDate: true,
        trialEndDate: true,
        isActive: true,
        role: true,
        companyId: true,
      },
    });

    // Initialize trial subscription using CRUD function
    const { initializeTrialSubscription } =
      await import("@/lib/subscription-crud");
    await initializeTrialSubscription(user.id, 30);

    // Generate email verification token
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

    // Send email verification email (don't fail registration if email fails)
    try {
      await sendEmailVerificationEmail(email, verificationToken, {
        id: user.id,
        companyId: user.companyId,
        name: user.name,
      });
      logger.info(
        `[REGISTER_POST] Verification email sent to ${email.substring(0, 3)}***`
      );
    } catch (emailError) {
      // Log error but don't fail the registration
      logger.error(
        `[REGISTER_POST] Failed to send verification email: ${emailError}`
      );
    }

    return NextResponse.json(
      {
        message: t("success.accountCreated"),
        user,
        emailVerificationSent: true,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(`[REGISTER_POST] Unexpected error: ${error}`);
    return NextResponse.json({ message: t("error.generic") }, { status: 500 });
  }
}
