"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { languages } from "@/i18n/config";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as keyof typeof languages;
  const pathname = usePathname();
  const router = useRouter();

  const currentLanguage = languages[locale] || languages.en;

  const switchLanguage = (newLocale: string) => {
    // Remove current locale from pathname
    const pathWithoutLocale =
      pathname.replace(/^\/(nl|en|de|fr|es)(\/|$)/, "") || "/";

    // Ensure path starts with /
    const cleanPath = pathWithoutLocale.startsWith("/")
      ? pathWithoutLocale
      : `/${pathWithoutLocale}`;

    // Construct new path with new locale
    const newPath = `/${newLocale}${cleanPath === "/" ? "" : cleanPath}`;

    router.push(newPath);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-3"
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {currentLanguage.flag} {currentLanguage.name}
          </span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {routing.locales.map((loc) => {
          const lang = languages[loc as keyof typeof languages];
          if (!lang) return null;

          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => switchLanguage(loc)}
              className="cursor-pointer"
              disabled={locale === loc}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
