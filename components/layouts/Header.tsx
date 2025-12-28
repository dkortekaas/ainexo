// Header.tsx
"use client";

import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import UserMenu from "@/components/layouts/UserMenu";
import NotificationDropdown from "@/components/layouts/NotificationDropdown";
import { ThemeToggle } from "@/components/layouts/ThemeToggle";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import config from "@/config";
import { AssistantSwitcher } from "@/components/layouts/AssistantSwitcher";
import LanguageSelector from "@/components/layouts/LanguageSelector";

type HeaderProps = {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
};

export default function Header({ toggleSidebar, isSidebarOpen }: HeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    // Reset search after submission on mobile
    if (isMobile) {
      setShowSearch(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm px-4 md:px-6 py-2 md:py-4 flex justify-between items-center sticky top-0 z-20 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 mr-2 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label={isSidebarOpen ? t("closeSidebar") : t("openSidebar")}
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        )}

        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 ml-2">
          {config.appTitle}
        </h1>
        <div className="ml-4">
          <AssistantSwitcher />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <LanguageSelector />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications dropdown */}
        {!isMobile && <NotificationDropdown />}

        {/* User Menu component - hidden on mobile, shown in sidebar */}
        {!isMobile && <UserMenu />}
      </div>

      {/* Mobile search overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-white dark:bg-gray-800 z-50 p-4">
          <div className="flex items-center mb-4">
            <button
              onClick={() => setShowSearch(false)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-4 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  );
}
