import { NextRequest, NextResponse } from "next/server";
import { requiresRecaptcha } from "@/lib/login-tracking";

/**
 * Check if reCAPTCHA is required for a given email
 * Used by login form to determine if reCAPTCHA should be shown
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if this email has too many failed login attempts
    const needsRecaptcha = requiresRecaptcha(email);

    return NextResponse.json({
      requiresRecaptcha: needsRecaptcha,
      threshold: 3, // Number of failures before requiring reCAPTCHA
    });
  } catch (error) {
    console.error("Error checking reCAPTCHA requirement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
