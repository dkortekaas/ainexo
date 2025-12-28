// middleware.ts
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "@/i18n/routing";

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

// Paths that don't require authentication and should not have locale prefix
const noLocalePaths = [
  "/login",
  "/register",
  "/2fa-verify",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/accept-invitation",
  "/beta-registration",
  "/studio",
];

// Paths that don't require authentication
const publicPaths = [
  "/",
  "/pricing",
  "/contact",
  "/blog",
  "/privacy-policy",
  "/terms-of-service",
  "/cookies-policy",
  "/about-us",
  "/features",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/accept-invitation",
  "/beta-registration",
  "/studio", // Sanity Studio has its own authentication
];

// Paths related to 2FA that are accessible during partial authentication
const twoFactorPaths = ["/2fa-verify"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip processing for API routes, static files, etc.
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api/") ||
    path.includes("/images/") ||
    path.includes(".") || // For static files
    path.includes("/api/auth/signout") // Skip middleware for signout
  ) {
    return NextResponse.next();
  }

  // Extract the path without locale if present
  const pathWithoutLocale = path.replace(/^\/(nl|en|de|fr|es)/, "") || "/";

  // Check if the current path has a locale prefix
  const hasLocalePrefix = /^\/(nl|en|de|fr|es)/.test(path);

  // Check if path should not have locale prefix
  const isNoLocalePath = noLocalePaths.some(
    (noLocalePath) =>
      pathWithoutLocale === noLocalePath ||
      pathWithoutLocale.startsWith(`${noLocalePath}/`)
  );

  // Check if path is a public path (without locale)
  const isPublicPath = publicPaths.some(
    (publicPath) =>
      pathWithoutLocale === publicPath ||
      pathWithoutLocale.startsWith(`${publicPath}/`)
  );

  // Check if path is a 2FA-related path (without locale)
  const is2FAPath = twoFactorPaths.some(
    (twoFactorPath) =>
      pathWithoutLocale === twoFactorPath ||
      pathWithoutLocale.startsWith(`${twoFactorPath}/`)
  );

  // If this is a path that should not have locale prefix and it has one, remove it
  if (isNoLocalePath && hasLocalePrefix) {
    const url = new URL(pathWithoutLocale, req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // Allow public paths without authentication check
  if (isPublicPath || isNoLocalePath) {
    // For public paths with locale prefix, use next-intl
    if (isPublicPath && !isNoLocalePath) {
      return intlMiddleware(req);
    }
    // For no-locale paths (like /login), just continue
    return NextResponse.next();
  }

  // For protected routes, check authentication
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not authenticated, redirect to login without locale
  if (!token) {
    const url = new URL(`/login`, req.url);
    // Only set callbackUrl if we're not already on a public path
    if (pathWithoutLocale !== "/" && pathWithoutLocale !== "/login") {
      url.searchParams.set("callbackUrl", req.url);
    }
    return NextResponse.redirect(url);
  }

  // If the user requires 2FA but hasn't completed it yet
  if (token.requires2FA === true && token.twoFactorAuthenticated !== true) {
    // If already on a 2FA path, allow access
    if (is2FAPath) {
      return NextResponse.next();
    } else {
      // Redirect to 2FA verification without locale
      const url = new URL(`/2fa-verify`, req.url);
      if (token.email) {
        url.searchParams.set("email", token.email as string);
      }
      url.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(url);
    }
  }

  // For all other cases, continue with the request
  const response = NextResponse.next();

  // Add comprehensive security headers
  addSecurityHeaders(response);

  return response;
}

/**
 * Add comprehensive security headers to protect against common web vulnerabilities
 */
function addSecurityHeaders(response: NextResponse): void {
  const headers = response.headers;

  // Content-Security-Policy (CSP)
  // Prevents XSS attacks by controlling which resources can be loaded
  // Note: 'unsafe-inline' is needed for Next.js inline styles and scripts
  // Consider implementing nonce-based CSP for production for stronger security
  const cspDirectives = [
    "default-src 'self'",
    // Removed 'unsafe-eval' for better security - Next.js doesn't require it
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://*.sentry.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    // Added Sentry, Stripe, Upstash, OpenAI, and Sanity to connect-src
    "connect-src 'self' https://api.openai.com https://*.sentry.io https://*.stripe.com https://*.upstash.io wss://*.upstash.io https://*.sanity.io https://*.apicdn.sanity.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  headers.set("Content-Security-Policy", cspDirectives);

  // X-Frame-Options
  // Prevents clickjacking attacks by preventing the site from being embedded in iframes
  headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options
  // Prevents MIME sniffing attacks by forcing browsers to respect Content-Type headers
  headers.set("X-Content-Type-Options", "nosniff");

  // Strict-Transport-Security (HSTS)
  // Forces browsers to use HTTPS for all future connections (1 year)
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // X-XSS-Protection
  // Enables browser's built-in XSS filter (legacy but still useful)
  headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy
  // Controls how much referrer information is sent with requests
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy (formerly Feature-Policy)
  // Controls which browser features and APIs can be used
  const permissionsPolicy = [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "interest-cohort=()",
    "payment=()",
    "usb=()",
  ].join(", ");
  headers.set("Permissions-Policy", permissionsPolicy);

  // X-Permitted-Cross-Domain-Policies
  // Prevents Adobe Flash and PDF files from accessing content
  headers.set("X-Permitted-Cross-Domain-Policies", "none");

  // X-DNS-Prefetch-Control
  // Controls DNS prefetching to prevent privacy leaks
  headers.set("X-DNS-Prefetch-Control", "off");
}

// Specify paths that should run the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * Including locale paths like /nl/, /en/, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
