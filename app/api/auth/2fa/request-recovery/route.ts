import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

/**
 * POST /api/auth/2fa/request-recovery
 *
 * Request an email recovery code when user has lost access to 2FA and backup codes.
 * This generates a one-time recovery code valid for 15 minutes.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is verplicht" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorEnabled: true,
        twoFactorVerified: true,
        companyId: true,
      },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({
        success: true,
        message:
          "Als dit email adres bij ons bekend is, wordt er een herstelcode verstuurd.",
      });
    }

    // Generate a secure 8-character recovery code
    const recoveryCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Hash the code before storing (for security)
    const hashedCode = crypto
      .createHash("sha256")
      .update(recoveryCode)
      .digest("hex");

    // Store recovery code with 15 minute expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedCode,
        resetTokenExpiry: expiresAt,
      },
    });

    // Send recovery email
    await sendEmail(
      user.email,
      "2FA Herstelcode - AI Chat",
      `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 2FA Herstelcode</h1>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hallo${user.name ? " " + user.name : ""},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                Je hebt een herstelcode aangevraagd voor je twee-factor authenticatie. Gebruik de onderstaande code om in te loggen:
              </p>

              <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">Jouw herstelcode:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #667eea; margin: 0; font-family: 'Courier New', monospace;">
                  ${recoveryCode}
                </p>
              </div>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  ⚠️ <strong>Belangrijk:</strong>
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #856404;">
                  <li>Deze code is <strong>15 minuten</strong> geldig</li>
                  <li>De code kan maar <strong>één keer</strong> worden gebruikt</li>
                  <li>Je wordt gevraagd om 2FA opnieuw in te stellen na het inloggen</li>
                </ul>
              </div>

              <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #721c24;">
                  🛡️ <strong>Veiligheidstip:</strong><br>
                  Als je deze code niet hebt aangevraagd, negeer dan deze email en neem contact op met support.
                  Je account blijft beveiligd met 2FA.
                </p>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Heb je vragen? Neem contact op met ons support team.
              </p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

              <p style="font-size: 12px; color: #999; text-align: center;">
                Deze email werd verstuurd door AI Chat<br>
                © ${new Date().getFullYear()} Alle rechten voorbehouden
              </p>
            </div>
          </body>
        </html>
      `,
      { id: user.id, companyId: user.companyId }
    );

    return NextResponse.json({
      success: true,
      message:
        "Een herstelcode is verstuurd naar je email adres. Controleer ook je spam folder.",
    });
  } catch (error) {
    console.error("[2FA_REQUEST_RECOVERY]", error);
    return NextResponse.json(
      {
        error: "Er is een fout opgetreden bij het versturen van de herstelcode",
      },
      { status: 500 }
    );
  }
}
