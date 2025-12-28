// request.ts
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const locales = ["nl", "en", "de", "fr", "es"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = (await requestLocale) || "nl"; // Default to Dutch

  // Ensure that a valid locale is used
  if (!locales.includes(locale as Locale)) {
    locale = "nl";
  }

  // Get user's language preference from the database if logged in
  const session = await getAuthSession();

  // Note: language field doesn't exist in User model yet, so we skip this for now
  // if (session?.user?.id) {
  //   const user = await db.user.findUnique({
  //     where: { id: session.user.id },
  //     select: { language: true },
  //   });
  //   if (user?.language && locales.includes(user.language as Locale)) {
  //     locale = user.language;
  //   }
  // }

  // Fallback to cookie if no user preference
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get("NEXT_LOCALE")?.value;
  if (cookieLanguage && locales.includes(cookieLanguage as Locale)) {
    locale = cookieLanguage;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
