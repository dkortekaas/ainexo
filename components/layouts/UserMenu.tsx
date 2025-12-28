"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown, Users, Key } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui";

export default function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

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

  // Close dropdown when clicking outside on desktop
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        !isMobile &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  // Lock body scroll when fullscreen menu is open on mobile
  useEffect(() => {
    if (isFullscreenOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreenOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    setIsFullscreenOpen(false);
    await signOut({ redirect: false });
    router.push("/login");
  };

  const handleAccount = () => {
    setIsOpen(false);
    setIsFullscreenOpen(false);
    router.push("/account");
  };

  const handleTeam = () => {
    setIsOpen(false);
    setIsFullscreenOpen(false);
    router.push("/account?tab=team");
  };

  const handlePasswordChange = () => {
    setIsOpen(false);
    setIsFullscreenOpen(false);
    router.push("/account?tab=change-password");
  };

  if (!session?.user) {
    return null;
  }

  const userInitials = session.user.name
    ? session.user.name
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // Desktop dropdown
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto"
        >
          <Avatar className="w-8 h-8">
            {session.user.image && (
              <AvatarImage
                src={session.user.image}
                alt={session.user.name || t("common.user")}
              />
            )}
            <AvatarFallback className="bg-primary text-white text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900">
              {session.user.name}
            </span>
            <span className="text-xs text-gray-500">{session.user.email}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 mt-2" sideOffset={8}>
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-gray-900">
            {session.user.name}
          </p>
          <p className="text-xs text-gray-500">{session.user.email}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleAccount} className="cursor-pointer">
          <User className="w-4 h-4 mr-2" />
          {t("userMenu.myAccount")}
        </DropdownMenuItem>

        {(session?.user?.role === "ADMIN" ||
          session?.user?.role === "SUPERUSER") && (
          <DropdownMenuItem onClick={handleTeam} className="cursor-pointer">
            <Users className="w-4 h-4 mr-2" />
            {t("userMenu.team")}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={handlePasswordChange}
          className="cursor-pointer"
        >
          <Key className="w-4 h-4 mr-2" />
          {t("userMenu.changePassword")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t("userMenu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
