// app/(pages)/layout.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/layouts/Header";
import Sidebar from "@/components/layouts/Sidebar";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Home, FileText, Bell, Settings, FilePlus, Shield } from "lucide-react";
import { Session } from "next-auth";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { useSubscription } from "@/lib/subscription-context";
import { AssistantProvider } from "@/contexts/assistant-context";
import InactivityTimer from "@/components/auth/InactivityTimer";

type AppLayoutProps = {
  children: React.ReactNode;
  messages?: Record<string, unknown>;
  locale?: string;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();
  // Initialize with SSR-friendly defaults to prevent CLS
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check responsiveness - optimized to reduce CLS
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // If we're on mobile, ensure sidebar is closed by default
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        // On desktop, always keep sidebar open
        setIsSidebarOpen(true);
      }
    };

    // Run immediately to sync with actual viewport
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const toggleSidebar = () => {
    // Only allow toggling on mobile
    if (isMobile) {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  return (
    <SubscriptionProvider>
      <AssistantProvider>
        <InactivityTimer />
        <AppLayoutContent
          session={session}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
          toggleSidebar={toggleSidebar}
          setIsSidebarOpen={setIsSidebarOpen}
        >
          {children}
        </AppLayoutContent>
      </AssistantProvider>
    </SubscriptionProvider>
  );
}

// Separate component to use the translations after the NextIntlClientProvider is set up
function AppLayoutContent({
  children,
  session,
  isSidebarOpen,
  isMobile,
  toggleSidebar,
  setIsSidebarOpen,
}: {
  children: React.ReactNode;
  session: Session | null;
  isSidebarOpen: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  setIsSidebarOpen: (value: boolean) => void;
}) {
  const t = useTranslations();
  const { hasValidSubscription } = useSubscription();

  return (
    <div
      className={`flex min-h-screen bg-gray-50 dark:bg-gray-900 ${isMobile ? "flex-col" : ""}`}
    >
      {/* Sidebar */}
      <Sidebar
        userRole={session?.user?.role || undefined}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        hasValidSubscription={hasValidSubscription}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {hasValidSubscription === false && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {t("subscription.noValidSubscription")}
                  <Link
                    href="/subscription/upgrade"
                    className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1"
                  >
                    {t("subscription.upgradeSubscription")}
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
          {/* Safe area for iOS bottom navigation */}
          <div className="pb-safe">{children}</div>
        </main>

        {/* Mobile bottom navigation - Hidden with CSS on desktop to prevent CLS */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-20 h-16 pb-safe"
          suppressHydrationWarning
        >
          <div
            className={`grid ${session?.user?.role === "SUPERUSER" ? "grid-cols-3" : "grid-cols-5"} h-full`}
          >
            <Link
              href={
                session?.user?.role === "SUPERUSER"
                  ? "/admindashboard"
                  : "/dashboard"
              }
              className={`flex flex-col items-center justify-center text-xs ${
                typeof window !== "undefined" &&
                (window.location.pathname === "/dashboard" ||
                  (session?.user?.role === "SUPERUSER" &&
                    window.location.pathname === "/admindashboard"))
                  ? "text-primary"
                  : "text-gray-500"
              }`}
            >
              <Home className="h-6 w-6 mb-1" />
              <span>
                {session?.user?.role === "SUPERUSER"
                  ? "AdminDashboard"
                  : t("common.navigation.dashboard")}
              </span>
            </Link>

            {session?.user?.role !== "SUPERUSER" && (
              <>
                <Link
                  href="/declarations"
                  className={`flex flex-col items-center justify-center text-xs ${
                    typeof window !== "undefined" &&
                    window.location.pathname.includes("/declarations") &&
                    !window.location.pathname.includes("/new")
                      ? "text-primary"
                      : "text-gray-500"
                  }`}
                >
                  <FileText className="h-6 w-6 mb-1" />
                  <span>{t("common.navigation.declarationsList")}</span>
                </Link>
              </>
            )}

            {session?.user?.role === "SUPERUSER" && (
              <Link
                href="/admin"
                className={`flex flex-col items-center justify-center text-xs ${
                  typeof window !== "undefined" &&
                  window.location.pathname === "/admin"
                    ? "text-primary"
                    : "text-gray-500"
                }`}
              >
                <Shield className="h-6 w-6 mb-1" />
                <span>{t("common.navigation.admin")}</span>
              </Link>
            )}

            <Link
              href="/notifications"
              className={`flex flex-col items-center justify-center text-xs ${
                typeof window !== "undefined" &&
                window.location.pathname === "/notifications"
                  ? "text-primary"
                  : "text-gray-500"
              }`}
            >
              <Bell className="h-6 w-6 mb-1" />
              <span>{t("common.navigation.notifications")}</span>
            </Link>

            <Link
              href="/settings"
              className={`flex flex-col items-center justify-center text-xs ${
                typeof window !== "undefined" &&
                window.location.pathname === "/settings"
                  ? "text-primary"
                  : "text-gray-500"
              }`}
            >
              <Settings className="h-6 w-6 mb-1" />
              <span>{t("common.navigation.settings")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
