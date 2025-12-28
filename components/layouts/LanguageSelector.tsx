"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Globe } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import { Language } from "@/types/language";

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, update } = useSession();
  const router = useRouter();
  const t = useTranslations();

  const languages: Language[] = useMemo(
    () => [
      {
        code: "nl",
        name: "Dutch",
        nativeName: t("languageSelector.dutch"),
        flag: "🇳🇱",
      },
      {
        code: "en",
        name: "English",
        nativeName: t("languageSelector.english"),
        flag: "🇬🇧",
      },
      {
        code: "de",
        name: "German",
        nativeName: t("languageSelector.german"),
        flag: "🇩🇪",
      },
      {
        code: "fr",
        name: "French",
        nativeName: t("languageSelector.french"),
        flag: "🇫🇷",
      },
      {
        code: "es",
        name: "Spanish",
        nativeName: t("languageSelector.spanish"),
        flag: "🇪🇸",
      },
    ],
    [t]
  );

  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    languages[0]
  );

  // Load current language from session or local storage
  useEffect(() => {
    const loadLanguage = () => {
      // First try to get from session (server preference)
      if (session?.user?.language) {
        const userLang = languages.find(
          (lang) => lang.code === session.user.language
        );
        if (userLang) {
          setCurrentLanguage(userLang);
          return;
        }
      }

      // Then try local storage (browser preference)
      const storedLang = localStorage.getItem("NEXT_LOCALE");
      if (storedLang) {
        const foundLang = languages.find((lang) => lang.code === storedLang);
        if (foundLang) {
          setCurrentLanguage(foundLang);
          return;
        }
      }

      // Default to browser language or Dutch
      const browserLang = navigator.language.split("-")[0];
      const foundLang = languages.find((lang) => lang.code === browserLang);
      if (foundLang) {
        setCurrentLanguage(foundLang);
      }
    };

    loadLanguage();
  }, [session, languages]);

  const changeLanguage = async (language: Language) => {
    setCurrentLanguage(language);
    setIsOpen(false);

    // Store in browser
    localStorage.setItem("NEXT_LOCALE", language.code);

    // Set cookie for SSR
    document.cookie = `NEXT_LOCALE=${language.code}; path=/; max-age=31536000`; // 1 year

    // Save to user preferences if logged in
    if (session?.user) {
      try {
        const response = await fetch("/api/users/language", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ language: language.code }),
        });

        if (response.ok) {
          // Update session with new language
          await update({
            ...session,
            user: {
              ...session.user,
              language: language.code,
            },
          });

          toast({
            title: t("languageSelector.languageChanged"),
            description: t("languageSelector.languageChangedDescription", {
              language: language.nativeName,
            }),
            variant: "success",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Error updating language preference:", error);
      }
    }

    // Refresh the page to apply the new language
    router.refresh();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto"
          aria-label={t("languageSelector.selectLanguage")}
        >
          <Globe className="h-5 w-5 text-gray-900" />
          <span className="text-sm text-gray-900 font-medium hidden md:inline-block">
            {currentLanguage.flag} {currentLanguage.nativeName}
          </span>
          <span className="text-sm text-gray-900 font-medium md:hidden">
            {currentLanguage.flag}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48 mt-2" sideOffset={8}>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language)}
            className="cursor-pointer"
          >
            <span className="mr-2">{language.flag}</span>
            {language.nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
