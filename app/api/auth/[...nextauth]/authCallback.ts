// app/api/auth/[...nextauth]/authCallback.ts
import { NextApiRequest, NextApiResponse } from "next";
import { JWT } from "next-auth/jwt";
import { getCookie } from "cookies-next";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Custom NextAuth callback to handle 2FA flow
 */
export default async function authCallback(
  req: NextApiRequest,
  res: NextApiResponse,
  token: JWT
) {
  try {
    // Handle 2FA requirement flag
    if (token.requires2FA && !token.twoFactorAuthenticated) {
      // Check for trusted device
      const userId = token.id as string;
      const trustedDeviceId = getCookie("trusted_device", { req, res });

      // if (trustedDeviceId) {
      //   // Look up the trusted device
      //   const trustedDevice = await db.trustedDevice.findUnique({
      //     where: {
      //       userId_deviceIdentifier: {
      //         userId,
      //         deviceIdentifier: trustedDeviceId as string,
      //       },
      //     },
      //   });

      //   // If device is trusted and not expired, skip 2FA
      //   if (trustedDevice && new Date() < trustedDevice.expiresAt) {
      //     // Update last used timestamp
      //     await db.trustedDevice.update({
      //       where: { id: trustedDevice.id },
      //       data: { lastUsedAt: new Date() },
      //     });

      //     // Set as 2FA authenticated
      //     token.twoFactorAuthenticated = true;
      //     return token;
      //   }
      // }

      // If 2FA verification needed, set a redirect URL
      token.redirectUrl = "/auth/2fa-verify";
    }

    return token;
  } catch (error) {
    logger.error("Auth callback error", {
      context: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"] as string,
    });
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
