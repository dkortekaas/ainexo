import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * User Consent Management Endpoint
 *
 * Manages user consent for privacy policy, terms of service, and marketing emails.
 *
 * POST /api/users/[id]/consent
 *
 * Body:
 * {
 *   "privacyPolicy": { "accepted": true, "version": "1.0" },
 *   "terms": { "accepted": true, "version": "1.0" },
 *   "marketingEmails": true
 * }
 *
 * GET /api/users/[id]/consent
 * Returns current consent status
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = id;

    // Authorization: Users can only view their own consent
    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await db.$queryRawUnsafe<any[]>(
      `SELECT 
         "privacyPolicyAccepted",
         "privacyPolicyAcceptedAt",
         "privacyPolicyVersion",
         "termsAccepted",
         "termsAcceptedAt",
         "termsVersion",
         "marketingEmailsConsent",
         "marketingEmailsConsentAt"
       FROM users WHERE id = $1`,
      userId
    );
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      consent: {
        privacyPolicy: {
          accepted: user.privacyPolicyAccepted,
          acceptedAt: user.privacyPolicyAcceptedAt,
          version: user.privacyPolicyVersion,
        },
        terms: {
          accepted: user.termsAccepted,
          acceptedAt: user.termsAcceptedAt,
          version: user.termsVersion,
        },
        marketingEmails: {
          consented: user.marketingEmailsConsent,
          consentedAt: user.marketingEmailsConsentAt,
        },
      },
    });
  } catch (error) {
    console.error("Consent GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consent" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = id;

    // Authorization: Users can only update their own consent
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const now = new Date();

    const updateData: any = {};

    // Privacy Policy
    if (body.privacyPolicy) {
      updateData.privacyPolicyAccepted = body.privacyPolicy.accepted;
      if (body.privacyPolicy.accepted) {
        updateData.privacyPolicyAcceptedAt = now;
        updateData.privacyPolicyVersion =
          body.privacyPolicy.version || "unknown";
      }
    }

    // Terms of Service
    if (body.terms) {
      updateData.termsAccepted = body.terms.accepted;
      if (body.terms.accepted) {
        updateData.termsAcceptedAt = now;
        updateData.termsVersion = body.terms.version || "unknown";
      }
    }

    // Marketing Emails
    if (typeof body.marketingEmails === "boolean") {
      updateData.marketingEmailsConsent = body.marketingEmails;
      if (body.marketingEmails) {
        updateData.marketingEmailsConsentAt = now;
      } else {
        updateData.marketingEmailsConsentAt = null;
      }
    }

    await db.$executeRawUnsafe(
      `UPDATE users SET 
         "privacyPolicyAccepted" = COALESCE($2, "privacyPolicyAccepted"),
         "privacyPolicyAcceptedAt" = COALESCE($3, "privacyPolicyAcceptedAt"),
         "privacyPolicyVersion" = COALESCE($4, "privacyPolicyVersion"),
         "termsAccepted" = COALESCE($5, "termsAccepted"),
         "termsAcceptedAt" = COALESCE($6, "termsAcceptedAt"),
         "termsVersion" = COALESCE($7, "termsVersion"),
         "marketingEmailsConsent" = COALESCE($8, "marketingEmailsConsent"),
         "marketingEmailsConsentAt" = COALESCE($9, "marketingEmailsConsentAt")
       WHERE id = $1`,
      userId,
      updateData.privacyPolicyAccepted ?? null,
      updateData.privacyPolicyAcceptedAt ?? null,
      updateData.privacyPolicyVersion ?? null,
      updateData.termsAccepted ?? null,
      updateData.termsAcceptedAt ?? null,
      updateData.termsVersion ?? null,
      updateData.marketingEmailsConsent ?? null,
      updateData.marketingEmailsConsentAt ?? null
    );

    const [user] = await db.$queryRawUnsafe<any[]>(
      `SELECT 
         "privacyPolicyAccepted",
         "privacyPolicyAcceptedAt",
         "privacyPolicyVersion",
         "termsAccepted",
         "termsAcceptedAt",
         "termsVersion",
         "marketingEmailsConsent",
         "marketingEmailsConsentAt"
       FROM users WHERE id = $1`,
      userId
    );

    // Log consent update
    await db.systemLog.create({
      data: {
        level: "INFO",
        message: "User consent updated",
        context: {
          userId,
          changes: Object.keys(updateData),
        },
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      consent: {
        privacyPolicy: {
          accepted: user.privacyPolicyAccepted,
          acceptedAt: user.privacyPolicyAcceptedAt,
          version: user.privacyPolicyVersion,
        },
        terms: {
          accepted: user.termsAccepted,
          acceptedAt: user.termsAcceptedAt,
          version: user.termsVersion,
        },
        marketingEmails: {
          consented: user.marketingEmailsConsent,
          consentedAt: user.marketingEmailsConsentAt,
        },
      },
    });
  } catch (error) {
    console.error("Consent POST error:", error);
    return NextResponse.json(
      { error: "Failed to update consent" },
      { status: 500 }
    );
  }
}
