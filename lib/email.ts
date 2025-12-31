import config from "@/config";
import { getTranslations } from "next-intl/server";
import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { join } from "path";
import { existsSync } from "fs";
import { readFileSync } from "fs";

// Lazy initialization of Resend client to avoid build-time errors
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing Resend API key (RESEND_API_KEY)");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Get the verified FROM email address for Resend
function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || config.email;
}

// Helper function to send email via Resend
async function sendEmailViaResend(
  to: string | string[],
  subject: string,
  html: string,
  replyTo?: string
) {
  const client = getResendClient();
  const fromEmail = getFromEmail();
  const from = `${config.appTitle} <${fromEmail}>`;
  const toAddresses = Array.isArray(to) ? to : [to];
  const attachments = getEmailAttachments();

  // Convert attachments to Resend format
  // For inline images with CID, convert to base64 for better email client compatibility
  const resendAttachments = attachments.map((att) => {
    const fileContent = readFileSync(att.path);
    // Convert Buffer to base64 string for inline images
    // This ensures better compatibility across email clients
    const base64Content = fileContent.toString("base64");
    return {
      filename: att.filename,
      content: base64Content,
      cid: att.cid, // CID makes it an inline attachment (not a regular attachment)
    };
  });

  try {
    const result = await client.emails.send({
      from,
      to: toAddresses,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ""), // Text fallback
      ...(replyTo && { reply_to: replyTo }),
      ...(resendAttachments.length > 0 && { attachments: resendAttachments }),
    });

    return result;
  } catch (error) {
    logger.error("[EMAIL] Failed to send email via Resend", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

export async function createEmailTemplate(content: string) {
  const t = await getTranslations();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="display: flex; align-items: center; margin-bottom: 30px;">
          <img src="cid:logo" alt="Ainexo Logo" style="width: 80px; height: auto; margin-right: 15px;" />
          <h1 style="color: #333; margin: 0; font-size: 24px;">${
            config.appTitle
          }</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${content}
        </div>
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9em;">
          <p style="margin: 10px 0;">© ${new Date().getFullYear()} ${
            config.appTitle
          }. ${t("mail.rights")}.</p>
          <p style="margin: 10px 0;">
            <a href="${
              process.env.NEXT_PUBLIC_APP_URL
            }" style="color: #589bff; text-decoration: none;">${
              process.env.NEXT_PUBLIC_APP_URL
            }</a>
          </p>
          <div style="margin-top: 15px;">
            <a href="${
              process.env.NEXT_PUBLIC_LINKEDIN_URL
            }" style="display: inline-block; margin: 0 10px;">
              <img src="cid:linkedin" alt="LinkedIn" style="width: 24px; height: 24px; display: block;" />
            </a>
            <a href="${
              process.env.NEXT_PUBLIC_TWITTER_URL
            }" style="display: inline-block; margin: 0 10px;">
              <img src="cid:twitter" alt="Twitter" style="width: 24px; height: 24px; display: block;" />
            </a>
            <a href="${
              process.env.NEXT_PUBLIC_INSTAGRAM_URL
            }" style="display: inline-block; margin: 0 10px;">
              <img src="cid:instagram" alt="Instagram" style="width: 24px; height: 24px; display: block;" />
            </a>
            <a href="${
              process.env.NEXT_PUBLIC_FACEBOOK_URL
            }" style="display: inline-block; margin: 0 10px;">
              <img src="cid:facebook" alt="Facebook" style="width: 24px; height: 24px; display: block;" />
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendWelcomeEmail(
  email: string,
  user: { id: string; companyId?: string | null | undefined }
) {
  const t = await getTranslations("mail.welcome");
  const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
  const faqLink = `${process.env.NEXT_PUBLIC_APP_URL}/faq`;
  const manualLink = `${process.env.NEXT_PUBLIC_APP_URL}/manual`;

  // Get user and company info
  const userInfo = await db.user.findUnique({
    where: { id: user.id },
  });

  const isAdmin = userInfo?.role === "ADMIN";

  try {
    await sendEmailViaResend(
      email,
      t("title"),
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">${t("title")}</h1>
        <p style="color: #666; line-height: 1.6;">${t("description")}</p>
        
        <h2 style="color: #333; margin: 30px 0 15px;">${t("whatYouCanDo")}</h2>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("features.submit")}</li>
          <li style="margin-bottom: 10px;">${t("features.overview")}</li>
          <li style="margin-bottom: 10px;">${t("features.approval")}</li>
          <li style="margin-bottom: 10px;">${t("features.export")}</li>
        </ul>

        <h2 style="color: #333; margin: 30px 0 15px;">${t("tips.title")}</h2>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("tips.login", {
            loginLink,
          })}</li>
          <li style="margin-bottom: 10px;">${t("tips.profile")}</li>
          <li style="margin-bottom: 10px;">${t("tips.firstDeclaration")}</li>
          <li style="margin-bottom: 10px;">${t("tips.invite")}</li>
        </ul>

        ${
          isAdmin
            ? `
        <h2 style="color: #333; margin: 30px 0 15px;">${t(
          "companyInfo.title"
        )}</h2>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("companyInfo.admin.invite")}</li>
          <li style="margin-bottom: 10px;">${t(
            "companyInfo.admin.settings"
          )}</li>
          <li style="margin-bottom: 10px;">${t(
            "companyInfo.admin.approve"
          )}</li>
          <li style="margin-bottom: 10px;">${t(
            "companyInfo.admin.reports"
          )}</li>
        </ul>
        `
            : ""
        }

        <h2 style="color: #333; margin: 30px 0 15px;">${t("help.title")}</h2>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("help.faq", { faqLink })}</li>
          <li style="margin-bottom: 10px;">${t("help.manual", {
            manualLink,
          })}</li>
          <li style="margin-bottom: 10px;">${t("help.support")}</li>
          <li style="margin-bottom: 10px;">${t("help.phone")}</li>
        </ul>

        <h2 style="color: #333; margin: 30px 0 15px;">${t(
          "nextSteps.title"
        )}</h2>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("nextSteps.confirmEmail")}</li>
          <li style="margin-bottom: 10px;">${t("nextSteps.setup2FA")}</li>
          <li style="margin-bottom: 10px;">${t("nextSteps.uploadReceipt")}</li>
        </ul>

        <p style="color: #666; line-height: 1.6; margin: 30px 0;">${t(
          "signature"
        )}</p>

        <div style="margin: 30px 0;">
          <p style="color: #666; line-height: 1.6;">${t("social.title")}</p>
          <div style="margin-top: 15px;">
            <a href="${
              process.env.NEXT_PUBLIC_LINKEDIN_URL
            }" style="color: #666; text-decoration: none; margin-right: 15px;">${t(
              "social.linkedin"
            )}</a>
            <a href="${
              process.env.NEXT_PUBLIC_TWITTER_URL
            }" style="color: #666; text-decoration: none;">${t(
              "social.twitter"
            )}</a>
          </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 0.9em; line-height: 1.6;">${t(
            "footer.sentTo",
            { email }
          )}</p>
          <p style="color: #999; font-size: 0.9em; line-height: 1.6;">${t(
            "footer.unsubscribe"
          )}</p>
          <p style="color: #999; font-size: 0.9em; line-height: 1.6; white-space: pre-line;">${t(
            "footer.address"
          )}</p>
        </div>
      `)
    );
  } catch (error) {
    logger.error("Failed to send welcome email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId: user.id,
      companyId: user.companyId,
    });
    throw error;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  user: { id: string; companyId?: string | null | undefined }
) {
  const t = await getTranslations();
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  try {
    logger.debug("Attempting to send password reset email", {
      email: email.substring(0, 3) + "***",
      resetLink: resetLink.substring(0, 50) + "...",
    });

    const result = await sendEmailViaResend(
      email,
      t("mail.resetPassword.title"),
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">${t(
          "mail.resetPassword.title"
        )}</h1>
        <p style="color: #666; line-height: 1.6;">${t(
          "mail.resetPassword.description"
        )}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #589bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">${t(
            "mail.resetPassword.link"
          )}</a>
        </div>
        <p style="color: #666; line-height: 1.6;">${t(
          "mail.resetPassword.ignore"
        )}</p>
        <p style="color: #666; line-height: 1.6;">${t(
          "mail.resetPassword.expiration"
        )}</p>
      `)
    );

    logger.debug("Password reset email sent successfully", {
      email: email.substring(0, 3) + "***",
      resultId: typeof result === 'object' && result && 'id' in result ? result.id : undefined,
    });
  } catch (error) {
    logger.error("Failed to send password reset email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
        email,
        resetLink,
      },
      userId: user.id,
      companyId: user.companyId,
    });
    throw error;
  }
}

export async function sendEmailVerificationEmail(
  email: string,
  verificationToken: string,
  user: {
    id: string;
    companyId?: string | null | undefined;
    name?: string | null;
  }
) {
  const t = await getTranslations();
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

  try {
    await sendEmailViaResend(
      email,
      t("mail.verifyEmail.title") || "Verify your email address",
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">${
          t("mail.verifyEmail.title") || "Verify Your Email Address"
        }</h1>
        <p style="color: #666; line-height: 1.6;">
          ${t("mail.verifyEmail.greeting") || "Hi"} ${user.name || "there"},
        </p>
        <p style="color: #666; line-height: 1.6;">
          ${
            t("mail.verifyEmail.description") ||
            "Thank you for signing up! Please verify your email address by clicking the button below:"
          }
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            ${t("mail.verifyEmail.button") || "Verify Email Address"}
          </a>
        </div>
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          ${
            t("mail.verifyEmail.alternative") ||
            "Or copy and paste this link into your browser:"
          }
        </p>
        <p style="color: #589bff; line-height: 1.6; font-size: 14px; word-break: break-all;">
          ${verificationLink}
        </p>
        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 30px 0;">
          <p style="color: #92400E; margin: 0; line-height: 1.6;">
            <strong>${
              t("mail.verifyEmail.important") || "Important:"
            }</strong><br/>
            ${
              t("mail.verifyEmail.expiration") ||
              "This verification link will expire in 24 hours. If you didn't create an account, please ignore this email."
            }
          </p>
        </div>
        <p style="color: #666; line-height: 1.6;">
          ${
            t("mail.verifyEmail.support") ||
            "If you have any questions, please contact our support team."
          }
        </p>
      `)
    );

    logger.info("Email verification email sent", {
      context: {
        userId: user.id,
        email: email.substring(0, 3) + "***",
      },
      userId: user.id,
      companyId: user.companyId,
    });
  } catch (error) {
    logger.error("Failed to send email verification email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId: user.id,
      companyId: user.companyId,
    });
    throw error;
  }
}

export async function sendInvitationEmail(
  email: string,
  token: string,
  companyName: string,
  role: string,
  inviter: { name: string; email: string; role: string }
) {
  const t = await getTranslations("mail.invitation");
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  try {
    const result = await sendEmailViaResend(
      email,
      t("subject", { companyName }),
      await createEmailTemplate(`
        <p style="color: #666; line-height: 1.6;">${t("greeting")}</p>
        <p style="color: #666; line-height: 1.6;">${t("intro", {
          companyName,
        })}</p>
        <p style="color: #666; line-height: 1.6;">${t("inviter", {
          inviterName: inviter.name,
        })}</p>

        <h2 style="color: #333; margin: 30px 0 15px;">${t("role.title", {
          companyName,
        })}</h2>
        <p style="color: #666; line-height: 1.6;">${t("role.invitedAs", {
          role,
        })}</p>

        ${
          role === "USER"
            ? `
        <h3 style="color: #333; margin: 20px 0 10px;">${t(
          "role.user.title"
        )}</h3>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("role.user.features.0")}</li>
          <li style="margin-bottom: 10px;">${t("role.user.features.1")}</li>
          <li style="margin-bottom: 10px;">${t("role.user.features.2")}</li>
          <li style="margin-bottom: 10px;">${t("role.user.features.3")}</li>
        </ul>
        `
            : ""
        }

        ${
          role === "APPROVER"
            ? `
        <h3 style="color: #333; margin: 20px 0 10px;">${t(
          "role.approver.title"
        )}</h3>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("role.approver.features.0")}</li>
          <li style="margin-bottom: 10px;">${t("role.approver.features.1")}</li>
          <li style="margin-bottom: 10px;">${t("role.approver.features.2")}</li>
          <li style="margin-bottom: 10px;">${t("role.approver.features.3")}</li>
        </ul>
        `
            : ""
        }

        ${
          role === "ADMIN"
            ? `
        <h3 style="color: #333; margin: 20px 0 10px;">${t(
          "role.admin.title"
        )}</h3>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("role.admin.features.0")}</li>
          <li style="margin-bottom: 10px;">${t("role.admin.features.1")}</li>
          <li style="margin-bottom: 10px;">${t("role.admin.features.2")}</li>
          <li style="margin-bottom: 10px;">${t("role.admin.features.3")}</li>
        </ul>
        `
            : ""
        }

        ${
          role === "FINANCE"
            ? `
        <h3 style="color: #333; margin: 20px 0 10px;">${t(
          "role.finance.title"
        )}</h3>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("role.finance.features.0")}</li>
          <li style="margin-bottom: 10px;">${t("role.finance.features.1")}</li>
          <li style="margin-bottom: 10px;">${t("role.finance.features.2")}</li>
          <li style="margin-bottom: 10px;">${t("role.finance.features.3")}</li>
        </ul>
        `
            : ""
        }

        <h2 style="color: #333; margin: 30px 0 15px;">${t(
          "whatIsDeclair.title"
        )}</h2>
        <p style="color: #666; line-height: 1.6;">${t(
          "whatIsDeclair.description"
        )}</p>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("whatIsDeclair.features.0")}</li>
          <li style="margin-bottom: 10px;">${t("whatIsDeclair.features.1")}</li>
          <li style="margin-bottom: 10px;">${t("whatIsDeclair.features.2")}</li>
          <li style="margin-bottom: 10px;">${t("whatIsDeclair.features.3")}</li>
        </ul>

        <h2 style="color: #333; margin: 30px 0 15px;">${t(
          "activation.title"
        )}</h2>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("activation.steps.0")}</li>
          <li style="margin-bottom: 10px;">${t("activation.steps.1")}</li>
          <li style="margin-bottom: 10px;">${t("activation.steps.2")}</li>
        </ul>

        <h2 style="color: #333; margin: 30px 0 15px;">${t(
          "important.title"
        )}</h2>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("important.items.0")}</li>
          <li style="margin-bottom: 10px;">${t("important.items.1", {
            companyName,
          })}</li>
          <li style="margin-bottom: 10px;">${t("important.items.2")}</li>
          <li style="margin-bottom: 10px;">${t("important.items.3", {
            inviterName: inviter.name,
          })}</li>
        </ul>

        <h2 style="color: #333; margin: 30px 0 15px;">${t(
          "gettingStarted.title"
        )}</h2>
        
        <h3 style="color: #333; margin: 20px 0 10px;">${t(
          "gettingStarted.beginners.title"
        )}</h3>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t(
            "gettingStarted.beginners.items.0"
          )}</li>
          <li style="margin-bottom: 10px;">${t(
            "gettingStarted.beginners.items.1"
          )}</li>
          <li style="margin-bottom: 10px;">${t(
            "gettingStarted.beginners.items.2"
          )}</li>
        </ul>

        <h3 style="color: #333; margin: 20px 0 10px;">${t(
          "gettingStarted.experienced.title"
        )}</h3>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t(
            "gettingStarted.experienced.items.0"
          )}</li>
          <li style="margin-bottom: 10px;">${t(
            "gettingStarted.experienced.items.1"
          )}</li>
          <li style="margin-bottom: 10px;">${t(
            "gettingStarted.experienced.items.2"
          )}</li>
        </ul>

        <h2 style="color: #333; margin: 30px 0 15px;">${t("support.title")}</h2>
        
        <h3 style="color: #333; margin: 20px 0 10px;">${t(
          "support.team.title"
        )}</h3>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("support.team.email")}</li>
          <!--<li style="margin-bottom: 10px;">${t("support.team.phone")}</li>
          <li style="margin-bottom: 10px;">${t("support.team.chat")}</li> -->
        </ul>

        <h3 style="color: #333; margin: 20px 0 10px;">${t(
          "support.contact.title"
        )}</h3>
        <p style="color: #666; line-height: 1.6; white-space: pre-line;">${t(
          "support.contact.info",
          {
            inviterName: inviter.name,
            inviterEmail: inviter.email,
            inviterRole: inviter.role,
            companyName,
          }
        )}</p>

        <h2 style="color: #333; margin: 30px 0 15px;">${t(
          "security.title"
        )}</h2>
        <p style="color: #666; line-height: 1.6;">${t(
          "security.description"
        )}</p>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">${t("security.features.1")}</li>
          <li style="margin-bottom: 10px;">${t("security.features.2")}</li>
          <li style="margin-bottom: 10px;">${t("security.features.3")}</li>
        </ul>

        <div style="margin: 30px 0;">
          <h2 style="color: #333; margin-bottom: 15px;">${t(
            "closing.welcome"
          )}</h2>
          <p style="color: #666; line-height: 1.6;">${t("closing.message")}</p>
          <p style="color: #666; line-height: 1.6; white-space: pre-line;">${t(
            "closing.signature",
            {
              inviterName: inviter.name,
              companyName,
            }
          )}</p>
          <p style="color: #666; line-height: 1.6;">${t("closing.ps", {
            inviterEmail: inviter.email,
          })}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 0.9em; line-height: 1.6;">${t(
            "footer.sentTo",
            {
              inviterName: inviter.name,
              companyName,
            }
          )}</p>
          <p style="color: #999; font-size: 0.9em; line-height: 1.6;">${t(
            "footer.unsubscribe"
          )}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" style="background-color: #589bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">${t(
            "createAccountLink"
          )}</a>
        </div>
      `)
    );

    return result;
  } catch (error) {
    logger.error("Failed to send invitation email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

export async function sendDeclarationStatusEmail(
  email: string,
  declarationTitle: string,
  status: "APPROVED" | "REJECTED",
  declarationId: string,
  user: { id: string; companyId?: string | null | undefined },
  declaration: { id: string },
  comment?: string
) {
  const t = await getTranslations("mail.declarationStatus");
  const statusMessages = {
    APPROVED: t("status.approved"),
    REJECTED: t("status.rejected"),
  };
  const declarationLink = `${process.env.NEXT_PUBLIC_APP_URL}/declarations/${declarationId}`;

  try {
    await sendEmailViaResend(
      email,
      `${t("declaration")} ${statusMessages[status]}`,
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">${t("declaration")} ${
          statusMessages[status]
        }</h1>
        <p style="color: #666; line-height: 1.6;">${t(
          "yourDeclaration"
        )} "${declarationTitle}" ${t("hasBeen")} ${statusMessages[
          status
        ].toLowerCase()}.</p>
        ${
          comment
            ? `<p style="color: #666; line-height: 1.6;">${t(
                "comment"
              )}: ${comment}</p>`
            : ""
        }
        <p style="color: #666; line-height: 1.6;">${t("viewDeclarationIn")} ${
          config.appTitle
        }.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${declarationLink}" style="background-color: #589bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">${t(
            "viewDeclaration"
          )}</a>
        </div>
      `)
    );
  } catch (error) {
    logger.error("Failed to send declaration status email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId: user.id,
      companyId: user.companyId,
      declarationId: declaration.id,
    });
    throw error;
  }
}

export async function sendDeclarationCreatedEmail(
  email: string,
  declarationTitle: string,
  declarationId: string,
  user: { id: string; companyId?: string | null | undefined },
  declaration: { id: string }
) {
  const t = await getTranslations("mail.declarationCreated");
  const declarationLink = `${process.env.NEXT_PUBLIC_APP_URL}/declarations/${declarationId}`;

  try {
    await sendEmailViaResend(
      email,
      t("title"),
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">${t("title")}</h1>
        <p style="color: #666; line-height: 1.6;">${t("description", {
          declarationTitle,
        })}</p>
        <p style="color: #666; line-height: 1.6;">${t("processing")}</p>
        <p style="color: #666; line-height: 1.6;">${t("viewDeclaration")}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${declarationLink}" style="background-color: #589bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">${t(
            "viewDeclarationLink"
          )}</a>
        </div>
      `)
    );
  } catch (error) {
    logger.error("Failed to send declaration created email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId: user.id,
      companyId: user.companyId,
      declarationId: declaration.id,
    });
    throw error;
  }
}

export async function sendDeclarationToApproveEmail(
  email: string,
  declarationTitle: string,
  declarationId: string,
  user: { id: string; companyId?: string | null | undefined },
  declaration: { id: string }
) {
  const t = await getTranslations("mail.declarationToApprove");
  const declarationLink = `${process.env.NEXT_PUBLIC_APP_URL}/declarations/${declarationId}`;

  try {
    await sendEmailViaResend(
      email,
      t("title"),
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">${t("title")}</h1>
        <p style="color: #666; line-height: 1.6;">${t("description", {
          declarationTitle,
        })}</p>
        <p style="color: #666; line-height: 1.6;">${t("processing")}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${declarationLink}" style="background-color: #589bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">${t(
            "viewDeclarationLink"
          )}</a>
        </div>
      `)
    );
  } catch (error) {
    logger.error("Failed to send declaration created email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId: user.id,
      companyId: user.companyId,
      declarationId: declaration.id,
    });
    throw error;
  }
}

export async function sendDeclarationDeletedEmail(
  email: string,
  declarationTitle: string,
  user: { id: string; companyId?: string | null | undefined },
  declaration: { id: string }
) {
  const t = await getTranslations();

  try {
    await sendEmailViaResend(
      email,
      t("mail.declarationDeleted.title"),
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">${t(
          "mail.declarationDeleted.title"
        )}</h1>
        <p style="color: #666; line-height: 1.6;">${t(
          "mail.declarationDeleted.description",
          { declarationTitle }
        )}</p>
        <p style="color: #666; line-height: 1.6;">${t(
          "mail.declarationDeleted.contact"
        )}</p>
      `)
    );
  } catch (error) {
    logger.error("Failed to send declaration deleted email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId: user.id,
      companyId: user.companyId,
      declarationId: declaration.id,
    });
    throw error;
  }
}

/**
 * Subscription Expiration Notification Emails
 */

export async function sendSubscriptionExpiringEmail(
  email: string,
  user: {
    id: string;
    name: string | null;
    subscriptionStatus: string;
    trialEndDate?: Date | null;
    subscriptionEndDate?: Date | null;
  },
  daysRemaining: number
) {
  const isTrial = user.subscriptionStatus === "TRIAL";
  const subscriptionType = isTrial ? "trial" : "abonnement";
  const upgradeLink = `${process.env.NEXT_PUBLIC_APP_URL}/account?tab=subscription`;

  const subject =
    daysRemaining === 0
      ? `Je ${subscriptionType} verloopt vandaag!`
      : daysRemaining === 1
        ? `Je ${subscriptionType} verloopt morgen!`
        : `Je ${subscriptionType} verloopt over ${daysRemaining} dagen`;

  try {
    await sendEmailViaResend(
      email,
      subject,
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">
          ${
            daysRemaining === 0
              ? "⏰ Laatste dag van je " + subscriptionType
              : "📅 " + subject
          }
        </h1>

        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Beste ${user.name || "gebruiker"},
        </p>

        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          ${
            daysRemaining === 0
              ? `Je ${subscriptionType} verloopt <strong>vandaag</strong>.`
              : daysRemaining === 1
                ? `Je ${subscriptionType} verloopt <strong>morgen</strong>.`
                : `Je ${subscriptionType} verloopt over <strong>${daysRemaining} dagen</strong>.`
          }
        </p>

        ${
          isTrial
            ? `
        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
          <p style="color: #92400E; margin: 0; line-height: 1.6;">
            <strong>Trial periode bijna voorbij</strong><br/>
            Na ${
              daysRemaining === 0
                ? "vandaag"
                : daysRemaining === 1
                  ? "morgen"
                  : daysRemaining + " dagen"
            } kun je geen premium features meer gebruiken:
          </p>
          <ul style="color: #92400E; margin: 10px 0; padding-left: 20px;">
            <li>AI Assistenten bewerken</li>
            <li>Knowledge base beheren</li>
            <li>Chatbot widget op je website</li>
          </ul>
        </div>
        `
            : `
        <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
          <p style="color: #991B1B; margin: 0; line-height: 1.6;">
            <strong>Abonnement verloopt binnenkort</strong><br/>
            Na ${
              daysRemaining === 0
                ? "vandaag"
                : daysRemaining === 1
                  ? "morgen"
                  : daysRemaining + " dagen"
            } worden je premium features uitgeschakeld.
          </p>
        </div>
        `
        }

        <h2 style="color: #333; margin: 30px 0 15px;">Wat gebeurt er na expiratie?</h2>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">❌ Je kunt geen assistenten meer bewerken</li>
          <li style="margin-bottom: 10px;">❌ Je knowledge base wordt niet meer bijgewerkt</li>
          <li style="margin-bottom: 10px;">❌ Je chatbot widget stopt met werken op je website</li>
          <li style="margin-bottom: 10px;">❌ Bezoekers kunnen geen vragen meer stellen</li>
        </ul>

        ${
          isTrial
            ? `
        <h2 style="color: #333; margin: 30px 0 15px;">🎯 Upgrade nu en krijg:</h2>
        <ul style="color: #666; line-height: 1.6; list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">✅ Onbeperkt assistenten</li>
          <li style="margin-bottom: 10px;">✅ Onbeperkte knowledge base items</li>
          <li style="margin-bottom: 10px;">✅ 24/7 actieve chatbot widget</li>
          <li style="margin-bottom: 10px;">✅ Premium support</li>
          <li style="margin-bottom: 10px;">✅ Uitgebreide analytics</li>
          <li style="margin-bottom: 10px;">✅ Aangepaste branding</li>
        </ul>
        `
            : `
        <h2 style="color: #333; margin: 30px 0 15px;">🔄 Verlengen is eenvoudig</h2>
        <p style="color: #666; line-height: 1.6;">
          Behoud toegang tot alle features door je abonnement te verlengen.
        </p>
        `
        }

        <div style="text-align: center; margin: 40px 0;">
          <a href="${upgradeLink}" style="background-color: #3B82F6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
            ${isTrial ? "🚀 Upgrade naar Premium" : "🔄 Verlengen Abonnement"}
          </a>
        </div>

        <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <h3 style="color: #333; margin: 0 0 10px 0;">💡 Heb je vragen?</h3>
          <p style="color: #666; line-height: 1.6; margin: 0;">
            Neem contact met ons op via <a href="mailto:${
              config.email
            }" style="color: #3B82F6; text-decoration: none;">${
              config.email
            }</a><br/>
            We helpen je graag met het kiezen van het juiste abonnement.
          </p>
        </div>

        <p style="color: #666; line-height: 1.6; margin: 30px 0;">
          Met vriendelijke groet,<br/>
          Het ${config.appTitle} Team
        </p>
      `)
    );

    logger.info("Subscription expiring email sent", {
      context: {
        userId: user.id,
        daysRemaining,
        isTrial,
      },
    });
  } catch (error) {
    logger.error("Failed to send subscription expiring email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
        daysRemaining,
      },
    });
    throw error;
  }
}

function getImagePath(imagePath: string): string | null {
  const fullPath = join(process.cwd(), "public", imagePath);
  return existsSync(fullPath) ? fullPath : null;
}

// Prepareer email attachments
function getEmailAttachments() {
  const attachments = [
    {
      filename: "logo.png",
      path: getImagePath("ainexo-logo.png"),
      cid: "logo",
    },
    {
      filename: "linkedin.png",
      path: getImagePath("social/linkedin.png"),
      cid: "linkedin",
    },
    {
      filename: "twitter.png",
      path: getImagePath("social/twitter.png"),
      cid: "twitter",
    },
    {
      filename: "instagram.png",
      path: getImagePath("social/instagram.png"),
      cid: "instagram",
    },
    {
      filename: "facebook.png",
      path: getImagePath("social/facebook.png"),
      cid: "facebook",
    },
  ]
    .filter((att): att is typeof att & { path: string } => att.path !== null)
    .map((att) => ({
      filename: att.filename,
      path: att.path,
      cid: att.cid,
    })); // Filter out missing images and ensure proper typing

  // Log warning voor missende afbeeldingen
  const totalExpected = 5;
  if (attachments.length < totalExpected) {
    logger.warn(
      `[EMAIL] ${
        totalExpected - attachments.length
      } image(s) missing from public folder`
    );
  }

  return attachments;
}

export async function sendEmail(
  email: string,
  subject: string,
  html: string,
  user?: { id: string; companyId?: string | null | undefined }
) {
  try {
    // createEmailTemplate wordt al aangeroepen door de caller
    // Dus html bevat al de volledige template
    await sendEmailViaResend(email, subject, html);
  } catch (error) {
    logger.error("Failed to send email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId: user?.id,
      companyId: user?.companyId,
    });
    throw error;
  }
}

export async function sendSubscriptionExpiredEmail(
  email: string,
  user: {
    id: string;
    name: string | null;
    subscriptionStatus: string;
  },
  daysExpired: number = 0
) {
  const isTrial = user.subscriptionStatus === "TRIAL";
  const subscriptionType = isTrial ? "trial" : "abonnement";
  const upgradeLink = `${process.env.NEXT_PUBLIC_APP_URL}/account?tab=subscription`;

  const subject =
    daysExpired === 0
      ? `Je ${subscriptionType} is verlopen`
      : `Je ${subscriptionType} is ${daysExpired} ${
          daysExpired === 1 ? "dag" : "dagen"
        } geleden verlopen`;

  try {
    await sendEmailViaResend(
      email,
      subject,
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">
          🔒 Je ${subscriptionType} is verlopen
        </h1>

        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Beste ${user.name || "gebruiker"},
        </p>

        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Je ${subscriptionType} is ${
            daysExpired === 0
              ? "vandaag"
              : daysExpired +
                (daysExpired === 1 ? " dag" : " dagen") +
                " geleden"
          } verlopen.
        </p>

        <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; margin: 20px 0;">
          <h3 style="color: #991B1B; margin: 0 0 15px 0;">⚠️ Premium features zijn nu uitgeschakeld</h3>
          <ul style="color: #991B1B; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Je kunt geen assistenten meer bewerken</li>
            <li>Je knowledge base is alleen-lezen</li>
            <li>Je chatbot widget werkt niet meer op je website</li>
            <li>Bezoekers zien geen chatbot op je site</li>
          </ul>
        </div>

        ${
          isTrial
            ? `
        <h2 style="color: #333; margin: 30px 0 15px;">🎁 Speciale trial-to-premium aanbieding</h2>
        <div style="background-color: #DBEAFE; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="color: #1E40AF; line-height: 1.6; margin: 0; font-size: 16px;">
            <strong>Upgrade vandaag nog</strong> en krijg <strong>10% korting</strong> op je eerste maand!<br/>
            Use code: <code style="background-color: #3B82F6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">TRIAL10</code>
          </p>
        </div>
        `
            : ""
        }

        <h2 style="color: #333; margin: 30px 0 15px;">✅ Heractiveer je account nu</h2>
        <p style="color: #666; line-height: 1.6;">
          ${
            isTrial
              ? "Upgrade naar een premium abonnement"
              : "Verlengen je abonnement"
          } om direct weer toegang te krijgen tot:
        </p>
        <ul style="color: #666; line-height: 1.6; padding-left: 20px;">
          <li>Al je assistenten en instellingen</li>
          <li>Complete knowledge base</li>
          <li>Actieve chatbot widget</li>
          <li>Conversatie geschiedenis</li>
          <li>Analytics en rapportages</li>
        </ul>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${upgradeLink}" style="background-color: #10B981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
            ${isTrial ? "🚀 Upgrade Naar Premium" : "🔄 Heractiveer Abonnement"}
          </a>
        </div>

        <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <h3 style="color: #92400E; margin: 0 0 10px 0;">⏰ Je data wordt bewaard</h3>
          <p style="color: #92400E; line-height: 1.6; margin: 0;">
            Maak je geen zorgen! Al je assistenten, knowledge base items en instellingen
            worden bewaard. Na heractivatie kun je direct weer aan de slag.
          </p>
        </div>

        <h2 style="color: #333; margin: 30px 0 15px;">💬 Hulp nodig?</h2>
        <p style="color: #666; line-height: 1.6;">
          Twijfel je nog of heb je vragen over de verschillende abonnementen?<br/>
          Neem contact met ons op via <a href="mailto:${
            config.email
          }" style="color: #3B82F6; text-decoration: none;">${config.email}</a>
        </p>

        <p style="color: #666; line-height: 1.6; margin: 30px 0;">
          We hopen je snel weer te zien!<br/><br/>
          Met vriendelijke groet,<br/>
          Het ${config.appTitle} Team
        </p>
      `)
    );

    logger.info("Subscription expired email sent", {
      context: {
        userId: user.id,
        daysExpired,
        isTrial,
      },
    });
  } catch (error) {
    logger.error("Failed to send subscription expired email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
      },
    });
    throw error;
  }
}

export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  company?: string; // Optional company field
  message: string;
}) {
  //const t = await getTranslations("mail.contact");

  try {
    // Send notification email to admin
    await sendEmailViaResend(
      config.email,
      `Nieuw contactformulier bericht van ${data.name}`,
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">Nieuw contactformulier bericht</h1>

        <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="color: #666; line-height: 1.6; margin: 0 0 10px 0;">
            <strong>Naam:</strong> ${data.name}
          </p>
          <p style="color: #666; line-height: 1.6; margin: 0 0 10px 0;">
            <strong>Email:</strong> <a href="mailto:${data.email}" style="color: #3B82F6; text-decoration: none;">${data.email}</a>
          </p>
          ${data.company ? `<p style="color: #666; line-height: 1.6; margin: 0 0 10px 0;">
            <strong>Bedrijf:</strong> ${data.company}
          </p>` : ''}
        </div>

        <h2 style="color: #333; margin: 30px 0 15px;">Bericht:</h2>
        <div style="background-color: #ffffff; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
          <p style="color: #666; line-height: 1.6; white-space: pre-wrap; margin: 0;">
            ${data.message}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:${data.email}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Beantwoorden
          </a>
        </div>
      `),
      data.email
    );

    // Send confirmation email to user
    await sendEmailViaResend(
      data.email,
      `Bevestiging: We hebben je bericht ontvangen`,
      await createEmailTemplate(`
        <h1 style="color: #333; margin-bottom: 20px;">Bedankt voor je bericht!</h1>

        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Beste ${data.name},
        </p>

        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Bedankt voor je bericht. We hebben je contactverzoek goed ontvangen en zullen zo spoedig mogelijk contact met je opnemen.
        </p>

        <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0;">Samenvatting van je bericht:</h3>
          <p style="color: #666; line-height: 1.6; margin: 0 0 10px 0;">
            <strong>Naam:</strong> ${data.name}
          </p>
          <p style="color: #666; line-height: 1.6; margin: 0 0 10px 0;">
            <strong>Email:</strong> ${data.email}
          </p>
          <p style="color: #666; line-height: 1.6; margin: 0 0 10px 0;">
            <strong>Bedrijf:</strong> ${data.company}
          </p>
          <p style="color: #666; line-height: 1.6; margin: 15px 0 0 0;">
            <strong>Bericht:</strong><br/>
            <span style="white-space: pre-wrap;">${data.message}</span>
          </p>
        </div>

        <div style="background-color: #DBEAFE; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <h3 style="color: #1E40AF; margin: 0 0 10px 0;">Wat gebeurt er nu?</h3>
          <p style="color: #1E40AF; line-height: 1.6; margin: 0;">
            Ons team bekijkt je bericht en neemt binnen 1-2 werkdagen contact met je op via het opgegeven emailadres.
          </p>
        </div>

        <p style="color: #666; line-height: 1.6; margin: 30px 0;">
          Met vriendelijke groet,<br/>
          Het ${config.appTitle} Team
        </p>

        <div style="background-color: #F3F4F6; border-radius: 8px; padding: 15px; margin: 30px 0;">
          <p style="color: #666; line-height: 1.6; margin: 0; font-size: 14px;">
            <strong>Vragen in de tussentijd?</strong><br/>
            Neem gerust contact met ons op via <a href="mailto:${config.email}" style="color: #3B82F6; text-decoration: none;">${config.email}</a>
          </p>
        </div>
      `)
    );

    logger.info("Contact form email sent", {
      context: {
        name: data.name,
        email: data.email,
        company: data.company,
      },
    });
  } catch (error) {
    logger.error("Failed to send contact form email", {
      context: {
        error: error instanceof Error ? error.message : String(error),
        name: data.name,
        email: data.email,
      },
    });
    throw error;
  }
}
