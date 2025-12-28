"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { PersonalDetailsTab } from "@/components/account/PersonalDetailsTab";
import { EmailSettingsTab } from "@/components/account/EmailSettingsTab";
import { ChangePasswordTab } from "@/components/account/ChangePasswordTab";
import { TwoFactorTab } from "@/components/account/TwoFactorTab";
import { TeamTab } from "@/components/account/TeamTab";
import { DeleteAccountTab } from "@/components/account/DeleteAccountTab";
import { useTranslations } from "next-intl";

function AccountPageContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("personal-details");
  const t = useTranslations();

  const tabs = useMemo(() => {
    const baseTabs = [
      {
        id: "personal-details",
        name: t("account.tabs.personalDetails"),
        component: PersonalDetailsTab,
      },
      {
        id: "email-settings",
        name: t("account.tabs.emailSettings"),
        component: EmailSettingsTab,
      },
      {
        id: "change-password",
        name: t("account.tabs.changePassword"),
        component: ChangePasswordTab,
      },
      {
        id: "two-factor",
        name: t("account.tabs.twoFactor"),
        component: TwoFactorTab,
      },
    ];

    // Only show team tab for Admin and Superuser
    if (
      session?.user?.role === "ADMIN" ||
      session?.user?.role === "SUPERUSER"
    ) {
      baseTabs.push({
        id: "team",
        name: t("account.tabs.team"),
        component: TeamTab,
      });
    }

    // Add delete account tab
    baseTabs.push({
      id: "delete-account",
      name: t("account.tabs.deleteAccount"),
      component: DeleteAccountTab,
    });

    return baseTabs;
  }, [t, session?.user?.role]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.find((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, tabs]);

  // Reset activeTab if user doesn't have access to the current tab
  useEffect(() => {
    const currentTab = tabs.find((tab) => tab.id === activeTab);
    if (!currentTab) {
      setActiveTab("personal-details");
    }
  }, [tabs, activeTab]);

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("account.myAccount")}
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm rounded-none",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.name}
            </Button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">{ActiveComponent && <ActiveComponent />}</div>
    </div>
  );
}

export default function AccountPage() {
  const t = useTranslations();

  return (
    <Suspense fallback={<div>{t("common.statuses.loading")}</div>}>
      <AccountPageContent />
    </Suspense>
  );
}
