"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useState } from "react";
import Link from "next/link";
import { type MainMenu } from "@/sanity/lib/fetch";
import Logo from "@/public/ainexo-logo.png";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/site";
import { ThemeToggle } from "@/components/layouts/ThemeToggle";
import config from "@/config";

interface HeaderClientProps {
  navLinks: MainMenu[];
}

// Helper function to ensure href has locale prefix
function getLocalizedHref(href: string, locale: string): string {
  // If href is external (starts with http:// or https://), return as is
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  // If href already starts with a locale, return as is
  if (/^\/(nl|en|de|fr|es)(\/|$)/.test(href)) {
    return href;
  }

  // If href is just "/", return "/{locale}"
  if (href === "/") {
    return `/${locale}`;
  }

  // Otherwise, prefix with locale
  return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

export const HeaderClient = ({
  navLinks: sanityNavLinks,
}: HeaderClientProps) => {
  const t = useTranslations("header");
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src={Logo}
              alt="Ainexo Logo"
              width={45}
              height={45}
              className="object-contain"
            />
            <span className="font-display text-xl font-bold text-foreground">
              {config.appTitle}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {sanityNavLinks.map((link) => (
              <Link
                key={link.name}
                href={getLocalizedHref(link.href, locale)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{t("login")}</Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href="/register">{t("startForFree")}</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {sanityNavLinks.map((link) => (
                <Link
                  key={link.name}
                  href={getLocalizedHref(link.href, locale)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <div className="flex items-center gap-2 pb-2">
                  <ThemeToggle />
                  <LanguageSwitcher />
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">{t("login")}</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link href="/register">{t("startForFree")}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
