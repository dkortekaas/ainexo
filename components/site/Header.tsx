"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/public/ainexo-logo.png";
import Image from "next/image";
import { type MenuItem } from "@/sanity/lib/fetch";

interface HeaderProps {
  navLinks: MenuItem[];
}

export const Header = ({ navLinks: sanityNavLinks }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between overflow-hidden">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group p-2">
            <Image
              src={Logo}
              alt="Ainexo Logo"
              width={80}
              height={80}
              className="object-contain"
            />
            <span className="font-display text-xl font-bold text-foreground">
              Ainexo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {sanityNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" aria-label="Login to your account" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="default" size="sm" aria-label="Start free trial" asChild>
              <Link href="/register">Start for Free</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden py-4 border-t border-border animate-fade-in"
          >
            <div className="flex flex-col gap-4">
              {sanityNavLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="outline" size="sm" aria-label="Login to your account" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" size="sm" aria-label="Start free trial" asChild>
                  <Link href="/register">Start for Free</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
