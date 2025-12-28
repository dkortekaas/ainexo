"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TestTube, ArrowUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssistant } from "@/contexts/assistant-context";
import { useToast } from "@/components/ui/use-toast";

// Import tab components
import { LookAndFeelTab } from "@/components/settings/tabs/LookAndFeelTab";
import { ActionButtonsTab } from "@/components/settings/tabs/ActionButtonsTab";
import { FormsTab } from "@/components/settings/tabs/FormsTab";
import { IntegrationsTab } from "@/components/settings/tabs/IntegrationsTab";
import { WidgetTab } from "@/components/settings/tabs/WidgetTab";
import { PageHeader } from "@/components/layouts";
import { useTranslations } from "next-intl";

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("look-and-feel");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { currentAssistant } = useAssistant();
  const { toast } = useToast();
  const t = useTranslations("settings");

  const tabs = useMemo(
    () => [
      {
        id: "look-and-feel",
        name: t("lookAndFeel"),
        component: LookAndFeelTab,
      },
      {
        id: "action-buttons",
        name: t("actionButtons"),
        component: ActionButtonsTab,
      },
      { id: "forms", name: t("forms"), component: FormsTab },
      {
        id: "integrations",
        name: t("integrations"),
        component: IntegrationsTab,
      },
      { id: "widget", name: t("widget"), component: WidgetTab },
    ],
    [t]
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.find((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, tabs]);

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  const handleSaveAll = async () => {
    if (!currentAssistant || !hasChanges) return;

    setIsSaving(true);
    try {
      // The individual tabs handle their own saving
      // This is just a placeholder for future global save functionality
      toast({
        title: t("success"),
        description: t("allChangesSavedSuccessfully"),
        variant: "success",
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: t("error"),
        description: t("failedToSaveChanges"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageHeader
          title={t("chatbotSettings")}
          description={t("chatbotSettingsDescription")}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasChanges || isSaving}
            onClick={handleSaveAll}
            className="flex items-center space-x-2"
          >
            <ArrowUp className="w-4 h-4" />
            <span>
              {isSaving
                ? t("saving")
                : hasChanges
                  ? t("saveChanges")
                  : t("noChanges")}
            </span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {ActiveComponent && <ActiveComponent onChanges={setHasChanges} />}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
