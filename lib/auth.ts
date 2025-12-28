// lib/auth.ts (updated version with 2FA support)
import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { logSecurityEvent, sanitizeIp } from "./security";
import { User, UserRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { recordFailedLogin, resetFailedLogins } from "./login-tracking";

// Import CredentialsSignin error for proper error handling
class CredentialsSignin extends Error {
  type = "CredentialsSignin" as const;
}

interface ExtendedUser extends User {
  role: UserRole;
  requires2FA: boolean;
  twoFactorAuthenticated: boolean;
  companyId: string;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes in seconds
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const t = await getTranslations();

        const user = await db.user.findFirst({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            role: true,
            twoFactorEnabled: true,
            twoFactorVerified: true,
            companyId: true,
            isActive: true,
            emailVerified: true,
          },
        });

        if (!user || !user.password) {
          // Track failed login attempt
          recordFailedLogin(credentials.email);

          // Log failed login attempt
          const ipAddress = sanitizeIp(
            (req?.headers?.["x-forwarded-for"] as string) || null
          );
          await logSecurityEvent(
            undefined,
            undefined,
            "login_failed",
            ipAddress,
            req?.headers?.["user-agent"] || "",
            t("error.userNotFoundOrMissingPassword")
          );
          return null;
        }

        // Check if user is active
        if (!user.isActive) {
          // Track failed login attempt
          recordFailedLogin(credentials.email);

          // Log failed login attempt
          const ipAddress = sanitizeIp(
            (req?.headers?.["x-forwarded-for"] as string) || null
          );
          await logSecurityEvent(
            user.id,
            user.companyId || undefined,
            "login_failed",
            ipAddress,
            req?.headers?.["user-agent"] || "",
            t("error.accountDeactivated")
          );
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          // Track failed login attempt
          recordFailedLogin(credentials.email);

          // Log failed login attempt
          const ipAddress = sanitizeIp(
            (req?.headers?.["x-forwarded-for"] as string) || null
          );
          await logSecurityEvent(
            user.id,
            user.companyId || undefined,
            "login_failed",
            ipAddress,
            req?.headers?.["user-agent"] || "",
            t("error.wrongPassword")
          );
          return null;
        }

        // Password is valid - reset failed login counter
        resetFailedLogins(credentials.email);

        // Check if email is verified
        if (!user.emailVerified) {
          // Log failed login attempt due to unverified email
          const ipAddress = sanitizeIp(
            (req?.headers?.["x-forwarded-for"] as string) || null
          );
          await logSecurityEvent(
            user.id,
            user.companyId || undefined,
            "login_failed",
            ipAddress,
            req?.headers?.["user-agent"] || "",
            t("error.emailNotVerified") || "Email not verified"
          );

          // Return null with a custom error that the frontend can detect
          // Use CredentialsSignin to properly pass error to frontend
          throw new CredentialsSignin("EMAIL_NOT_VERIFIED");
        }

        // If 2FA is enabled, don't fully authorize yet
        if (user.twoFactorEnabled) {
          // Return a special value to indicate 2FA is required
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            requires2FA: true,
            twoFactorAuthenticated: false,
            companyId: user.companyId,
          };
        }

        // For users without 2FA, log successful login
        const ipAddress = sanitizeIp(
          (req?.headers?.["x-forwarded-for"] as string) || null
        );
        await logSecurityEvent(
          user.id,
          user.companyId || undefined,
          "login_success",
          ipAddress,
          req?.headers?.["user-agent"] || "",
          "Login without 2FA"
        );

        // Return user without 2FA flag
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          requires2FA: false,
          twoFactorAuthenticated: false,
          companyId: user.companyId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        // Update the token when the session is manually updated
        return { ...token, ...session.user };
      }

      if (user) {
        token.id = user.id;
        token.email = user.email as string;
        token.name = user.name as string;
        token.image = (user as ExtendedUser).image;
        token.role = (user as ExtendedUser).role;
        token.requires2FA = (user as ExtendedUser).requires2FA;
        token.twoFactorAuthenticated = (
          user as ExtendedUser
        ).twoFactorAuthenticated;
        token.companyId = (user as ExtendedUser).companyId;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string | null;
        session.user.role = token.role as string;
        session.user.requires2FA = token.requires2FA as boolean;
        session.user.twoFactorAuthenticated =
          token.twoFactorAuthenticated as boolean;
        session.user.companyId = token.companyId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle logout redirect
      if (url.includes("signout") || url.includes("logout")) {
        return `${baseUrl}/login`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      // Additional event handling can be added here
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}
