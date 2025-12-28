// Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  Mail,
  Bell,
  Home,
  LogOut,
  X,
  Shield,
  CreditCard,
  Bot,
  Library,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import config from "@/config";
import Image from "next/image";
import UserMenu from "@/components/layouts/UserMenu";

type SidebarProps = {
  userRole?: string;
  isOpen: boolean;
  onClose: () => void;
  hasValidSubscription?: boolean;
};

export default function Sidebar({
  userRole,
  isOpen,
  onClose,
  hasValidSubscription = true,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = userRole === "ADMIN";
  const isSuperuser = userRole === "SUPERUSER";
  const [isMobile, setIsMobile] = useState(false);
  const t = useTranslations();

  // Check if current route is active
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  // Responsiveness detection
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Navigation items
  const navItems = [
    {
      href: isSuperuser ? "/admindashboard" : "/dashboard",
      title: isSuperuser ? "AdminDashboard" : t("common.navigation.dashboard"),
      icon: <Home className="w-6 h-6" />,
      activePath: isSuperuser ? "/admindashboard" : "/dashboard",
      sequence: 1,
    },
    {
      href: "/knowledgebase",
      title: t("common.navigation.knowledgeBase"),
      icon: <Library className="w-6 h-6" />,
      activePath: "/knowledgebase",
      sequence: 2,
    },
    ...(hasValidSubscription
      ? [
          {
            href: "/conversations",
            title: t("common.navigation.conversations"),
            icon: <MessageCircle className="w-6 h-6" />,
            activePath: "/conversations",
            sequence: 3,
          },
        ]
      : []),
    {
      href: "/assistants",
      title: t("common.navigation.assistants"),
      icon: <Bot className="w-6 h-6" />,
      activePath: "/assistants",
      excludePath: "/assistants/new",
      sequence: 3,
    },
    {
      href: "/notifications",
      title: t("common.navigation.notifications"),
      icon: <Bell className="w-6 h-6" />,
      activePath: "/notifications",
      sequence: 4,
    },
    ...(isAdmin
      ? [
          {
            href: "/billing",
            title: t("common.navigation.billing"),
            icon: <Wallet className="w-6 h-6" />,
            activePath: "/billing",
            sequence: 5,
          },
          ...(hasValidSubscription === false
            ? [
                {
                  href: "/subscription/upgrade",
                  title: t("common.navigation.subscription"),
                  icon: <CreditCard className="w-6 h-6" />,
                  activePath: "/subscription/upgrade",
                  sequence: 6,
                },
              ]
            : []),
        ]
      : []),
  ];

  // Superuser specific items
  const superuserItems = [
    {
      href: "/admin",
      title: t("common.navigation.admin"),
      icon: <Shield className="w-6 h-6" />,
      activePath: "/admin",
      sequence: 10,
    },
  ];

  // Mobile fullscreen sidebar
  if (isMobile) {
    return (
      <>
        {/* Overlay for mobile */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={onClose}
          />
        )}

        {/* Mobile sidebar */}
        <div
          className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out w-64 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto 
            ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Link
              href={isSuperuser ? "/admindashboard" : "/dashboard"}
              className="text-xl font-bold text-primary dark:text-blue-400"
            >
              {config.appTitle}
            </Link>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4">
            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              {t("common.navigation.menu")}
            </p>
            <nav className="space-y-1">
              {[...navItems]
                .sort((a, b) => a.sequence - b.sequence)
                .map((item) => {
                  const isItemActive =
                    isActive(item.activePath) &&
                    (item.excludePath ? !isActive(item.excludePath) : true);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isItemActive
                          ? "bg-indigo-50 dark:bg-blue-900/30 text-primary dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={onClose}
                    >
                      <div className="mr-3">{item.icon}</div>
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
            </nav>

            {/* Superuser specifieke items */}
            {isSuperuser && (
              <>
                <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-6 mb-2">
                  {t("common.navigation.admin")}
                </p>
                <nav className="space-y-1">
                  {superuserItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive(item.activePath)
                          ? "bg-indigo-50 dark:bg-blue-900/30 text-primary dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={onClose}
                    >
                      <div className="mr-3">{item.icon}</div>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </nav>
              </>
            )}

            {/* Admin specific items */}
            {isAdmin && (
              <>
                <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-6 mb-2">
                  {t("common.navigation.admin")}
                </p>
                <nav className="space-y-1">
                  {/* {adminItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive(item.activePath)
                          ? "bg-indigo-50 dark:bg-blue-900/30 text-primary dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={onClose}
                    >
                      <div className="mr-3">{item.icon}</div>
                      <span>{item.title}</span>
                    </Link>
                  ))} */}
                </nav>
              </>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-4">
              {/* User menu on mobile */}
              <div className="px-4 mb-3">
                <UserMenu />
              </div>
              <button
                onClick={async () => {
                  await signOut({ redirect: false });
                  router.push("/login");
                }}
                className="flex items-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 w-full"
              >
                <LogOut className="w-6 h-6 mr-3" />
                <span>{t("common.navigation.logout")}</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop compact sidebar
  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`bg-white dark:bg-gray-800 shadow-lg fixed left-0 top-0 h-screen z-40 transition-transform duration-200 ease-in-out w-20
          ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}`}
      >
        {/* Logo/header area */}
        <div className="flex justify-center h-[86px] py-2 border-b border-gray-200 dark:border-gray-700">
          <Link
            href={isSuperuser ? "/admindashboard" : "/dashboard"}
            className="w-full h-full rounded-md flex items-center justify-center text-white font-bold"
          >
            <Image
              src={config.appIcon}
              alt={config.appTitle}
              className="h-10 w-auto object-contain"
              width={80}
              height={80}
            />
          </Link>
        </div>

        {/* Main nav items */}
        <div className="px-3 mt-6 space-y-1">
          {[...navItems]
            .sort((a, b) => a.sequence - b.sequence)
            .map((item, index) => {
              const isItemActive =
                isActive(item.activePath) &&
                (item.excludePath ? !isActive(item.excludePath) : true);

              return (
                <div key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className={`flex items-center justify-center py-3 px-3 rounded-lg transition-colors ${
                      isItemActive
                        ? "bg-indigo-50 dark:bg-blue-900/30 text-primary dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div>{item.icon}</div>
                  </Link>
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {item.title}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Superuser navigatie items */}
        {isSuperuser && (
          <div className="px-3 mt-6 space-y-1">
            {superuserItems.map((item) => (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={`flex items-center justify-center py-3 px-3 rounded-lg transition-colors ${
                    isActive(item.activePath)
                      ? "bg-indigo-50 dark:bg-blue-900/30 text-primary dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div>{item.icon}</div>
                </Link>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin specific items */}
        {/* {isAdmin && (
          <div className="px-3 mt-6 space-y-1">
            {adminItems.map((item) => (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={`flex items-center justify-center py-3 px-3 rounded-lg transition-colors ${
                    isActive(item.activePath)
                      ? "bg-indigo-50 dark:bg-blue-900/30 text-primary dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div>{item.icon}</div>
                </Link>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        )} */}
      </div>

      {/* Ruimte reserveren zodat content niet onder de sidebar komt */}
      <div className="ml-20" />
    </>
  );
}
